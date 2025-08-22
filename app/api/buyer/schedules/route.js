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

    // Get all orders for this buyer that have assigned admins
    const buyerOrders = await db.collection('order_status').find({
      buyerId: new ObjectId(decoded.userId),
      assignedAdminId: { $exists: true, $ne: null }
    }).toArray();

    if (buyerOrders.length === 0) {
      console.log('🔍 No orders with assigned admins found for buyer:', decoded.userId);
      return NextResponse.json({ 
        success: true, 
        data: [],
        message: 'No orders with assigned admins found' 
      });
    }

    // Get unique admin IDs from buyer's orders
    const adminIds = [...new Set(buyerOrders.map(order => order.assignedAdminId.toString()))];
    console.log('🔍 Admin IDs from buyer orders:', adminIds);

    // Build query for admin schedules
    let scheduleQuery = {
      adminId: { $in: adminIds.map(id => new ObjectId(id)) },
      type: type,
      status: status
    };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
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
          productId: { $in: buyerOrders.map(order => new ObjectId(order.productId)) }
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
