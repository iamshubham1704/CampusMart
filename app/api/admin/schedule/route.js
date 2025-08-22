import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongo';
import { verifyAdminToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// GET - Fetch admin schedules with filters
export async function GET(request) {
  try {
    let decoded = null;
    let userRole = null;
    
    // Try to get the token from the request
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    
    console.log('🔍 Token received:', token ? 'Present' : 'Missing');
    
    // Try to verify as admin first
    try {
      const adminDecoded = verifyAdminToken(request);
      if (adminDecoded) {
        decoded = adminDecoded;
        userRole = 'admin';
        console.log('✅ Admin token verified');
      }
    } catch (error) {
      console.log('❌ Admin verification failed, trying seller token');
    }
    
    // If not admin, try to verify as seller using JWT directly
    if (!decoded) {
      try {
        console.log('🔍 Attempting to verify seller token with JWT...');
        console.log('🔑 Token length:', token.length);
        console.log('🔑 Token starts with:', token.substring(0, 20) + '...');
        
        const sellerDecoded = jwt.verify(token, JWT_SECRET);
        console.log('🔍 JWT decoded payload:', {
          role: sellerDecoded.role,
          userId: sellerDecoded.userId,
          hasRole: !!sellerDecoded.role,
          roleType: typeof sellerDecoded.role
        });
        
        if (sellerDecoded && (sellerDecoded.role === 'seller' || sellerDecoded.sellerId)) {
          decoded = sellerDecoded;
          userRole = 'seller';
          console.log('✅ Seller token verified with JWT');
        } else {
          console.log('❌ Seller verification failed - role:', sellerDecoded?.role, 'sellerId:', sellerDecoded?.sellerId);
        }
      } catch (error) {
        console.log('💥 Seller JWT verification error:', error.message);
        console.log('💥 Error type:', error.name);
      }
    }
    
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    console.log('🔐 Authentication successful:', { userRole, userId: decoded.userId });

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const type = searchParams.get('type'); // 'delivery' or 'pickup'
    const adminId = searchParams.get('adminId');
    const status = searchParams.get('status'); // 'active' or 'all'
    
    // Add debug endpoint
    if (searchParams.get('debug') === 'true') {
      return NextResponse.json({
        success: true,
        debug: {
          token: token ? 'Present' : 'Missing',
          tokenLength: token?.length,
          decoded: !!decoded,
          userRole,
          userId: decoded?.userId,
          role: decoded?.role
        }
      });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');

    let filter = {};
    
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      filter.date = { $gte: startDate, $lte: endDate };
    }
    
    if (type) {
      filter.type = type;
    }
    
    // For sellers, only show active schedules
    if (userRole === 'seller') {
      filter.status = 'active';
    } else if (status) {
      filter.status = status;
    }
    
    if (adminId) {
      try {
        filter.adminId = new ObjectId(adminId);
      } catch (error) {
        return NextResponse.json({ error: 'Invalid admin ID' }, { status: 400 });
      }
    }

    const schedules = await db.collection('admin_schedules').find(filter).toArray();
    
    // For both sellers and admins, add slot availability information
    const enhancedSchedules = await Promise.all(
      schedules.map(async (schedule) => {
        // Count existing bookings for this schedule based on type
        let existingBookings = 0;
        if (schedule.type === 'delivery') {
          existingBookings = await db.collection('deliveries').countDocuments({
            adminScheduleId: schedule._id
          });
        } else if (schedule.type === 'pickup') {
          existingBookings = await db.collection('pickups').countDocuments({
            adminScheduleId: schedule._id
          });
        }
        
        return {
          ...schedule,
          currentSlots: existingBookings,
          availableSlots: (schedule.maxSlots || 10) - existingBookings,
          isAvailable: existingBookings < (schedule.maxSlots || 10)
        };
      })
    );
    
    return NextResponse.json({ 
      success: true, 
      data: enhancedSchedules,
      userRole: userRole || 'admin'
    }, { status: 200 });
  } catch (error) {
    console.error('GET /api/admin/schedule error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new admin schedule
export async function POST(request) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { date, startTime, endTime, type, location, maxSlots } = body;

    // Validation
    if (!date || !startTime || !endTime || !type || !location) {
      return NextResponse.json({ 
        error: 'Missing required fields: date, startTime, endTime, type, location' 
      }, { status: 400 });
    }

    if (!['delivery', 'pickup'].includes(type)) {
      return NextResponse.json({ 
        error: 'Type must be either "delivery" or "pickup"' 
      }, { status: 400 });
    }

    if (maxSlots && (maxSlots < 1 || maxSlots > 50)) {
      return NextResponse.json({ 
        error: 'Max slots must be between 1 and 50' 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');

    // Check if schedule already exists for this time slot
    const existingSchedule = await db.collection('admin_schedules').findOne({
      date: new Date(date),
      startTime,
      endTime,
      type,
      adminId: new ObjectId(decoded.adminId || decoded.userId)
    });

    if (existingSchedule) {
      return NextResponse.json({ 
        error: 'Schedule already exists for this time slot' 
      }, { status: 409 });
    }

    const newSchedule = {
      adminId: new ObjectId(decoded.adminId || decoded.userId),
      date: new Date(date),
      startTime,
      endTime,
      type,
      location,
      maxSlots: maxSlots || 10,
      currentSlots: 0,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('admin_schedules').insertOne(newSchedule);
    newSchedule._id = result.insertedId;

    return NextResponse.json({ 
      success: true, 
      data: newSchedule 
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/schedule error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update admin schedule
export async function PUT(request) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { scheduleId, startTime, endTime, location, maxSlots, status } = body;

    if (!scheduleId) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');

    let objectId;
    try {
      objectId = new ObjectId(scheduleId);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid schedule ID' }, { status: 400 });
    }

    // Check if schedule exists and belongs to admin
    const existingSchedule = await db.collection('admin_schedules').findOne({
      _id: objectId,
      adminId: new ObjectId(decoded.adminId || decoded.userId)
    });

    if (!existingSchedule) {
      return NextResponse.json({ 
        error: 'Schedule not found or access denied' 
      }, { status: 404 });
    }

    const update = { $set: { updatedAt: new Date() } };
    if (startTime !== undefined) update.$set.startTime = startTime;
    if (endTime !== undefined) update.$set.endTime = endTime;
    if (location !== undefined) update.$set.location = location;
    if (maxSlots !== undefined) update.$set.maxSlots = maxSlots;
    if (status !== undefined) update.$set.status = status;

    const result = await db.collection('admin_schedules').updateOne(
      { _id: objectId },
      update
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    const updatedSchedule = await db.collection('admin_schedules').findOne({ _id: objectId });

    return NextResponse.json({ 
      success: true, 
      data: updatedSchedule 
    }, { status: 200 });
  } catch (error) {
    console.error('PUT /api/admin/schedule error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete admin schedule
export async function DELETE(request) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get('id');

    if (!scheduleId) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');

    let objectId;
    try {
      objectId = new ObjectId(scheduleId);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid schedule ID' }, { status: 400 });
    }

    // Check if schedule exists and belongs to admin
    const existingSchedule = await db.collection('admin_schedules').findOne({
      _id: objectId,
      adminId: new ObjectId(decoded.adminId || decoded.userId)
    });

    if (!existingSchedule) {
      return NextResponse.json({ 
        error: 'Schedule not found or access denied' 
      }, { status: 404 });
    }

    // Check if schedule has any bookings
    const hasBookings = await db.collection('deliveries').findOne({
      adminScheduleId: objectId
    }) || await db.collection('pickups').findOne({
      adminScheduleId: objectId
    });

    if (hasBookings) {
      return NextResponse.json({ 
        error: 'Cannot delete schedule with existing bookings' 
      }, { status: 400 });
    }

    const result = await db.collection('admin_schedules').deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Schedule deleted successfully' 
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE /api/admin/schedule error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
