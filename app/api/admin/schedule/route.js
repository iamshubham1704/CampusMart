import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongo';
import { verifyAdminToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// GET - Get admin schedules (admin only)
export async function GET(request) {
  try {
    const decoded = await verifyAdminToken(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');
    const { searchParams } = new URL(request.url);
    
    const adminId = searchParams.get('adminId');
    const type = searchParams.get('type'); // delivery or pickup
    const status = searchParams.get('status');
    const date = searchParams.get('date');

    let query = { adminId: new ObjectId(decoded.userId) }; // Admin can only see their own schedules
    
    if (type) {
      query.type = type;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const schedules = await db.collection('admin_schedules')
      .find(query)
      .sort({ date: 1, startTime: 1 })
      .toArray();

    return NextResponse.json({ 
      success: true, 
      data: schedules 
    });
  } catch (error) {
    console.error('Error fetching admin schedules:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch schedules' 
    }, { status: 500 });
  }
}

// POST - Create new admin schedule (admin only)
export async function POST(request) {
  try {
    const decoded = await verifyAdminToken(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');
    const body = await request.json();
    const { date, startTime, endTime, type, location, maxSlots, notes } = body;

    // Validate required fields
    if (!date || !startTime || !endTime || !type || !location || !maxSlots) {
      return NextResponse.json({ 
        error: 'Date, start time, end time, type, location, and max slots are required' 
      }, { status: 400 });
    }

    // Validate type
    if (!['delivery', 'pickup'].includes(type)) {
      return NextResponse.json({ 
        error: 'Type must be either delivery or pickup' 
      }, { status: 400 });
    }

    // Validate max slots
    if (maxSlots < 1 || maxSlots > 100) {
      return NextResponse.json({ 
        error: 'Max slots must be between 1 and 100' 
      }, { status: 400 });
    }

    // Check if admin already has a schedule for this date, time, and type
    const existingSchedule = await db.collection('admin_schedules').findOne({
      adminId: new ObjectId(decoded.userId),
      date: new Date(date),
      type: type,
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    });

    if (existingSchedule) {
      return NextResponse.json({ 
        error: 'You already have a schedule that overlaps with this time slot' 
      }, { status: 409 });
    }

    // Create the schedule
    const newSchedule = {
      adminId: new ObjectId(decoded.userId),
      date: new Date(date),
      startTime,
      endTime,
      type,
      location,
      maxSlots: parseInt(maxSlots),
      currentSlots: 0,
      status: 'active',
      notes: notes || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('admin_schedules').insertOne(newSchedule);
    newSchedule._id = result.insertedId;

    console.log('✅ Admin schedule created:', {
      scheduleId: result.insertedId.toString(),
      adminId: decoded.userId,
      date: newSchedule.date,
      type: newSchedule.type,
      time: `${newSchedule.startTime} - ${newSchedule.endTime}`
    });

    return NextResponse.json({ 
      success: true, 
      data: newSchedule,
      message: 'Schedule created successfully' 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating admin schedule:', error);
    return NextResponse.json({ 
      error: 'Failed to create schedule' 
    }, { status: 500 });
  }
}

// PUT - Update admin schedule (admin only)
export async function PUT(request) {
  try {
    const decoded = await verifyAdminToken(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');
    const body = await request.json();
    const { scheduleId, date, startTime, endTime, type, location, maxSlots, status, notes } = body;

    if (!scheduleId) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 });
    }

    let scheduleObjectId;
    try {
      scheduleObjectId = new ObjectId(scheduleId);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid schedule ID' }, { status: 400 });
    }

    // Check if schedule exists and belongs to this admin
    const existingSchedule = await db.collection('admin_schedules').findOne({
      _id: scheduleObjectId,
      adminId: new ObjectId(decoded.userId)
    });

    if (!existingSchedule) {
      return NextResponse.json({ 
        error: 'Schedule not found or access denied' 
      }, { status: 404 });
    }

    // Check if there are existing bookings
    const existingBookings = await db.collection(existingSchedule.type === 'delivery' ? 'deliveries' : 'pickups')
      .countDocuments({ adminScheduleId: scheduleObjectId });

    if (existingBookings > 0) {
      return NextResponse.json({ 
        error: 'Cannot modify schedule with existing bookings' 
      }, { status: 400 });
    }

    // Update the schedule
    const updateData = {
      updatedAt: new Date()
    };

    if (date) updateData.date = new Date(date);
    if (startTime) updateData.startTime = startTime;
    if (endTime) updateData.endTime = endTime;
    if (type) updateData.type = type;
    if (location) updateData.location = location;
    if (maxSlots) updateData.maxSlots = parseInt(maxSlots);
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    await db.collection('admin_schedules').updateOne(
      { _id: scheduleObjectId },
      { $set: updateData }
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Schedule updated successfully' 
    });
  } catch (error) {
    console.error('Error updating admin schedule:', error);
    return NextResponse.json({ 
      error: 'Failed to update schedule' 
    }, { status: 500 });
  }
}

// DELETE - Delete admin schedule (admin only)
export async function DELETE(request) {
  try {
    const decoded = await verifyAdminToken(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get('id');

    if (!scheduleId) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 });
    }

    let scheduleObjectId;
    try {
      scheduleObjectId = new ObjectId(scheduleId);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid schedule ID' }, { status: 400 });
    }

    // Check if schedule exists and belongs to this admin
    const existingSchedule = await db.collection('admin_schedules').findOne({
      _id: scheduleObjectId,
      adminId: new ObjectId(decoded.userId)
    });

    if (!existingSchedule) {
      return NextResponse.json({ 
        error: 'Schedule not found or access denied' 
      }, { status: 404 });
    }

    // Check if there are existing bookings
    const existingBookings = await db.collection(existingSchedule.type === 'delivery' ? 'deliveries' : 'pickups')
      .countDocuments({ adminScheduleId: scheduleObjectId });

    if (existingBookings > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete schedule with existing bookings' 
      }, { status: 400 });
    }

    // Delete the schedule
    await db.collection('admin_schedules').deleteOne({ _id: scheduleObjectId });

    return NextResponse.json({ 
      success: true, 
      message: 'Schedule deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting admin schedule:', error);
    return NextResponse.json({ 
      error: 'Failed to delete schedule' 
    }, { status: 500 });
  }
}
