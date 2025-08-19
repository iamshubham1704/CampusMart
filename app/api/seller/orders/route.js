// app/api/seller/orders/route.js - UPDATED VERSION
import { verifyToken } from '@/lib/auth';
import clientPromise from '@/lib/mongo';
import { ObjectId } from 'mongodb';

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

    // Build filter for seller's orders supporting both string and ObjectId stored IDs
    const sellerIdCandidates = [];
    if (decoded.sellerId) {
      sellerIdCandidates.push(decoded.sellerId);
      if (typeof decoded.sellerId === 'string' && ObjectId.isValid(decoded.sellerId)) {
        try { sellerIdCandidates.push(new ObjectId(decoded.sellerId)); } catch (_) {}
      }
    }
    let filter = { sellerId: { $in: sellerIdCandidates } };
    
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
          // Get product details with proper ObjectId conversion
          let product = null;
          if (order.productId) {
            try {
              const productId = (typeof order.productId === 'string' && ObjectId.isValid(order.productId))
                ? new ObjectId(order.productId)
                : order.productId;
              product = await db.collection('listings').findOne({
                _id: productId
              }, { projection: { title: 1, price: 1, images: 1, category: 1 } });
            } catch (error) {
              console.error('Error converting productId to ObjectId:', error);
            }
          }

          // Get buyer details with proper ObjectId conversion
          let buyer = null;
          if (order.buyerId) {
            try {
              const buyerId = (typeof order.buyerId === 'string' && ObjectId.isValid(order.buyerId))
                ? new ObjectId(order.buyerId)
                : order.buyerId;
              buyer = await db.collection('buyers').findOne({
                _id: buyerId
              }, { projection: { name: 1, email: 1, phone: 1 } });
            } catch (error) {
              console.error('Error converting buyerId to ObjectId:', error);
            }
          }

          // Check if seller has already requested payment
          let sellerTransaction = null;
          try {
            const orderId = (typeof order._id === 'string' && ObjectId.isValid(order._id)) ? new ObjectId(order._id) : order._id;
            sellerTransaction = await db.collection('seller_transactions').findOne({
              orderId: orderId,
              sellerId: { $in: sellerIdCandidates }
            });
          } catch (error) {
            console.error('Error converting orderId to ObjectId for seller transaction lookup:', error);
          }

          // Get payment screenshot status with proper ObjectId conversion
          let paymentScreenshot = null;
          if (order.paymentScreenshotId) {
            try {
              const screenshotId = (typeof order.paymentScreenshotId === 'string' && ObjectId.isValid(order.paymentScreenshotId))
                ? new ObjectId(order.paymentScreenshotId)
                : order.paymentScreenshotId;
              paymentScreenshot = await db.collection('payment_screenshots').findOne({
                _id: screenshotId
              }, { projection: { status: 1, verifiedAt: 1, amount: 1 } });
            } catch (error) {
              console.error('Error converting paymentScreenshotId to ObjectId:', error);
            }
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

    // Get specific order details with proper ObjectId conversion
    let order = null;
    try {
      const orderIdObj = (typeof orderId === 'string' && ObjectId.isValid(orderId)) ? new ObjectId(orderId) : orderId;
      const sellerIdCandidates = [];
      if (decoded.sellerId) {
        sellerIdCandidates.push(decoded.sellerId);
        if (typeof decoded.sellerId === 'string' && ObjectId.isValid(decoded.sellerId)) {
          try { sellerIdCandidates.push(new ObjectId(decoded.sellerId)); } catch (_) {}
        }
      }
      order = await db.collection('orders').findOne({
        _id: orderIdObj,
        sellerId: { $in: sellerIdCandidates }
      });
    } catch (error) {
      console.error('Error converting orderId to ObjectId for order lookup:', error);
    }

    if (!order) {
      return Response.json({ 
        error: 'Order not found' 
      }, { status: 404 });
    }

    // Get product details with proper ObjectId conversion
    let product = null;
    if (order.productId) {
      try {
        const productId = (typeof order.productId === 'string' && ObjectId.isValid(order.productId)) ? new ObjectId(order.productId) : order.productId;
        product = await db.collection('listings').findOne({
          _id: productId
        });
      } catch (error) {
        console.error('Error converting productId to ObjectId:', error);
      }
    }

    // Get buyer details with proper ObjectId conversion
    let buyer = null;
    if (order.buyerId) {
      try {
        const buyerId = (typeof order.buyerId === 'string' && ObjectId.isValid(order.buyerId)) ? new ObjectId(order.buyerId) : order.buyerId;
        buyer = await db.collection('buyers').findOne({
          _id: buyerId
        }, { projection: { password: 0 } });
      } catch (error) {
        console.error('Error converting buyerId to ObjectId:', error);
      }
    }

    // Get payment screenshot details with proper ObjectId conversion
    let paymentScreenshot = null;
    if (order.paymentScreenshotId) {
      try {
        const screenshotId = (typeof order.paymentScreenshotId === 'string' && ObjectId.isValid(order.paymentScreenshotId)) ? new ObjectId(order.paymentScreenshotId) : order.paymentScreenshotId;
        paymentScreenshot = await db.collection('payment_screenshots').findOne({
          _id: screenshotId
        });
      } catch (error) {
        console.error('Error converting paymentScreenshotId to ObjectId:', error);
      }
    }

    // Check seller transaction status
    let sellerTransaction = null;
    try {
      const orderIdObj = (typeof orderId === 'string' && ObjectId.isValid(orderId)) ? new ObjectId(orderId) : orderId;
      const sellerIdCandidates = [];
      if (decoded.sellerId) {
        sellerIdCandidates.push(decoded.sellerId);
        if (typeof decoded.sellerId === 'string' && ObjectId.isValid(decoded.sellerId)) {
          try { sellerIdCandidates.push(new ObjectId(decoded.sellerId)); } catch (_) {}
        }
      }
      sellerTransaction = await db.collection('seller_transactions').findOne({
        orderId: orderIdObj,
        sellerId: { $in: sellerIdCandidates }
      });
    } catch (error) {
      console.error('Error converting orderId to ObjectId for seller transaction lookup:', error);
    }

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