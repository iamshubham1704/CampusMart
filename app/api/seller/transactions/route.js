// app/api/seller/transactions/route.js - NEW FILE
import { verifyToken } from '@/lib/auth';
import clientPromise from '@/lib/mongo';
import { ObjectId } from 'mongodb';

// GET - Fetch seller's transaction requests
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

    const client = await clientPromise;
    const db = client.db('campusmart');
    
    // Build filter
    let filter = { sellerId: decoded.sellerId };
    if (status && status !== 'all') {
      filter.status = status;
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
          // Get order details
          const order = await db.collection('orders').findOne({
            _id: transaction.orderId
          });

          // Get product details
          const product = await db.collection('listings').findOne({
            _id: transaction.productId
          }, { projection: { title: 1, price: 1, images: 1 } });

          // Get buyer details
          const buyer = await db.collection('buyers').findOne({
            _id: transaction.buyerId
          }, { projection: { name: 1, email: 1 } });

          return {
            ...transaction,
            order: order || null,
            product: product || null,
            buyer: buyer || null
          };
        } catch (error) {
          console.error('Error fetching transaction details:', error);
          return transaction;
        }
      })
    );

    return Response.json({
      success: true,
      data: {
        transactions: transactionsWithDetails,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
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

// POST - Create new payment request
export async function POST(request) {
  try {
    const decoded = verifyToken(request);
    if (!decoded || !decoded.sellerId) {
      return Response.json({ 
        error: 'Seller authentication required' 
      }, { status: 401 });
    }

    const { orderId, upiId, accountHolderName, bankName } = await request.json();

    // Validate required fields
    if (!orderId || !upiId) {
      return Response.json({ 
        error: 'Order ID and UPI ID are required' 
      }, { status: 400 });
    }

    // Validate UPI ID format (basic validation)
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    if (!upiRegex.test(upiId)) {
      return Response.json({ 
        error: 'Invalid UPI ID format' 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');

    // Verify the order belongs to this seller and payment is verified
    const order = await db.collection('orders').findOne({
      _id: orderId,
      sellerId: decoded.sellerId,
      status: 'payment_verified' // Only allow if buyer payment is verified
    });

    if (!order) {
      return Response.json({ 
        error: 'Order not found or payment not verified yet' 
      }, { status: 404 });
    }

    // Check if transaction request already exists for this order
    const existingTransaction = await db.collection('seller_transactions').findOne({
      orderId: orderId,
      sellerId: decoded.sellerId
    });

    if (existingTransaction) {
      return Response.json({ 
        error: 'Payment request already exists for this order' 
      }, { status: 409 });
    }

    // Create new seller transaction record
    const transactionId = new ObjectId().toString();
    const transactionData = {
      _id: transactionId,
      sellerId: decoded.sellerId,
      buyerId: order.buyerId,
      orderId: orderId,
      productId: order.productId,
      amount: order.amount,
      sellerUpiId: upiId,
      accountHolderName: accountHolderName || '',
      bankName: bankName || '',
      status: 'pending', // pending, processing, completed, failed
      requestedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      paymentMethod: 'upi',
      transactionType: 'seller_payout'
    };

    // Insert transaction record
    await db.collection('seller_transactions').insertOne(transactionData);

    // Update order status to indicate seller has requested payment
    await db.collection('orders').updateOne(
      { _id: orderId },
      { 
        $set: { 
          sellerPaymentRequested: true,
          sellerPaymentRequestedAt: new Date(),
          sellerTransactionId: transactionId,
          updatedAt: new Date()
        }
      }
    );

    // Create notification for admin
    try {
      await db.collection('notifications').insertOne({
        _id: new ObjectId(),
        userId: 'admin',
        userType: 'admin',
        type: 'seller_payment_request',
        title: 'New Seller Payment Request',
        message: `Seller has requested payment for order ${orderId}`,
        isRead: false,
        createdAt: new Date(),
        relatedId: transactionId,
        relatedType: 'seller_transaction',
        data: {
          sellerId: decoded.sellerId,
          orderId: orderId,
          amount: order.amount,
          upiId: upiId
        }
      });
    } catch (notificationError) {
      console.error('Error creating admin notification:', notificationError);
      // Don't fail the main operation
    }

    console.log('✅ Seller payment request created:', {
      transactionId,
      sellerId: decoded.sellerId,
      orderId,
      amount: order.amount,
      upiId: upiId
    });

    return Response.json({
      success: true,
      message: 'Payment request submitted successfully',
      data: {
        transactionId,
        status: 'pending',
        requestedAt: transactionData.requestedAt,
        amount: order.amount
      }
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error creating seller payment request:', error);
    return Response.json({
      success: false,
      error: 'Internal server error',
      message: error.message
    }, { status: 500 });
  }
}