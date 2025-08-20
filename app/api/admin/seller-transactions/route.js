// app/api/admin/seller-transactions/route.js - NEW FILE
import { verifyAdminToken } from '@/lib/auth';
import clientPromise from '@/lib/mongo';
import { ObjectId } from 'mongodb';

// GET - Fetch all seller transaction requests for admin
export async function GET(request) {
  try {
    const admin = verifyAdminToken(request);
    if (!admin) {
      return Response.json({ 
        error: 'Admin authentication required' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sellerId = searchParams.get('sellerId');

    const client = await clientPromise;
    const db = client.db('campusmart');

    // Build filter
    let filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (sellerId) {
      filter.sellerId = sellerId;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get transactions with pagination
    const transactions = await db.collection('seller_transactions')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count
    const totalCount = await db.collection('seller_transactions').countDocuments(filter);

    // Get additional details for each transaction
    const transactionsWithDetails = await Promise.all(
      transactions.map(async (transaction) => {
        try {
          // Get seller details
          // Resolve seller by either string or ObjectId
          const sellerCandidates = [];
          if (transaction.sellerId) {
            sellerCandidates.push(transaction.sellerId);
            if (typeof transaction.sellerId === 'string' && ObjectId.isValid(transaction.sellerId)) {
              try { sellerCandidates.push(new ObjectId(transaction.sellerId)); } catch (_) {}
            }
          }
          const seller = await db.collection('sellers').findOne(
            sellerCandidates.length > 0 ? { _id: { $in: sellerCandidates } } : { _id: null },
            { projection: { name: 1, email: 1, phone: 1, profileImage: 1 } }
          );

          // Get buyer details
          const buyerCandidates = [];
          if (transaction.buyerId) {
            buyerCandidates.push(transaction.buyerId);
            if (typeof transaction.buyerId === 'string' && ObjectId.isValid(transaction.buyerId)) {
              try { buyerCandidates.push(new ObjectId(transaction.buyerId)); } catch (_) {}
            }
          }
          const buyer = await db.collection('buyers').findOne(
            buyerCandidates.length > 0 ? { _id: { $in: buyerCandidates } } : { _id: null },
            { projection: { name: 1, email: 1, phone: 1 } }
          );

          // Get product details
          const productCandidates = [];
          if (transaction.productId) {
            productCandidates.push(transaction.productId);
            if (typeof transaction.productId === 'string' && ObjectId.isValid(transaction.productId)) {
              try { productCandidates.push(new ObjectId(transaction.productId)); } catch (_) {}
            }
          }
          const product = await db.collection('listings').findOne(
            productCandidates.length > 0 ? { _id: { $in: productCandidates } } : { _id: null },
            { projection: { title: 1, price: 1, images: 1 } }
          );

          // Get order details
          const orderCandidates = [];
          if (transaction.orderId) {
            orderCandidates.push(transaction.orderId);
            if (typeof transaction.orderId === 'string' && ObjectId.isValid(transaction.orderId)) {
              try { orderCandidates.push(new ObjectId(transaction.orderId)); } catch (_) {}
            }
          }
          const order = await db.collection('orders').findOne(
            orderCandidates.length > 0 ? { _id: { $in: orderCandidates } } : { _id: null }
          );

          return {
            ...transaction,
            seller: seller || null,
            buyer: buyer || null,
            product: product || null,
            order: order || null
          };
        } catch (error) {
          console.error('Error fetching transaction details:', error);
          return transaction;
        }
      })
    );

    // Get summary statistics
    const stats = await db.collection('seller_transactions').aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]).toArray();

    const summary = {
      total: totalCount,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      totalPendingAmount: 0,
      totalCompletedAmount: 0
    };

    stats.forEach(stat => {
      summary[stat._id] = stat.count;
      if (stat._id === 'pending') {
        summary.totalPendingAmount = stat.totalAmount;
      } else if (stat._id === 'completed') {
        summary.totalCompletedAmount = stat.totalAmount;
      }
    });

    return Response.json({
      success: true,
      data: {
        transactions: transactionsWithDetails,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        },
        summary
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error fetching seller transactions:', error);
    return Response.json({
      success: false,
      error: 'Internal server error',
      message: error.message
    }, { status: 500 });
  }
}

// PUT - Update seller transaction status
export async function PUT(request) {
  try {
    const admin = verifyAdminToken(request);
    if (!admin) {
      return Response.json({ 
        error: 'Admin authentication required' 
      }, { status: 401 });
    }

    const { transactionId, status, notes, transactionReference } = await request.json();

    // Validate input
    if (!transactionId || !status) {
      return Response.json({ 
        error: 'Transaction ID and status are required' 
      }, { status: 400 });
    }

    if (!['pending', 'processing', 'completed', 'failed'].includes(status)) {
      return Response.json({ 
        error: 'Invalid status. Must be: pending, processing, completed, or failed' 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');

    // Get transaction details - support both string and ObjectId _id
    const idCandidates = [];
    if (transactionId) {
      idCandidates.push(transactionId);
      if (ObjectId.isValid(transactionId)) {
        try { idCandidates.push(new ObjectId(transactionId)); } catch (_) {}
      }
    }

    const transaction = await db.collection('seller_transactions').findOne({
      _id: { $in: idCandidates }
    });

    if (!transaction) {
      return Response.json({ 
        error: 'Transaction not found' 
      }, { status: 404 });
    }

    // Prepare update data
    const updateData = {
      status,
      updatedAt: new Date(),
      processedBy: admin.adminId || admin.userId,
      processedAt: new Date()
    };

    if (notes) {
      updateData.adminNotes = notes;
    }

    if (transactionReference) {
      updateData.transactionReference = transactionReference;
    }

    if (status === 'completed') {
      updateData.completedAt = new Date();
      if (!updateData.transactionReference) {
        return Response.json({ 
          error: 'transactionReference is required when marking as completed' 
        }, { status: 400 });
      }
    } else if (status === 'failed') {
      updateData.failedAt = new Date();
    }

    // Update transaction
    const result = await db.collection('seller_transactions').updateOne(
      { _id: { $in: idCandidates } },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return Response.json({ 
        error: 'Transaction not found' 
      }, { status: 404 });
    }

    // Update related order status
    if (status === 'completed') {
      const orderCandidates = [];
      if (transaction.orderId) {
        orderCandidates.push(transaction.orderId);
        if (typeof transaction.orderId === 'string' && ObjectId.isValid(transaction.orderId)) {
          try { orderCandidates.push(new ObjectId(transaction.orderId)); } catch (_) {}
        }
      }
      await db.collection('orders').updateOne(
        { _id: { $in: orderCandidates } },
        { 
          $set: { 
            sellerPaymentStatus: 'completed',
            sellerPaymentCompletedAt: new Date(),
            status: 'completed', // Mark order as fully completed
            updatedAt: new Date()
          }
        }
      );
    } else if (status === 'failed') {
      const orderCandidates = [];
      if (transaction.orderId) {
        orderCandidates.push(transaction.orderId);
        if (typeof transaction.orderId === 'string' && ObjectId.isValid(transaction.orderId)) {
          try { orderCandidates.push(new ObjectId(transaction.orderId)); } catch (_) {}
        }
      }
      await db.collection('orders').updateOne(
        { _id: { $in: orderCandidates } },
        { 
          $set: { 
            sellerPaymentStatus: 'failed',
            sellerPaymentFailedAt: new Date(),
            updatedAt: new Date()
          }
        }
      );
    }

    // Create notification for seller
    try {
      let notificationTitle = '';
      let notificationMessage = '';

      switch (status) {
        case 'processing':
          notificationTitle = 'Payment Processing';
          notificationMessage = 'Your payment request is being processed.';
          break;
        case 'completed':
          notificationTitle = 'Payment Completed!';
          notificationMessage = `Payment of ₹${transaction.amount} has been sent to your UPI ID. Ref: ${updateData.transactionReference}`;
          break;
        case 'failed':
          notificationTitle = 'Payment Failed';
          notificationMessage = 'Your payment request failed. Please contact support.';
          break;
        default:
          notificationTitle = 'Payment Status Updated';
          notificationMessage = `Your payment request status: ${status}`;
      }

      await db.collection('notifications').insertOne({
        _id: new ObjectId(),
        userId: transaction.sellerId,
        userType: 'seller',
        type: 'seller_payment_update',
        title: notificationTitle,
        message: notificationMessage,
        isRead: false,
        createdAt: new Date(),
        relatedId: transaction._id,
        relatedType: 'seller_transaction',
        data: {
          transactionId: transaction._id,
          status,
          amount: transaction.amount,
          orderId: transaction.orderId,
          reference: updateData.transactionReference
        }
      });
    } catch (notificationError) {
      console.error('Error creating seller notification:', notificationError);
      // Don't fail the main operation
    }

    console.log('✅ Seller transaction updated by admin:', {
      transactionId: transaction._id,
      status,
      adminId: admin.adminId || admin.userId,
      amount: transaction.amount,
      sellerId: transaction.sellerId
    });

    return Response.json({
      success: true,
      message: `Transaction ${status} successfully`,
      data: {
        transactionId: transaction._id,
        status,
        processedAt: updateData.processedAt,
        processedBy: admin.name || admin.adminId
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error updating seller transaction:', error);
    return Response.json({
      success: false,
      error: 'Internal server error',
      message: error.message
    }, { status: 500 });
  }
}