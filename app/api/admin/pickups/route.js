import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongo';
import { verifyAdminToken, verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// GET - Fetch pickups with filters
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const buyerId = searchParams.get('buyerId');
    const adminId = searchParams.get('adminId');
    const status = searchParams.get('status');
    const adminScheduleId = searchParams.get('adminScheduleId');
    const deliveryId = searchParams.get('deliveryId');

    const client = await clientPromise;
    const db = client.db('campusmart');

    let filter = {};
    
    if (buyerId) {
      try {
        filter.buyerId = new ObjectId(buyerId);
      } catch (error) {
        return NextResponse.json({ error: 'Invalid buyer ID' }, { status: 400 });
      }
    }
    
    if (adminId) {
      try {
        filter.adminId = new ObjectId(adminId);
      } catch (error) {
        return NextResponse.json({ error: 'Invalid admin ID' }, { status: 400 });
      }
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (adminScheduleId) {
      try {
        filter.adminScheduleId = new ObjectId(adminScheduleId);
      } catch (error) {
        return NextResponse.json({ error: 'Invalid admin schedule ID' }, { status: 400 });
      }
    }
    
    if (deliveryId) {
      try {
        filter.deliveryId = new ObjectId(deliveryId);
      } catch (error) {
        return NextResponse.json({ error: 'Invalid delivery ID' }, { status: 400 });
      }
    }

    // Note: Admin users can see all pickups, no additional filtering needed

    const pickups = await db.collection('pickups').aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'listings',
          localField: 'productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $lookup: {
          from: 'admin_schedules',
          localField: 'adminScheduleId',
          foreignField: '_id',
          as: 'adminSchedule'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'buyerId',
          foreignField: '_id',
          as: 'buyer'
        }
      },
      {
        $lookup: {
          from: 'deliveries',
          localField: 'deliveryId',
          foreignField: '_id',
          as: 'delivery'
        }
      },
      {
        $addFields: {
          product: { $arrayElemAt: ['$product', 0] },
          adminSchedule: { $arrayElemAt: ['$adminSchedule', 0] },
          buyer: { $arrayElemAt: ['$buyer', 0] },
          delivery: { $arrayElemAt: ['$delivery', 0] }
        }
      }
    ]).toArray();
    
    return NextResponse.json({ 
      success: true, 
      data: pickups 
    }, { status: 200 });
  } catch (error) {
    console.error('GET /api/admin/pickups error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new pickup booking
export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'buyer') {
      return NextResponse.json({ error: 'Buyer access required' }, { status: 403 });
    }

    const body = await request.json();
    let { productId, adminScheduleId, deliveryId, preferredTime, notes } = body;

    // Allow inferring productId from deliveryId if not provided by client
    if (!productId && deliveryId) {
      try {
        const client = await clientPromise;
        const db = client.db('campusmart');
        let deliveryObjectIdTmp;
        try {
          deliveryObjectIdTmp = new ObjectId(deliveryId);
        } catch (e) {
          return NextResponse.json({ error: 'Invalid delivery ID' }, { status: 400 });
        }
        const deliveryDoc = await db.collection('deliveries').findOne({ _id: deliveryObjectIdTmp });
        if (deliveryDoc?.productId) {
          productId = deliveryDoc.productId.toString();
        }
      } catch (e) {
        // fall through to validation below
      }
    }

    if (!productId || !adminScheduleId || !deliveryId) {
      return NextResponse.json({ 
        error: 'Product ID, admin schedule ID, and delivery ID are required' 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');

    // Validate product exists
    let productObjectId;
    try {
      productObjectId = new ObjectId(productId);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const product = await db.collection('listings').findOne({
      _id: productObjectId
    });

    if (!product) {
      return NextResponse.json({ 
        error: 'Product not found' 
      }, { status: 404 });
    }

    // Validate delivery exists and belongs to this product
    let deliveryObjectId;
    try {
      deliveryObjectId = new ObjectId(deliveryId);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid delivery ID' }, { status: 400 });
    }

    const delivery = await db.collection('deliveries').findOne({
      _id: deliveryObjectId,
      productId: productObjectId
    });

    if (!delivery) {
      return NextResponse.json({ 
        error: 'Delivery not found for this product' 
      }, { status: 404 });
    }

    // Validate admin schedule exists and has available slots
    let scheduleObjectId;
    try {
      scheduleObjectId = new ObjectId(adminScheduleId);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid admin schedule ID' }, { status: 400 });
    }

    const adminSchedule = await db.collection('admin_schedules').findOne({
      _id: scheduleObjectId,
      type: 'pickup',
      status: 'active'
    });

    if (!adminSchedule) {
      return NextResponse.json({ 
        error: 'Admin schedule not found or inactive' 
      }, { status: 404 });
    }

    // Check current slot usage dynamically
    const currentBookings = await db.collection('pickups').countDocuments({
      adminScheduleId: scheduleObjectId
    });
    
    if (currentBookings >= adminSchedule.maxSlots) {
      return NextResponse.json({ 
        error: 'No available slots for this schedule' 
      }, { status: 409 });
    }

    // Check if buyer already has a pickup for this delivery
    const existingPickup = await db.collection('pickups').findOne({
      deliveryId: deliveryObjectId,
      buyerId: new ObjectId(decoded.userId)
    });

    if (existingPickup) {
      return NextResponse.json({ 
        error: 'Pickup already scheduled for this delivery' 
      }, { status: 409 });
    }

    // Create pickup booking
    const newPickup = {
      productId: productObjectId,
      buyerId: new ObjectId(decoded.userId),
      sellerId: delivery.sellerId,
      adminId: adminSchedule.adminId,
      adminScheduleId: scheduleObjectId,
      deliveryId: deliveryObjectId,
      preferredTime: preferredTime || adminSchedule.startTime,
      notes: notes || '',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('pickups').insertOne(newPickup);
    newPickup._id = result.insertedId;

    // Note: We don't need to update currentSlots here because it's calculated dynamically
    // when fetching schedules. The slot count is based on the actual number of pickups
    // in the pickups collection, not a stored count.

    return NextResponse.json({ 
      success: true, 
      data: newPickup 
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/pickups error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update pickup status
export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { pickupId, status, adminNotes } = body;

    if (!pickupId || !status) {
      return NextResponse.json({ 
        error: 'Pickup ID and status are required' 
      }, { status: 400 });
    }

    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status' 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');

    let objectId;
    try {
      objectId = new ObjectId(pickupId);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid pickup ID' }, { status: 400 });
    }

    // Check if pickup exists and user has access
    const existingPickup = await db.collection('pickups').findOne({
      _id: objectId,
      $or: [
        { buyerId: new ObjectId(decoded.userId) },
        { adminId: new ObjectId(decoded.adminId || decoded.userId) }
      ]
    });

    if (!existingPickup) {
      return NextResponse.json({ 
        error: 'Pickup not found or access denied' 
      }, { status: 404 });
    }

    const update = { 
      $set: { 
        status, 
        updatedAt: new Date() 
      } 
    };
    
    if (adminNotes && decoded.role === 'admin') {
      update.$set.adminNotes = adminNotes;
    }

    const result = await db.collection('pickups').updateOne(
      { _id: objectId },
      update
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Pickup not found' }, { status: 404 });
    }

    const updatedPickup = await db.collection('pickups').findOne({ _id: objectId });

    return NextResponse.json({ 
      success: true, 
      data: updatedPickup 
    }, { status: 200 });
  } catch (error) {
    console.error('PUT /api/admin/pickups error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
