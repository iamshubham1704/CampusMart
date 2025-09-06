import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongo';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// GET - Get available delivery schedules for seller from their assigned admin
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'seller') {
      return NextResponse.json({ error: 'Seller access required' }, { status: 403 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');
    const { searchParams } = new URL(request.url);
    
    const type = searchParams.get('type') || 'delivery';
    const status = searchParams.get('status') || 'active';
    const date = searchParams.get('date');
    const productId = searchParams.get('productId');

    console.log('🔍 Seller schedules request:', {
      sellerId: decoded.userId,
      type,
      status,
      date,
      productId
    });

    // First, try to get seller's assigned admin from admin_team_assignments collection
    let assignedAdminId = null;
    let assignmentMethod = 'team_assignment';
    
    const teamAssignment = await db.collection('admin_team_assignments').findOne({
      userId: new ObjectId(decoded.userId),
      userType: 'seller',
      status: 'active'
    });

    if (teamAssignment) {
      assignedAdminId = teamAssignment.assignedAdminId;
      console.log('🔍 Found admin team assignment for seller:', assignedAdminId.toString());
    } else {
      // Fallback: Check order assignments (backward compatibility)
      console.log('🔍 No admin team assignment found, checking order assignments...');
      
      // Build query for seller orders with assigned admins
      let orderQuery = {
        sellerId: new ObjectId(decoded.userId),
        assignedAdminId: { $exists: true, $ne: null }
      };

      // If productId is provided, filter by that specific product
      if (productId) {
        orderQuery.productId = new ObjectId(productId);
        console.log('🔍 Filtering orders by productId:', productId);
      }

      const sellerOrders = await db.collection('order_status').find(orderQuery).toArray();

      console.log('🔍 Found seller orders with admin assignments:', sellerOrders.length);
      console.log('🔍 Order details:', sellerOrders.map(order => ({
        orderId: order._id.toString(),
        sellerId: order.sellerId.toString(),
        assignedAdminId: order.assignedAdminId?.toString(),
        status: order.status
      })));

      if (sellerOrders.length > 0) {
        // Get unique admin IDs from seller's orders
        const adminIds = [...new Set(sellerOrders.map(order => order.assignedAdminId.toString()))];
        console.log('🔍 Found admin IDs from order assignments:', adminIds);
        
        if (adminIds.length === 1) {
          assignedAdminId = new ObjectId(adminIds[0]);
          assignmentMethod = 'order_assignment';
          console.log('🔍 Using order assignment for seller:', assignedAdminId.toString());
        } else if (adminIds.length > 1) {
          // Multiple admins assigned - use the most recent one
          const mostRecentOrder = sellerOrders.sort((a, b) => new Date(b.assignedAt || b.createdAt) - new Date(a.assignedAt || a.createdAt))[0];
          assignedAdminId = mostRecentOrder.assignedAdminId;
          assignmentMethod = 'order_assignment_recent';
          console.log('🔍 Multiple admins found, using most recent:', assignedAdminId.toString());
        }
      } else {
        console.log('🔍 No orders with assigned admins found for seller');
      }
    }

    if (!assignedAdminId) {
      console.log('🔍 No admin assignment found for seller:', decoded.userId);
      return NextResponse.json({ 
        success: true, 
        data: [],
        message: 'No admin assignment found. Please contact an admin to be assigned to a team or ensure your orders have assigned admins.' 
      });
    }

    // Build query for admin schedules with future dates only
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Start of today
    
    let scheduleQuery = {
      adminId: assignedAdminId,
      type: type,
      status: status,
      date: { $gte: currentDate } // Only schedules from today onwards
    };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      // Override the date filter to use the specific date range
      scheduleQuery.date = { $gte: startOfDay, $lte: endOfDay };
    }

    // Get schedules from assigned admins
    console.log('🔍 Querying schedules with:', {
      adminId: assignedAdminId.toString(),
      type,
      status,
      dateFilter: scheduleQuery.date
    });

    const schedules = await db.collection('admin_schedules')
      .find(scheduleQuery)
      .sort({ date: 1, startTime: 1 })
      .toArray();

    console.log('🔍 Found schedules from assigned admin:', schedules.length);
    console.log('🔍 Schedule details:', schedules.map(s => ({
      id: s._id.toString(),
      adminId: s.adminId.toString(),
      date: s.date,
      type: s.type,
      status: s.status
    })));

    // Enhance schedules with availability information
    const enhancedSchedules = await Promise.all(
      schedules.map(async (schedule) => {
        // Count existing bookings for this schedule
        const existingBookings = await db.collection('deliveries').countDocuments({
          adminScheduleId: schedule._id
        });

        const availableSlots = schedule.maxSlots - existingBookings;
        const isAvailable = availableSlots > 0;

        return {
          ...schedule,
          currentSlots: existingBookings,
          availableSlots,
          isAvailable,
          assignedAdminId: schedule.adminId.toString()
        };
      })
    );

    // Filter out schedules with no available slots
    const availableSchedules = enhancedSchedules.filter(schedule => schedule.isAvailable);

    console.log('🔍 Available schedules for seller:', availableSchedules.length);

    return NextResponse.json({ 
      success: true, 
      data: availableSchedules,
      total: availableSchedules.length
    });
  } catch (error) {
    console.error('Error fetching seller schedules:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch schedules' 
    }, { status: 500 });
  }
}
