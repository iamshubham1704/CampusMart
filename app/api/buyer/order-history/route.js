// app/api/buyer/order-history/route.js
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongo';
import { verifyToken } from '../../../../lib/auth';
import { ObjectId } from 'mongodb';

// Verify buyer token
function verifyBuyerToken(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    const token = authHeader.substring(7);
    
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return null;
    }
    
    // Check if user is a buyer - either by role or by having buyerId
    if (decoded.role === 'buyer' || decoded.buyerId) {
      return decoded;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

// GET - Fetch buyer's order history
export async function GET(request) {
  try {
    const buyer = verifyBuyerToken(request);
    
    if (!buyer) {
      return NextResponse.json({ 
        error: 'Unauthorized. Buyer authentication required.' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status'); // Filter by order status

    const client = await clientPromise;
    const db = client.db('campusmart');

    // Check if required collections exist
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    const requiredCollections = ['orders', 'listings', 'sellers'];
    const missingCollections = requiredCollections.filter(name => !collectionNames.includes(name));
    
    if (missingCollections.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Database setup incomplete',
        message: `Missing collections: ${missingCollections.join(', ')}`
      }, { status: 500 });
    }

    // Build filter for buyer's orders
    let filter = { buyerId: buyer.buyerId };
    if (status && status !== 'all') {
      filter.status = status;
    }

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

    // Check if buyer has any orders at all
    if (totalCount === 0) {
      return NextResponse.json({
        success: true,
        data: {
          orders: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0
          },
          message: 'No orders found for this buyer'
        }
      }, { status: 200 });
    }

    // Get additional details for each order
    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        try {
          // Get product details with better error handling
          let product = null;
          if (order.productId) {
            try {
              // Handle both string and ObjectId formats
              let productId;
              if (typeof order.productId === 'string') {
                // Check if it's a valid ObjectId string
                if (ObjectId.isValid(order.productId)) {
                  productId = new ObjectId(order.productId);
                } else {
                  // Skip this product lookup but continue processing the order
                }
              } else {
                productId = order.productId;
              }
              
              if (productId) {
                product = await db.collection('listings').findOne(
                  { _id: productId },
                  { projection: { title: 1, price: 1, images: 1, category: 1, description: 1, condition: 1 } }
                );
              }
            } catch (productError) {
              console.error(`❌ Error fetching product ${order.productId}:`, productError);
            }
          }

          // Get seller details with better error handling
          let seller = null;
          if (order.sellerId) {
            try {
              // Handle both string and ObjectId formats
              let sellerId;
              if (typeof order.sellerId === 'string') {
                // Check if it's a valid ObjectId string
                if (ObjectId.isValid(order.sellerId)) {
                  sellerId = new ObjectId(order.sellerId);
                } else {
                  // Skip this seller lookup but continue processing the order
                }
              } else {
                sellerId = order.sellerId;
              }
              
              if (sellerId) {
                seller = await db.collection('sellers').findOne(
                  { _id: sellerId },
                  { projection: { name: 1, email: 1, phone: 1, businessName: 1 } }
                );
              }
            } catch (sellerError) {
              console.error(`❌ Error fetching seller ${order.sellerId}:`, sellerError);
            }
          }

          // Get payment screenshot details
          let paymentScreenshot = null;
          if (order.paymentScreenshotId) {
            try {
              paymentScreenshot = await db.collection('payment_screenshots').findOne(
                { _id: order.paymentScreenshotId },
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

          // Prepare image URL with better handling
          let productImage = null;
          if (product && product.images && product.images.length > 0) {
            const firstImage = product.images[0];
            if (typeof firstImage === 'string') {
              // Handle base64 or direct URL strings
              productImage = firstImage;
            } else if (typeof firstImage === 'object' && firstImage.url) {
              // Handle ImageKit object format
              productImage = firstImage.url;
            }
          }

          // Fallback image if no product image
          if (!productImage) {
            productImage = 'https://via.placeholder.com/80x80?text=No+Image';
          }

          return {
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
            orderStatus: orderStatus
          };
        } catch (error) {
          console.error('Error processing order details for order:', order._id, error);
          return {
            _id: order._id,
            orderId: order._id,
            product: { 
              title: 'Error loading product', 
              price: 0, 
              image: 'https://via.placeholder.com/80x80?text=Error', 
              category: 'Unknown',
              description: 'Failed to load product details',
              condition: 'Unknown'
            },
            seller: { 
              name: 'Error loading seller', 
              email: 'No email available', 
              phone: 'No phone available' 
            },
            amount: order.amount || 0,
            paymentMethod: order.paymentMethod || 'UPI',
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
