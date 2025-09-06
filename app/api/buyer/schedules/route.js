import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongo';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// GET - Get available pickup schedules for buyer from their assigned admin
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'buyer') {
      return NextResponse.json({ error: 'Buyer access required' }, { status: 403 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');
    const { searchParams } = new URL(request.url);
    
    const type = searchParams.get('type') || 'pickup';
    const status = searchParams.get('status') || 'active';
    const date = searchParams.get('date');

    console.log('🔍 Buyer schedules request:', {
      buyerId: decoded.userId,
      type,
      status,
      date
    });

    // First, try to get buyer's assigned admin from admin_team_assignments collection
    let assignedAdminId = null;
    let assignmentMethod = 'team_assignment';
    
    const teamAssignment = await db.collection('admin_team_assignments').findOne({
      userId: new ObjectId(decoded.userId),
      userType: 'buyer',
      status: 'active'
    });

    if (teamAssignment) {
      assignedAdminId = teamAssignment.assignedAdminId;
      console.log('🔍 Found admin team assignment for buyer:', assignedAdminId.toString());
    } else {
      // Fallback: Check order assignments (backward compatibility)
      console.log('🔍 No admin team assignment found, checking order assignments...');
      
      const buyerOrders = await db.collection('order_status').find({
        buyerId: new ObjectId(decoded.userId),
        assignedAdminId: { $exists: true, $ne: null }
      }).toArray();

      if (buyerOrders.length > 0) {
        // Get unique admin IDs from buyer's orders
        const adminIds = [...new Set(buyerOrders.map(order => order.assignedAdminId.toString()))];
        console.log('🔍 Found admin IDs from order assignments:', adminIds);
        
        if (adminIds.length === 1) {
          assignedAdminId = new ObjectId(adminIds[0]);
          assignmentMethod = 'order_assignment';
          console.log('🔍 Using order assignment for buyer:', assignedAdminId.toString());
        } else if (adminIds.length > 1) {
          // Multiple admins assigned - use the most recent one
          const mostRecentOrder = buyerOrders.sort((a, b) => new Date(b.assignedAt || b.createdAt) - new Date(a.assignedAt || a.createdAt))[0];
          assignedAdminId = mostRecentOrder.assignedAdminId;
          assignmentMethod = 'order_assignment_recent';
          console.log('🔍 Multiple admins found, using most recent:', assignedAdminId.toString());
        }
      }
    }

    if (!assignedAdminId) {
      console.log('🔍 No admin assignment found for buyer:', decoded.userId);
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
    const schedules = await db.collection('admin_schedules')
      .find(scheduleQuery)
      .sort({ date: 1, startTime: 1 })
      .toArray();

    console.log('🔍 Found schedules from assigned admins:', schedules.length);

    // Enhance schedules with availability information and delivery validation
    const enhancedSchedules = await Promise.all(
      schedules.map(async (schedule) => {
        // Count existing bookings for this schedule
        const existingBookings = await db.collection('pickups').countDocuments({
          adminScheduleId: schedule._id
        });

        const availableSlots = schedule.maxSlots - existingBookings;
        const isAvailable = availableSlots > 0;

        // Check if buyer has any completed deliveries for this admin
        const hasCompletedDelivery = await db.collection('deliveries').findOne({
          adminId: schedule.adminId,
          status: 'completed',
          buyerId: new ObjectId(decoded.userId)
        });

        return {
          ...schedule,
          currentSlots: existingBookings,
          availableSlots,
          isAvailable: isAvailable && hasCompletedDelivery, // Only available if delivery is completed
          assignedAdminId: schedule.adminId.toString(),
          requiresCompletedDelivery: true
        };
      })
    );

    // Filter out schedules with no available slots or no completed delivery
    const availableSchedules = enhancedSchedules.filter(schedule => schedule.isAvailable);

    console.log('🔍 Available schedules for buyer:', availableSchedules.length);

    return NextResponse.json({ 
      success: true, 
      data: availableSchedules,
      total: availableSchedules.length
    });
  } catch (error) {
    console.error('Error fetching buyer schedules:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch schedules' 
    }, { status: 500 });
  }
}
