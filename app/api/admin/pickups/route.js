import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongo';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// GET - Fetch pickups with filters
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.role || !['admin', 'buyer'].includes(decoded.role)) {
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

    // Scope buyers to their own pickups; admins see all
    if (decoded.role === 'buyer') {
      filter.buyerId = new ObjectId(decoded.userId);
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

    console.log('🔍 Delivery lookup result:', delivery ? 'Found' : 'Not found');
    if (delivery) {
      console.log('🔍 Delivery details:', {
        deliveryId: delivery._id.toString(),
        productId: delivery.productId.toString(),
        sellerId: delivery.sellerId?.toString(),
        adminId: delivery.adminId?.toString(),
        status: delivery.status,
        orderId: delivery.orderId || 'No orderId field'
      });
    }

    if (!delivery) {
      return NextResponse.json({ 
        error: 'Delivery not found for this product' 
      }, { status: 404 });
    }

    // CRITICAL: Check if delivery is completed (pickup can only be scheduled after delivery)
    if (delivery.status !== 'completed') {
      return NextResponse.json({ 
        error: 'Pickup can only be scheduled after delivery is completed' 
      }, { status: 400 });
    }

    // CRITICAL: First, find the admin schedule to get the correct admin ID
    let scheduleObjectId;
    try {
      scheduleObjectId = new ObjectId(adminScheduleId);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid admin schedule ID' }, { status: 400 });
    }

    // Find the admin schedule first to get the correct admin ID
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

    // Check if the SPECIFIC ORDER (that this delivery belongs to) is assigned to the admin who owns this schedule
    const scheduleAdminIdStr = adminSchedule.adminId.toString();
    
    console.log('🔍 Checking if the specific order is assigned to admin:', scheduleAdminIdStr);
    
    // Since delivery doesn't have orderId, we need to find the order through the product
    // Find the order_status that contains this product and is assigned to the schedule's admin
    console.log('🔍 Looking for order_status with:', {
      productId: productObjectId.toString(),
      buyerId: decoded.userId,
      scheduleAdminId: scheduleAdminIdStr
    });
    
    const orderStatus = await db.collection('order_status').findOne({
      productId: productObjectId,
      buyerId: new ObjectId(decoded.userId), // Ensure this is the buyer's order
      $or: [
        { assignedAdminId: scheduleAdminIdStr },
        { assignedAdminId: new ObjectId(scheduleAdminIdStr) }
      ]
    });

    console.log('🔍 Order status lookup result:', orderStatus ? 'Found' : 'Not found');

    if (!orderStatus) {
      console.log('🔍 Order not found or not assigned to admin:', scheduleAdminIdStr);
      
      // Let's check what orders this buyer has
      const buyerOrders = await db.collection('order_status').find({
        buyerId: new ObjectId(decoded.userId)
      }).toArray();
      
      console.log('🔍 Buyer orders found:', buyerOrders.length);
      console.log('🔍 Buyer order admin IDs:', buyerOrders.map(os => os.assignedAdminId));
      
      return NextResponse.json({ 
        error: `This product's order is not assigned to admin ${scheduleAdminIdStr}. Only orders assigned to this admin can book their schedules.` 
      }, { status: 403 });
    }

    // Get the assigned admin ID from the found order
    const assignedAdminId = orderStatus.assignedAdminId;
    
    console.log('🔍 Found matching order:', {
      orderId: orderStatus.orderId,
      assignedAdminId: assignedAdminId.toString(),
      scheduleAdminId: scheduleAdminIdStr,
      match: assignedAdminId.toString() === scheduleAdminIdStr
    });

    // Validate admin schedule exists, has available slots, and belongs to the assigned admin
    // scheduleObjectId is already declared above, no need to redeclare

    // Validate that the schedule belongs to the assigned admin (double-check)
    if (adminSchedule.adminId.toString() !== assignedAdminId.toString()) {
      return NextResponse.json({ 
        error: 'Schedule does not belong to your assigned admin' 
      }, { status: 403 });
    }

    console.log('🔍 Schedule validation successful:', {
      scheduleId: scheduleObjectId.toString(),
      scheduleAdminId: adminSchedule.adminId.toString(),
      assignedAdminId: assignedAdminId.toString(),
      match: adminSchedule.adminId.toString() === assignedAdminId.toString()
    });

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

    // Check if pickup date is after delivery date
    const deliveryDate = new Date(delivery.updatedAt || delivery.createdAt);
    const pickupDate = new Date(adminSchedule.date);
    
    if (pickupDate <= deliveryDate) {
      return NextResponse.json({ 
        error: 'Pickup date must be after delivery completion date' 
      }, { status: 400 });
    }

    // Create pickup booking
    const newPickup = {
      productId: productObjectId,
      buyerId: new ObjectId(decoded.userId),
      sellerId: delivery.sellerId,
      adminId: new ObjectId(assignedAdminId), // Use assigned admin ID
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

    console.log('✅ Pickup booked successfully:', {
      productId: productObjectId.toString(),
      buyerId: decoded.userId,
      adminId: assignedAdminId.toString(),
      scheduleId: scheduleObjectId.toString(),
      deliveryId: deliveryObjectId.toString()
    });

    return NextResponse.json({ 
      success: true, 
      data: newPickup,
      message: 'Pickup booked successfully with your assigned admin' 
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
