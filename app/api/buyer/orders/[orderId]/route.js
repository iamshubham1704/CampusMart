import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongo';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// Verify buyer token and return decoded payload or null
function verifyBuyer(request) {
  const decoded = verifyToken(request);
  if (!decoded) return null;
  if (decoded.role === 'buyer' || decoded.buyerId || decoded.userId || decoded.id) {
    return decoded;
  }
  return null;
}

// GET - Fetch a specific order by ID
export async function GET(request, { params }) {
  try {
    const buyer = verifyBuyer(request);
    if (!buyer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = params;
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Validate ObjectId format - but allow UUIDs too
    if (!ObjectId.isValid(orderId) && !orderId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return NextResponse.json({ error: 'Invalid order ID format' }, { status: 400 });
    }

    // Convert UUID to ObjectId if needed, or use as string
    let orderIdToUse;
    if (ObjectId.isValid(orderId)) {
      orderIdToUse = new ObjectId(orderId);
    } else {
      // For UUIDs, we need to find by a different field or convert
      orderIdToUse = orderId;
    }

    const client = await clientPromise;
    const db = client.db('campusmart');

    // Build flexible filter for buyer's order
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
    
    console.log('🔍 Looking for order:', {
      orderId,
      buyerId: buyer.buyerId || buyer.userId || buyer.id,
      buyerEmail: buyer.email || buyer.userEmail || buyer.preferred_username
    });

    // Find the specific order - try both ObjectId and string formats
    let order = await db.collection('orders').findOne({
      _id: orderIdToUse,
      ...buyerFilter
    });

    // If not found with ObjectId, try with string
    if (!order && ObjectId.isValid(orderId)) {
      order = await db.collection('orders').findOne({
        _id: orderId,
        ...buyerFilter
      });
    }

    // If still not found, try with UUID format
    if (!order) {
      order = await db.collection('orders').findOne({
        $or: [
          { _id: orderId },
          { orderId: orderId },
          { id: orderId }
        ],
        ...buyerFilter
      });
    }

    console.log('🔍 Order lookup result:', {
      found: !!order,
      orderId: order?._id,
      productId: order?.productId,
      buyerId: order?.buyerId
    });

    if (!order) {
      return NextResponse.json({ 
        error: 'Order not found or access denied' 
      }, { status: 404 });
    }

    // Get additional details for the order
    let product = null;
    if (order.productId) {
      try {
        const productIdCandidates = [];
        if (typeof order.productId === 'string') {
          productIdCandidates.push(order.productId);
          if (ObjectId.isValid(order.productId)) {
            try { productIdCandidates.push(new ObjectId(order.productId)); } catch (_) {}
          }
        } else {
          productIdCandidates.push(order.productId);
          try { productIdCandidates.push(new ObjectId(String(order.productId))); } catch (_) {}
        }

        product = await db.collection('listings').findOne(
          { _id: { $in: productIdCandidates } },
          { projection: { title: 1, price: 1, images: 1, category: 1, description: 1, condition: 1 } }
        );
      } catch (productError) {
        console.error(`❌ Error fetching product ${order.productId}:`, productError);
      }
    }

    // Get seller details
    let seller = null;
    if (order.sellerId) {
      try {
        const sellerIdCandidates = [];
        if (typeof order.sellerId === 'string') {
          sellerIdCandidates.push(order.sellerId);
          if (ObjectId.isValid(order.sellerId)) {
            try { sellerIdCandidates.push(new ObjectId(order.sellerId)); } catch (_) {}
          }
        } else {
          sellerIdCandidates.push(order.sellerId);
          try { sellerIdCandidates.push(new ObjectId(String(order.sellerId))); } catch (_) {}
        }

        seller = await db.collection('sellers').findOne(
          { _id: { $in: sellerIdCandidates } },
          { projection: { name: 1, email: 1, phone: 1, businessName: 1 } }
        );
      } catch (sellerError) {
        console.error(`❌ Error fetching seller ${order.sellerId}:`, sellerError);
      }
    }

    // Get payment screenshot details
    let paymentScreenshot = null;
    if (order.paymentScreenshotId) {
      try {
        const ssCandidates = [];
        ssCandidates.push(order.paymentScreenshotId);
        try {
          if (typeof order.paymentScreenshotId === 'string' && ObjectId.isValid(order.paymentScreenshotId)) {
            ssCandidates.push(new ObjectId(order.paymentScreenshotId));
          }
        } catch (_) {}

        paymentScreenshot = await db.collection('payment_screenshots').findOne(
          { _id: { $in: ssCandidates } },
          { projection: { status: 1, verifiedAt: 1, amount: 1, imageKit: 1 } }
        );
      } catch (screenshotError) {
        console.error(`❌ Error fetching payment screenshot ${order.paymentScreenshotId}:`, screenshotError);
      }
    }

    // Get order status details
    let orderStatus = null;
    try {
      orderStatus = await db.collection('order_status').findOne({
        orderId: order._id
      });
    } catch (error) {
      // Order status might not exist yet
    }

    // Get delivery information for this product
    let delivery = null;
    try {
      if (product && product._id) {
        delivery = await db.collection('deliveries').findOne({
          productId: product._id
        });
      }
    } catch (error) {
      // Delivery might not exist yet
    }

    // Determine the display status based on payment screenshot and order status
    let displayStatus = 'payment_pending_verification';
    let statusMessage = 'Payment verification pending';
    let statusColor = 'warning';

    if (paymentScreenshot) {
      if (paymentScreenshot.status === 'verified') {
        displayStatus = 'payment_verified';
        statusMessage = 'Payment verified';
        statusColor = 'success';
        
        // Check if order is delivered
        if (orderStatus && orderStatus.overallStatus === 'completed') {
          displayStatus = 'delivered';
          statusMessage = 'Order delivered';
          statusColor = 'success';
        } else if (orderStatus && orderStatus.currentStep >= 3) {
          displayStatus = 'will_be_delivered_soon';
          statusMessage = 'Will be delivered soon';
          statusColor = 'info';
        }
      } else if (paymentScreenshot.status === 'rejected') {
        displayStatus = 'payment_rejected';
        statusMessage = 'Payment rejected - Contact admin';
        statusColor = 'error';
      }
    }

    // Prepare image URL with more fallbacks
    let productImage = null;
    if (product && product.images && product.images.length > 0) {
      const firstImage = product.images[0];
      if (typeof firstImage === 'string') {
        productImage = firstImage;
      } else if (typeof firstImage === 'object') {
        productImage = firstImage.url || firstImage.imageKit?.url || firstImage.path || null;
      }
    }

    // Fallback image if no product image
    if (!productImage) {
      productImage = 'https://via.placeholder.com/80x80?text=No+Image';
    }

    const orderWithDetails = {
      _id: order._id,
      orderId: order._id,
      product: {
        _id: product?._id || null,
        title: product?.title || 'Product not found',
        price: product?.price || 0,
        image: productImage,
        category: product?.category || 'Unknown',
        description: product?.description || 'No description available',
        condition: product?.condition || 'Unknown'
      },
      seller: {
        _id: seller?._id || null,
        name: seller?.name || seller?.businessName || 'Unknown Seller',
        email: seller?.email || 'No email available',
        phone: seller?.phone || 'No phone available'
      },
      amount: order.amount || 0,
      paymentMethod: order.paymentMethod || 'UPI',
      status: displayStatus,
      statusMessage: statusMessage,
      statusColor: statusColor,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      paymentScreenshot: paymentScreenshot,
      orderStatus: orderStatus,
      delivery: delivery ? {
        _id: delivery._id,
        status: delivery.status,
        adminSchedule: delivery.adminSchedule,
        preferredTime: delivery.preferredTime,
        notes: delivery.notes,
        adminNotes: delivery.adminNotes
      } : null
    };

    return NextResponse.json({
      success: true,
      data: orderWithDetails
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error fetching order details:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error.message
    }, { status: 500 });
  }
}
