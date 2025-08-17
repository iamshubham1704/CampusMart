// app/api/admin/payment-screenshots/verify/route.js - CREATE NEW FILE
import { verifyToken } from '@/lib/auth';
import clientPromise from '@/lib/mongo';
import { ObjectId } from 'mongodb';

// Verify admin token
function verifyAdminToken(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    // Check if user has admin role
    if (!decoded || decoded.role !== 'admin') {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('Admin token verification failed:', error);
    return null;
  }
}

export async function POST(request) {
  try {
    const admin = verifyAdminToken(request);
    if (!admin) {
      return Response.json({ 
        error: 'Unauthorized. Admin access required.' 
      }, { status: 401 });
    }

    const { screenshotId, status, rejectionReason } = await request.json();

    // Validate input
    if (!screenshotId || !status) {
      return Response.json({ 
        error: 'Screenshot ID and status are required' 
      }, { status: 400 });
    }

    if (!['verified', 'rejected'].includes(status)) {
      return Response.json({ 
        error: 'Status must be either "verified" or "rejected"' 
      }, { status: 400 });
    }

    if (status === 'rejected' && !rejectionReason) {
      return Response.json({ 
        error: 'Rejection reason is required when rejecting' 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');
    
    // First, get the screenshot details
    const screenshotsCollection = db.collection('payment_screenshots');
    const screenshot = await screenshotsCollection.findOne({ _id: screenshotId });

    if (!screenshot) {
      return Response.json({ 
        error: 'Payment screenshot not found' 
      }, { status: 404 });
    }

    // Check if already processed
    if (screenshot.status !== 'pending_verification') {
      return Response.json({ 
        error: `Payment already ${screenshot.status}` 
      }, { status: 400 });
    }

    // Update screenshot status
    const updateData = {
      status,
      verifiedAt: new Date(),
      verifiedBy: admin.adminId || admin.userId,
      updatedAt: new Date()
    };

    if (status === 'rejected') {
      updateData.rejectionReason = rejectionReason;
    }

    const result = await screenshotsCollection.updateOne(
      { _id: screenshotId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return Response.json({ 
        error: 'Payment screenshot not found' 
      }, { status: 404 });
    }

    // Update the corresponding order status
    const ordersCollection = db.collection('orders');
    const orderStatus = status === 'verified' ? 'payment_verified' : 'payment_rejected';
    
    const orderUpdate = { 
      status: orderStatus,
      updatedAt: new Date()
    };

    if (status === 'verified') {
      orderUpdate.paymentVerifiedAt = new Date();
      orderUpdate.verifiedBy = admin.adminId || admin.userId;
    } else {
      orderUpdate.paymentRejectionReason = rejectionReason;
      orderUpdate.rejectedBy = admin.adminId || admin.userId;
    }

    await ordersCollection.updateOne(
      { paymentScreenshotId: screenshotId },
      { $set: orderUpdate }
    );

    // If verified, also update the listing status to 'sold'
    if (status === 'verified') {
      try {
        const listingsCollection = db.collection('listings');
        await listingsCollection.updateOne(
          { _id: screenshot.productId },
          { 
            $set: { 
              status: 'sold',
              soldAt: new Date(),
              soldTo: screenshot.buyerId
            }
          }
        );
        console.log('✅ Listing marked as sold:', screenshot.productId);
      } catch (listingError) {
        console.error('❌ Error updating listing status:', listingError);
        // Don't fail the entire operation if listing update fails
      }
    }

    // Log the verification action
    console.log(`✅ Payment screenshot ${status} by admin:`, {
      screenshotId,
      status,
      adminId: admin.adminId || admin.userId,
      adminName: admin.name,
      verifiedAt: updateData.verifiedAt,
      buyerId: screenshot.buyerId,
      sellerId: screenshot.sellerId,
      productId: screenshot.productId,
      amount: screenshot.amount
    });

    // Create notification records (you can add these collections if needed)
    try {
      const notificationsCollection = db.collection('notifications');
      
      // Notify buyer
      await notificationsCollection.insertOne({
        _id: new ObjectId(),
        userId: screenshot.buyerId,
        userType: 'buyer',
        type: 'payment_verification',
        title: status === 'verified' ? 'Payment Verified!' : 'Payment Rejected',
        message: status === 'verified' 
          ? 'Your payment has been verified. The seller will be notified to proceed with delivery.'
          : `Your payment has been rejected. Reason: ${rejectionReason}`,
        isRead: false,
        createdAt: new Date(),
        relatedId: screenshotId,
        relatedType: 'payment'
      });

      // Notify seller
      await notificationsCollection.insertOne({
        _id: new ObjectId(),
        userId: screenshot.sellerId,
        userType: 'seller',
        type: 'payment_verification',
        title: status === 'verified' ? 'Payment Received!' : 'Payment Issue',
        message: status === 'verified' 
          ? 'Payment for your item has been verified. Please proceed with delivery to the buyer.'
          : `Payment verification failed for your item. Reason: ${rejectionReason}`,
        isRead: false,
        createdAt: new Date(),
        relatedId: screenshotId,
        relatedType: 'payment'
      });

      console.log('✅ Notifications sent to buyer and seller');
    } catch (notificationError) {
      console.error('❌ Error creating notifications:', notificationError);
      // Don't fail the main operation
    }

    return Response.json({
      success: true,
      message: `Payment screenshot ${status} successfully`,
      data: { 
        screenshotId, 
        status,
        verifiedAt: updateData.verifiedAt,
        verifiedBy: admin.name || admin.adminId
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error verifying payment screenshot:', error);
    return Response.json({
      success: false,
      error: 'Internal server error',
      message: error.message
    }, { status: 500 });
  }
}

// GET endpoint to fetch verification details (optional)
export async function GET(request) {
  try {
    const admin = verifyAdminToken(request);
    if (!admin) {
      return Response.json({ 
        error: 'Unauthorized. Admin access required.' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const screenshotId = searchParams.get('screenshotId');

    if (!screenshotId) {
      return Response.json({ 
        error: 'Screenshot ID is required' 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');
    
    const screenshotsCollection = db.collection('payment_screenshots');
    const screenshot = await screenshotsCollection.findOne({ _id: screenshotId });

    if (!screenshot) {
      return Response.json({ 
        error: 'Payment screenshot not found' 
      }, { status: 404 });
    }

    // Get related order
    const ordersCollection = db.collection('orders');
    const order = await ordersCollection.findOne({ paymentScreenshotId: screenshotId });

    // Get buyer details
    const buyersCollection = db.collection('buyers');
    const buyer = await buyersCollection.findOne(
      { _id: screenshot.buyerId },
      { projection: { password: 0 } } // Exclude sensitive data
    );

    // Get seller details
    const sellersCollection = db.collection('sellers');
    const seller = await sellersCollection.findOne(
      { _id: screenshot.sellerId },
      { projection: { password: 0 } } // Exclude sensitive data
    );

    // Get product details
    const productsCollection = db.collection('listings');
    const product = await productsCollection.findOne({ _id: screenshot.productId });

    return Response.json({
      success: true,
      data: {
        screenshot: {
          ...screenshot,
          // Don't include the actual image data, just the URL
          imageData: undefined,
          imageUrl: `/api/payment-screenshots/image/${screenshot._id}`
        },
        order,
        buyer,
        seller,
        product
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error fetching payment verification details:', error);
    return Response.json({
      success: false,
      error: 'Internal server error',
      message: error.message
    }, { status: 500 });
  }
}