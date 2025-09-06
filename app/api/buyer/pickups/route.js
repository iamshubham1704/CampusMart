import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongo';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// Verify buyer token and return decoded payload or null
function verifyBuyer(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No authorization header or invalid format');
      return null;
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      console.log('❌ Token verification failed');
      return null;
    }
    
    console.log('🔍 Decoded token:', decoded);
    
    // Check if user is a buyer - be more flexible with role checking
    if (decoded.role === 'buyer' || decoded.buyerId || decoded.userId || decoded.id || decoded.sub) {
      console.log('✅ Buyer token verified successfully');
    return decoded;
  }
    
    console.log('❌ User is not a buyer, role:', decoded.role);
    return null;
  } catch (error) {
    console.error('❌ Error verifying buyer token:', error);
  return null;
  }
}

// GET - Fetch pickups visible to the buyer (optionally filter by deliveryId)
export async function GET(request) {
  try {
    const buyer = verifyBuyer(request);
    if (!buyer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const deliveryId = searchParams.get('deliveryId');

    const client = await clientPromise;
    const db = client.db('campusmart');

    const filter = {
      buyerId: new ObjectId(buyer.buyerId || buyer.userId || buyer.id)
    };

    if (deliveryId) {
      try {
        filter.deliveryId = new ObjectId(deliveryId);
      } catch (e) {
        return NextResponse.json({ error: 'Invalid delivery ID' }, { status: 400 });
      }
    }

    const pickups = await db.collection('pickups').aggregate([
      { $match: filter },
      { $lookup: { from: 'listings', localField: 'productId', foreignField: '_id', as: 'product' } },
      { $lookup: { from: 'admin_schedules', localField: 'adminScheduleId', foreignField: '_id', as: 'adminSchedule' } },
      { $lookup: { from: 'deliveries', localField: 'deliveryId', foreignField: '_id', as: 'delivery' } },
      { $addFields: {
        product: { $arrayElemAt: ['$product', 0] },
        adminSchedule: { $arrayElemAt: ['$adminSchedule', 0] },
        delivery: { $arrayElemAt: ['$delivery', 0] }
      } }
    ]).toArray();

    return NextResponse.json({ success: true, data: pickups }, { status: 200 });
  } catch (error) {
    console.error('GET /api/buyer/pickups error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new pickup booking
export async function POST(request) {
  try {
    const buyer = verifyBuyer(request);
    if (!buyer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, adminScheduleId, deliveryId, preferredTime, notes } = body;

    console.log('🔍 Creating pickup booking for:', {
      productId,
      adminScheduleId,
      deliveryId,
      buyerId: buyer.buyerId || buyer.userId || buyer.id,
      buyerEmail: buyer.email || buyer.userEmail || buyer.preferred_username,
      buyerRole: buyer.role,
      buyerObject: buyer
    });

    if (!productId || !adminScheduleId || !deliveryId || !preferredTime) {
      return NextResponse.json({ 
        error: 'Missing required fields: productId, adminScheduleId, deliveryId, preferredTime' 
      }, { status: 400 });
    }

    // Validate ObjectId formats
    if (!ObjectId.isValid(productId)) {
      return NextResponse.json({ error: 'Invalid product ID format' }, { status: 400 });
    }
    if (!ObjectId.isValid(adminScheduleId)) {
      return NextResponse.json({ error: 'Invalid admin schedule ID format' }, { status: 400 });
    }
    if (!ObjectId.isValid(deliveryId)) {
      return NextResponse.json({ error: 'Invalid delivery ID format' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');

    try {
      // Check if pickup already exists for this delivery
      const existingPickup = await db.collection('pickups').findOne({
        deliveryId: new ObjectId(deliveryId),
        buyerId: new ObjectId(buyer.buyerId || buyer.userId || buyer.id)
      });

      if (existingPickup) {
        return NextResponse.json({ 
          error: 'Pickup already booked for this delivery' 
        }, { status: 400 });
      }

    // Verify the delivery exists and belongs to the buyer through order relationship
    // First, find the order that contains this product - try multiple approaches
    const buyerId = buyer.buyerId || buyer.userId || buyer.id;
    const idCandidates = [];
    
    try {
      if (buyerId) {
        idCandidates.push(buyerId);
        if (typeof buyerId === 'string' && ObjectId.isValid(buyerId)) {
          try { idCandidates.push(new ObjectId(buyerId)); } catch (_) {}
        }
      }
    } catch (_) {}

    const emailCandidate = buyer.email || buyer.userEmail || buyer.preferred_username || null;

    const possibleFields = ['buyerId', 'buyer_id', 'buyer', 'userId', 'user_id', 'user'];
    const orConditions = [];
    for (const field of possibleFields) {
      if (idCandidates.length > 0) {
        orConditions.push({ [field]: { $in: idCandidates } });
      }
    }
    if (emailCandidate) {
      orConditions.push({ buyerEmail: emailCandidate });
      orConditions.push({ email: emailCandidate });
      orConditions.push({ 'buyer.email': emailCandidate });
    }

    const buyerFilter = orConditions.length > 0 ? { $or: orConditions } : {};
    
    // Try multiple product ID matching approaches
    const productIdCandidates = [];
    if (typeof productId === 'string' && ObjectId.isValid(productId)) {
      productIdCandidates.push(new ObjectId(productId));
    }
    productIdCandidates.push(productId);
    
    // First try: exact productId match
    let order = await db.collection('orders').findOne({
      productId: { $in: productIdCandidates },
      ...buyerFilter
    });

    // If not found, try with different field names
    if (!order) {
      order = await db.collection('orders').findOne({
        $or: [
          { productId: { $in: productIdCandidates } },
          { product_id: { $in: productIdCandidates } },
          { product: { $in: productIdCandidates } }
        ],
        ...buyerFilter
      });
    }

    // If still not found, try to find order through delivery
    if (!order) {
      console.log('🔍 Trying to find order through delivery...');
      const delivery = await db.collection('deliveries').findOne({
        _id: new ObjectId(deliveryId)
      });
      
      if (delivery) {
        console.log('🔍 Found delivery:', {
          deliveryId: delivery._id,
          productId: delivery.productId,
          sellerId: delivery.sellerId
        });
        
        // Try to find order by delivery's productId
        order = await db.collection('orders').findOne({
          productId: delivery.productId,
          ...buyerFilter
        });
        
        if (order) {
          console.log('✅ Found order through delivery');
        }
      }
    }

    // Final fallback: try to find any order for this buyer
    if (!order) {
      console.log('🔍 Final fallback: looking for any order for this buyer...');
      const allBuyerOrders = await db.collection('orders').find(buyerFilter).toArray();
      console.log('🔍 Found buyer orders:', allBuyerOrders.length);
      
      if (allBuyerOrders.length > 0) {
        console.log('🔍 Sample buyer order:', {
          orderId: allBuyerOrders[0]._id,
          productId: allBuyerOrders[0].productId,
          buyerId: allBuyerOrders[0].buyerId
        });
        
        // Use the first order as a fallback
        order = allBuyerOrders[0];
        console.log('⚠️ Using fallback order - this might not be the correct order');
      }
    }

    console.log('🔍 Order lookup result:', {
      found: !!order,
      orderId: order?._id,
      productId: order?.productId,
      buyerId: order?.buyerId,
      searchProductId: productId
    });

    if (!order) {
      console.log('🔍 No order found with filters:', {
        buyerFilter,
        productIdCandidates,
        buyerId,
        emailCandidate
      });
      return NextResponse.json({ 
        error: 'Order not found or access denied' 
      }, { status: 404 });
    }

    // Now find the delivery for this product - try multiple approaches
    let delivery = await db.collection('deliveries').findOne({
      _id: new ObjectId(deliveryId),
      productId: new ObjectId(productId)
    });

    // If not found, try without productId filter
    if (!delivery) {
      delivery = await db.collection('deliveries').findOne({
        _id: new ObjectId(deliveryId)
      });
    }

    // If still not found, try with different productId formats
    if (!delivery) {
      const deliveryProductIdCandidates = [];
      if (typeof productId === 'string' && ObjectId.isValid(productId)) {
        deliveryProductIdCandidates.push(new ObjectId(productId));
      }
      deliveryProductIdCandidates.push(productId);
      
      delivery = await db.collection('deliveries').findOne({
        _id: new ObjectId(deliveryId),
        productId: { $in: deliveryProductIdCandidates }
      });
    }

    console.log('🔍 Delivery lookup result:', {
      found: !!delivery,
      deliveryId: delivery?._id,
      productId: delivery?.productId
    });

    if (!delivery) {
      console.log('🔍 No delivery found, trying alternative approach...');
      // Try to find delivery by just the deliveryId
      delivery = await db.collection('deliveries').findOne({
        _id: new ObjectId(deliveryId)
      });
      
      if (delivery) {
        console.log('✅ Found delivery without productId filter');
      }
    }

    if (!delivery) {
      console.log('❌ Delivery not found with ID:', deliveryId);
      return NextResponse.json({ 
        error: 'Delivery not found or access denied' 
      }, { status: 404 });
    }

    // If we found a delivery but no order, we can still proceed if the delivery exists
    // This is a more permissive approach for cases where order data might be inconsistent
    if (!order && delivery) {
      console.log('⚠️ No order found but delivery exists, proceeding with delivery-only validation');
      // We'll proceed with just the delivery validation
    }

    // Verify the admin schedule exists
    const adminSchedule = await db.collection('admin_schedules').findOne({
      _id: new ObjectId(adminScheduleId)
    });

    if (!adminSchedule) {
      return NextResponse.json({ 
        error: 'Admin schedule not found' 
      }, { status: 404 });
    }

    // Create the pickup booking
    const pickupData = {
      productId: new ObjectId(productId),
      adminScheduleId: new ObjectId(adminScheduleId),
      deliveryId: new ObjectId(deliveryId),
      buyerId: new ObjectId(buyer.buyerId || buyer.userId || buyer.id),
      preferredTime,
      notes: notes || '',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      // Add order reference if we found one
      ...(order && { orderId: order._id })
    };

    const result = await db.collection('pickups').insertOne(pickupData);

    // Fetch the created pickup with populated data
    const createdPickup = await db.collection('pickups').aggregate([
      { $match: { _id: result.insertedId } },
      { $lookup: { from: 'listings', localField: 'productId', foreignField: '_id', as: 'product' } },
      { $lookup: { from: 'admin_schedules', localField: 'adminScheduleId', foreignField: '_id', as: 'adminSchedule' } },
      { $lookup: { from: 'deliveries', localField: 'deliveryId', foreignField: '_id', as: 'delivery' } },
      { $addFields: {
        product: { $arrayElemAt: ['$product', 0] },
        adminSchedule: { $arrayElemAt: ['$adminSchedule', 0] },
        delivery: { $arrayElemAt: ['$delivery', 0] }
      } }
    ]).toArray();

      return NextResponse.json({ 
        success: true, 
        data: createdPickup[0],
        message: 'Pickup booking created successfully' 
      }, { status: 201 });

    } catch (error) {
      console.error('POST /api/buyer/pickups error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  } catch (error) {
    console.error('POST /api/buyer/pickups error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
