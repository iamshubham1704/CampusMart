// app/api/admin/order-status/route.js - CREATE NEW FILE
import { verifyToken } from '@/lib/auth';
import clientPromise from '@/lib/mongo';
import { ObjectId } from 'mongodb';

// Define order steps
const ORDER_STEPS = {
  1: { name: 'Payment Verified', description: 'Payment screenshot has been verified by admin' },
  2: { name: 'Item Status Updated', description: 'Item marked as sold in the system' },
  3: { name: 'Buyer Called', description: 'Admin contacted buyer for delivery coordination' },
  4: { name: 'Seller Called', description: 'Admin contacted seller for delivery coordination' },
  5: { name: 'Order Delivered', description: 'Item successfully delivered to buyer' },
  6: { name: 'Payment Released', description: 'Payment released to seller (minus commission)' },
  7: { name: 'Order Complete', description: 'Order completed and closed' }
};

// Verify admin token
function verifyAdminToken(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded || decoded.role !== 'admin') {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('Admin token verification failed:', error);
    return null;
  }
}

// GET - Fetch all order statuses with filters and pagination
export async function GET(request) {
  try {
    const admin = verifyAdminToken(request);
    if (!admin) {
      return Response.json({ 
        error: 'Unauthorized. Admin access required.' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const status = searchParams.get('status'); // 'in_progress', 'completed', 'failed'
    const step = searchParams.get('step'); // current step filter
    const adminFilter = searchParams.get('admin'); // assigned admin filter

    const client = await clientPromise;
    const db = client.db('campusmart');

    // Build filter
    let filter = {};
    if (status && status !== 'all') {
      filter.overallStatus = status;
    }
    if (step && step !== 'all') {
      filter.currentStep = parseInt(step);
    }
    if (adminFilter && adminFilter !== 'all') {
      if (adminFilter === 'unassigned') {
        filter.$or = [
          { assignedAdminId: { $exists: false } },
          { assignedAdminId: null }
        ];
      } else {
        try {
          filter.assignedAdminId = new ObjectId(adminFilter);
        } catch (error) {
          console.error('Invalid admin ID format:', error);
        }
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch order statuses with pagination and include listing details
    const orderStatuses = await db.collection('order_status')
      .aggregate([
        { $match: filter },
        {
          $lookup: {
            from: 'listings',
            localField: 'productId',
            foreignField: '_id',
            as: 'listing'
          }
        },
        // Pull listing snapshot fields for fallback calculations
        {
          $addFields: {
            listingPrice: { $arrayElemAt: ['$listing.price', 0] },
            listingCommission: { $arrayElemAt: ['$listing.commission', 0] }
          }
        },
        // Ensure commissionAmount and buyerPrice are always present
        {
          $addFields: {
            commissionAmount: {
              $ifNull: [
                '$commissionAmount',
                {
                  $multiply: [
                    { $ifNull: ['$listingPrice', 0] },
                    { $divide: [ { $ifNull: ['$commissionPercent', { $ifNull: ['$listingCommission', 10] } ] }, 100 ] }
                  ]
                }
              ]
            },
            buyerPrice: {
              $ifNull: [
                '$buyerPrice',
                {
                  $add: [
                    { $ifNull: ['$listingPrice', 0] },
                    {
                      $multiply: [
                        { $ifNull: ['$listingPrice', 0] },
                        { $divide: [ { $ifNull: ['$commissionPercent', { $ifNull: ['$listingCommission', 10] } ] }, 100 ] }
                      ]
                    }
                  ]
                }
              ]
            }
          }
        },
        {
          $project: {
            listing: 0 // Remove the full listing object to keep response clean
          }
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit }
      ])
      .toArray();

    // Get total count
    const totalCount = await db.collection('order_status').countDocuments(filter);

    // Get statistics
    const statusStats = await db.collection('order_status').aggregate([
      {
        $group: {
          _id: '$overallStatus',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    const stepStats = await db.collection('order_status').aggregate([
      {
        $group: {
          _id: '$currentStep',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    return Response.json({
      success: true,
      data: {
        orders: orderStatuses,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        },
        statistics: {
          statusStats,
          stepStats
        },
        orderSteps: ORDER_STEPS
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching order statuses:', error);
    return Response.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// POST - Sync verified payments to create order status records
export async function POST(request) {
  try {
    const admin = verifyAdminToken(request);
    if (!admin) {
      return Response.json({ 
        error: 'Unauthorized. Admin access required.' 
      }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');

    const result = await syncVerifiedPayments(db);

    return Response.json({
      success: true,
      message: `Sync completed. Created ${result.created} new order status records.`,
      data: result
    }, { status: 200 });

  } catch (error) {
    console.error('Error syncing verified payments:', error);
    return Response.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Function to sync verified payments to order_status collection
async function syncVerifiedPayments(db) {
  try {
    // Get all verified payments
    const verifiedPayments = await db.collection('payment_screenshots')
      .find({ status: 'verified' })
      .toArray();

    // Get existing order statuses
    const existingOrderStatuses = await db.collection('order_status')
      .find({}, { projection: { orderId: 1 } })
      .toArray();

    const existingOrderIds = new Set(existingOrderStatuses.map(os => os.orderId?.toString()));
    
    let created = 0;

    // Helper to convert string ids to ObjectId when possible
    const toObjectId = (id) => {
      try {
        if (!id) return null;
        return typeof id === 'string' ? new ObjectId(id) : id;
      } catch (_) {
        return null;
      }
    };

    for (const payment of verifiedPayments) {
      try {
        // Find corresponding order
        const order = await db.collection('orders').findOne({
          paymentScreenshotId: payment._id
        });

        if (!order || existingOrderIds.has(order._id.toString())) {
          continue;
        }

        // Get related data
        const [buyer, seller, product] = await Promise.all([
          db.collection('buyers').findOne(
            { _id: toObjectId(payment.buyerId) || payment.buyerId },
            { projection: { name: 1, email: 1, phone: 1 } }
          ),
          db.collection('sellers').findOne(
            { _id: toObjectId(payment.sellerId) || payment.sellerId },
            { projection: { name: 1, email: 1, phone: 1 } }
          ),
          db.collection('listings').findOne(
            { _id: toObjectId(payment.productId) || payment.productId },
            { projection: { title: 1, price: 1, commission: 1 } }
          )
        ]);

        if (!buyer || !seller || !product) {
          continue;
        }

        // Calculate pricing breakdown
        const listingPrice = product.price || 0;
        const commissionPercent = product.commission || 10; // Default 10% if not set
        const commissionAmount = (listingPrice * commissionPercent) / 100;
        const buyerPrice = listingPrice + commissionAmount;

        // Create order status record
        const orderStatus = {
          _id: new ObjectId(),
          orderId: order._id,
          buyerId: toObjectId(payment.buyerId) || payment.buyerId,
          sellerId: toObjectId(payment.sellerId) || payment.sellerId,
          productId: toObjectId(payment.productId) || payment.productId,
          
          buyerName: buyer.name,
          buyerPhone: buyer.phone,
          buyerEmail: buyer.email,
          sellerName: seller.name,
          sellerPhone: seller.phone,
          sellerEmail: seller.email,
          productTitle: product.title,
          orderAmount: payment.amount || buyerPrice, // Use payment amount or calculated buyer price
          
          // Add pricing breakdown
          listingPrice: listingPrice,
          commissionPercent: commissionPercent,
          commissionAmount: commissionAmount,
          buyerPrice: buyerPrice,
          
          currentStep: 2,
          steps: {
            1: {
              status: 'completed',
              completedAt: payment.verifiedAt || payment.uploadedAt,
              details: 'Payment verification completed',
              completedBy: payment.verifiedBy ? new ObjectId(payment.verifiedBy) : null
            },
            2: { status: 'pending', completedAt: null, details: '', completedBy: null },
            3: { status: 'pending', completedAt: null, details: '', completedBy: null },
            4: { status: 'pending', completedAt: null, details: '', completedBy: null },
            5: { status: 'pending', completedAt: null, details: '', completedBy: null },
            6: { status: 'pending', completedAt: null, details: '', completedBy: null },
            7: { status: 'pending', completedAt: null, details: '', completedBy: null }
          },
          
          overallStatus: 'in_progress',
          createdAt: new Date(),
          updatedAt: new Date(),
          completedAt: null
        };

        await db.collection('order_status').insertOne(orderStatus);
        created++;

      } catch (itemError) {
        console.error('Error creating order status for payment:', payment._id, itemError);
      }
    }

    return { created, existing: existingOrderStatuses.length };

  } catch (error) {
    console.error('Error in syncVerifiedPayments:', error);
    throw error;
  }
}