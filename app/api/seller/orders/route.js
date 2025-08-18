// app/api/seller/orders/route.js - UPDATED VERSION
import { verifyToken } from '@/lib/auth';
import clientPromise from '@/lib/mongo';

export async function GET(request) {
  try {
    const decoded = verifyToken(request);
    if (!decoded || !decoded.sellerId) {
      return Response.json({ 
        error: 'Seller authentication required' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    console.log('🔍 Seller orders request:', {
      sellerId: decoded.sellerId,
      status,
      page,
      limit
    });

    const client = await clientPromise;
    const db = client.db('campusmart');

    // Build filter for seller's orders
    let filter = { sellerId: decoded.sellerId };
    
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get orders with pagination
    const orders = await db.collection('orders')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    console.log(`📦 Found ${orders.length} orders for seller ${decoded.sellerId}`);

    // Get total count
    const totalCount = await db.collection('orders').countDocuments(filter);

    // Get additional details for each order
    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        try {
          // Get product details
          const product = await db.collection('listings').findOne({
            _id: order.productId
          }, { projection: { title: 1, price: 1, images: 1, category: 1 } });

          // Get buyer details
          const buyer = await db.collection('buyers').findOne({
            _id: order.buyerId
          }, { projection: { name: 1, email: 1, phone: 1 } });

          // Check if seller has already requested payment
          const sellerTransaction = await db.collection('seller_transactions').findOne({
            orderId: order._id,
            sellerId: decoded.sellerId
          });

          // Get payment screenshot status
          let paymentScreenshot = null;
          if (order.paymentScreenshotId) {
            paymentScreenshot = await db.collection('payment_screenshots').findOne({
              _id: order.paymentScreenshotId
            }, { projection: { status: 1, verifiedAt: 1, amount: 1 } });
          }

          return {
            ...order,
            product: product || { title: 'Product Deleted', price: 0, images: [], category: 'Unknown' },
            buyer: buyer || { name: 'Unknown Buyer', email: '', phone: '' },
            sellerTransaction: sellerTransaction || null,
            paymentScreenshot: paymentScreenshot || null,
            canRequestPayment: order.status === 'payment_verified' && !sellerTransaction,
            paymentRequested: !!sellerTransaction,
            paymentRequestStatus: sellerTransaction?.status || null,
            hasPaymentRequest: !!sellerTransaction
          };
        } catch (error) {
          console.error('Error fetching order details:', error);
          return {
            ...order,
            product: { title: 'Error Loading Product', price: 0, images: [], category: 'Unknown' },
            buyer: { name: 'Error Loading Buyer', email: '', phone: '' },
            sellerTransaction: null,
            paymentScreenshot: null,
            canRequestPayment: false,
            paymentRequested: false,
            paymentRequestStatus: null,
            hasPaymentRequest: false
          };
        }
      })
    );

    // Separate orders that can request payment (payment_verified status)
    const verifiedOrders = ordersWithDetails.filter(order => order.canRequestPayment);
    
    console.log('✅ Order processing complete:', {
      totalOrders: ordersWithDetails.length,
      verifiedOrders: verifiedOrders.length,
      withPaymentRequests: ordersWithDetails.filter(o => o.paymentRequested).length
    });

    return Response.json({
      success: true,
      data: {
        orders: ordersWithDetails,
        verifiedOrders: verifiedOrders,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        },
        summary: {
          total: ordersWithDetails.length,
          pendingPaymentRequest: verifiedOrders.length,
          paymentRequested: ordersWithDetails.filter(o => o.paymentRequested).length,
          completed: ordersWithDetails.filter(o => o.paymentRequestStatus === 'completed').length,
          totalEarnings: ordersWithDetails
            .filter(o => o.paymentRequestStatus === 'completed')
            .reduce((sum, o) => sum + (o.amount || 0), 0)
        }
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error fetching seller orders:', error);
    return Response.json({
      success: false,
      error: 'Internal server error',
      message: error.message
    }, { status: 500 });
  }
}

// GET specific order details
export async function POST(request) {
  try {
    const decoded = verifyToken(request);
    if (!decoded || !decoded.sellerId) {
      return Response.json({ 
        error: 'Seller authentication required' 
      }, { status: 401 });
    }

    const { orderId } = await request.json();

    if (!orderId) {
      return Response.json({ 
        error: 'Order ID is required' 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');

    // Get specific order details
    const order = await db.collection('orders').findOne({
      _id: orderId,
      sellerId: decoded.sellerId
    });

    if (!order) {
      return Response.json({ 
        error: 'Order not found' 
      }, { status: 404 });
    }

    // Get product details
    const product = await db.collection('listings').findOne({
      _id: order.productId
    });

    // Get buyer details
    const buyer = await db.collection('buyers').findOne({
      _id: order.buyerId
    }, { projection: { password: 0 } });

    // Get payment screenshot details
    let paymentScreenshot = null;
    if (order.paymentScreenshotId) {
      paymentScreenshot = await db.collection('payment_screenshots').findOne({
        _id: order.paymentScreenshotId
      });
    }

    // Check seller transaction status
    const sellerTransaction = await db.collection('seller_transactions').findOne({
      orderId: orderId,
      sellerId: decoded.sellerId
    });

    const orderDetails = {
      ...order,
      product: product || null,
      buyer: buyer || null,
      paymentScreenshot: paymentScreenshot || null,
      sellerTransaction: sellerTransaction || null,
      canRequestPayment: order.status === 'payment_verified' && !sellerTransaction,
      paymentRequested: !!sellerTransaction,
      paymentRequestStatus: sellerTransaction?.status || null,
      hasPaymentRequest: !!sellerTransaction
    };

    return Response.json({
      success: true,
      data: orderDetails
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error fetching order details:', error);
    return Response.json({
      success: false,
      error: 'Internal server error',
      message: error.message
    }, { status: 500 });
  }
}