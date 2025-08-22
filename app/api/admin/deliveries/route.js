import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongo';
import { verifyAdminToken, verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// GET - Fetch deliveries with filters
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Allow both admins and sellers to access this endpoint:
    // - Admins: can see all deliveries (optionally filter via query params)
    // - Sellers: scoped to their own deliveries only
    const decoded = verifyToken(request);
    if (!decoded || !decoded.role || !['admin', 'seller'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sellerId = searchParams.get('sellerId');
    const adminId = searchParams.get('adminId');
    const status = searchParams.get('status');
    const adminScheduleId = searchParams.get('adminScheduleId');
    const productId = searchParams.get('productId');

    const client = await clientPromise;
    const db = client.db('campusmart');

    let filter = {};
    
    if (sellerId) {
      try {
        filter.sellerId = new ObjectId(sellerId);
      } catch (error) {
        return NextResponse.json({ error: 'Invalid seller ID' }, { status: 400 });
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

    if (productId) {
      try {
        filter.productId = new ObjectId(productId);
      } catch (error) {
        return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
      }
    }

    // Scope sellers to their own deliveries; admins see all
    if (decoded.role === 'seller') {
      filter.sellerId = new ObjectId(decoded.userId);
    }

    const deliveries = await db.collection('deliveries').aggregate([
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
          localField: 'sellerId',
          foreignField: '_id',
          as: 'seller'
        }
      },
      {
        $addFields: {
          product: { $arrayElemAt: ['$product', 0] },
          adminSchedule: { $arrayElemAt: ['$adminSchedule', 0] },
          seller: { $arrayElemAt: ['$seller', 0] }
        }
      }
    ]).toArray();
    
    return NextResponse.json({ 
      success: true, 
      data: deliveries 
    }, { status: 200 });
  } catch (error) {
    console.error('GET /api/admin/deliveries error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new delivery booking
export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'seller') {
      return NextResponse.json({ error: 'Seller access required' }, { status: 403 });
    }

    const body = await request.json();
    const { productId, adminScheduleId, preferredTime, notes } = body;

    if (!productId || !adminScheduleId) {
      return NextResponse.json({ 
        error: 'Product ID and admin schedule ID are required' 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');

    // Validate product exists and belongs to seller
    let productObjectId;
    try {
      productObjectId = new ObjectId(productId);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const product = await db.collection('listings').findOne({
      _id: productObjectId,
      sellerId: new ObjectId(decoded.userId)
    });

    if (!product) {
      return NextResponse.json({ 
        error: 'Product not found or access denied' 
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
      type: 'delivery',
      status: 'active'
    });

    if (!adminSchedule) {
      return NextResponse.json({ 
        error: 'Admin schedule not found or inactive' 
      }, { status: 404 });
    }

    // Check current slot usage dynamically
    const currentBookings = await db.collection('deliveries').countDocuments({
      adminScheduleId: scheduleObjectId
    });
    
    if (currentBookings >= adminSchedule.maxSlots) {
      return NextResponse.json({ 
        error: 'No available slots for this schedule' 
      }, { status: 409 });
    }

    // Check if seller already has a delivery for this product
    const existingDelivery = await db.collection('deliveries').findOne({
      productId: productObjectId,
      sellerId: new ObjectId(decoded.userId)
    });

    if (existingDelivery) {
      return NextResponse.json({ 
        error: 'Delivery already scheduled for this product' 
      }, { status: 409 });
    }

    // Create delivery booking
    const newDelivery = {
      productId: productObjectId,
      sellerId: new ObjectId(decoded.userId),
      adminId: adminSchedule.adminId,
      adminScheduleId: scheduleObjectId,
      preferredTime: preferredTime || adminSchedule.startTime,
      notes: notes || '',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('deliveries').insertOne(newDelivery);
    newDelivery._id = result.insertedId;

    // Note: We don't need to update currentSlots here because it's calculated dynamically
    // when fetching schedules. The slot count is based on the actual number of deliveries
    // in the deliveries collection, not a stored count.

    return NextResponse.json({ 
      success: true, 
      data: newDelivery 
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/deliveries error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update delivery status
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
    const { deliveryId, status, adminNotes } = body;

    if (!deliveryId || !status) {
      return NextResponse.json({ 
        error: 'Delivery ID and status are required' 
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
      objectId = new ObjectId(deliveryId);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid delivery ID' }, { status: 400 });
    }

    // Check if delivery exists and user has access
    const existingDelivery = await db.collection('deliveries').findOne({
      _id: objectId,
      $or: [
        { sellerId: new ObjectId(decoded.userId) },
        { adminId: new ObjectId(decoded.adminId || decoded.userId) }
      ]
    });

    if (!existingDelivery) {
      return NextResponse.json({ 
        error: 'Delivery not found or access denied' 
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

    const result = await db.collection('deliveries').updateOne(
      { _id: objectId },
      update
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 });
    }

    const updatedDelivery = await db.collection('deliveries').findOne({ _id: objectId });

    return NextResponse.json({ 
      success: true, 
      data: updatedDelivery 
    }, { status: 200 });
  } catch (error) {
    console.error('PUT /api/admin/deliveries error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
