// app/api/buyer/order-history/route.js
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongo';
import { verifyToken } from '../../../../lib/auth';

// Verify buyer token
function verifyBuyerToken(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('🔴 No valid authorization header found');
      return null;
    }
    const token = authHeader.substring(7);
    console.log('🔍 Token received:', token.substring(0, 20) + '...');
    
    const decoded = verifyToken(token);
    console.log('🔍 Decoded token:', decoded);
    
    if (!decoded) {
      console.log('🔴 Token verification failed');
      return null;
    }
    
    // Check if user is a buyer - either by role or by having buyerId
    if (decoded.role === 'buyer' || decoded.buyerId) {
      console.log('✅ Buyer verification successful:', {
        role: decoded.role,
        buyerId: decoded.buyerId,
        email: decoded.email
      });
      return decoded;
    }
    
    console.log('🔴 User is not a buyer:', {
      role: decoded.role,
      buyerId: decoded.buyerId,
      userId: decoded.userId
    });
    return null;
  } catch (error) {
    console.error('🔴 Buyer token verification failed:', error);
    return null;
  }
}

// GET - Fetch buyer's order history
export async function GET(request) {
  try {
    console.log('🚀 Order history API called');
    
    const buyer = verifyBuyerToken(request);
    console.log('🔍 Buyer verification result:', buyer);
    
    if (!buyer) {
      console.log('🔴 Buyer verification failed - returning 401');
      return NextResponse.json({ 
        error: 'Unauthorized. Buyer authentication required.' 
      }, { status: 401 });
    }

    console.log('✅ Buyer authenticated successfully:', {
      buyerId: buyer.buyerId,
      role: buyer.role,
      email: buyer.email
    });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status'); // Filter by order status

    console.log('🔍 Query parameters:', { page, limit, status });

    const client = await clientPromise;
    const db = client.db('campusmart');

    // Build filter for buyer's orders
    let filter = { buyerId: buyer.buyerId };
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    console.log('🔍 Database filter:', filter);

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch orders with pagination
    const orders = await db.collection('orders')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

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

          // Get seller details
          const seller = await db.collection('sellers').findOne({
            _id: order.sellerId
          }, { projection: { name: 1, email: 1, phone: 1 } });

          // Get payment screenshot details
          let paymentScreenshot = null;
          if (order.paymentScreenshotId) {
            paymentScreenshot = await db.collection('payment_screenshots').findOne({
              _id: order.paymentScreenshotId
            }, { projection: { status: 1, verifiedAt: 1, amount: 1, imageKit: 1 } });
          }

          // Get order status details
          let orderStatus = null;
          try {
            orderStatus = await db.collection('order_status').findOne({
              orderId: order._id
            });
          } catch (error) {
            // Order status might not exist yet
            console.log('Order status not found for order:', order._id);
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

          // Prepare image URL
          let productImage = null;
          if (product && product.images && product.images.length > 0) {
            if (product.images[0].startsWith('http')) {
              productImage = product.images[0];
            } else {
              // Handle base64 or other image formats
              productImage = product.images[0];
            }
          }

          return {
            _id: order._id,
            orderId: order._id,
            product: {
              _id: product?._id,
              title: product?.title || 'Product not found',
              price: product?.price || 0,
              image: productImage,
              category: product?.category || 'Unknown'
            },
            seller: {
              _id: seller?._id,
              name: seller?.name || 'Unknown Seller',
              email: seller?.email || 'No email available',
              phone: seller?.phone || 'No phone available'
            },
            amount: order.amount,
            paymentMethod: order.paymentMethod,
            status: displayStatus,
            statusMessage: statusMessage,
            statusColor: statusColor,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            paymentScreenshot: paymentScreenshot,
            orderStatus: orderStatus
          };
        } catch (error) {
          console.error('Error fetching details for order:', order._id, error);
          return {
            _id: order._id,
            orderId: order._id,
            product: { title: 'Product not found', price: 0, image: null, category: 'Unknown' },
            seller: { name: 'Unknown Seller', email: 'No email available', phone: 'No phone available' },
            amount: order.amount,
            paymentMethod: order.paymentMethod,
            status: 'error',
            statusMessage: 'Error loading order details',
            statusColor: 'error',
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            error: true
          };
        }
      })
    );

    // Filter out orders with errors if needed
    const validOrders = ordersWithDetails.filter(order => !order.error);

    return NextResponse.json({
      success: true,
      data: {
        orders: validOrders,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching buyer order history:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error.message
    }, { status: 500 });
  }
}
