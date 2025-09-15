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
    
    // Convert screenshotId to ObjectId or handle UUID
    let screenshotObjectId;
    let isUUID = false;
    
    try {
      // First try to convert as ObjectId
      screenshotObjectId = new ObjectId(screenshotId);
    } catch (error) {
      // If not ObjectId, check if it's a UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(screenshotId)) {
        isUUID = true;
        // For UUID, we'll search by the string ID directly
        screenshotObjectId = screenshotId;
        console.log('🔍 UUID format detected:', screenshotId);
      } else {
        return Response.json({ 
          error: 'Invalid screenshot ID format. Expected MongoDB ObjectId or UUID format.' 
        }, { status: 400 });
      }
    }
    
    // First, get the screenshot details
    const screenshotsCollection = db.collection('payment_screenshots');
    let screenshot;
    
    if (isUUID) {
      // Search by UUID string
      screenshot = await screenshotsCollection.findOne({ _id: screenshotId });
    } else {
      // Search by ObjectId
      screenshot = await screenshotsCollection.findOne({ _id: screenshotObjectId });
    }

    if (!screenshot) {
      return Response.json({ 
        error: 'Payment screenshot not found' 
      }, { status: 404 });
    }

    console.log('🔍 Found screenshot:', {
      id: screenshot._id,
      idType: typeof screenshot._id,
      currentStatus: screenshot.status,
      productId: screenshot.productId,
      buyerId: screenshot.buyerId,
      sellerId: screenshot.sellerId
    });

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

    console.log('📝 Updating screenshot with data:', updateData);
    console.log('🔧 Using ID for update:', isUUID ? screenshotId : screenshotObjectId);
    console.log('🔧 ID type:', isUUID ? 'UUID (string)' : 'ObjectId');

    const result = await screenshotsCollection.updateOne(
      { _id: isUUID ? screenshotId : screenshotObjectId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return Response.json({ 
        error: 'Payment screenshot not found' 
      }, { status: 404 });
    }

    if (result.modifiedCount === 0) {
      console.log('⚠️ Screenshot update resulted in no changes');
    } else {
      console.log('✅ Screenshot status updated successfully');
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

    console.log('📦 Looking for order with paymentScreenshotId:', isUUID ? screenshotId : screenshotObjectId);

    const orderResult = await ordersCollection.updateOne(
      { paymentScreenshotId: isUUID ? screenshotId : screenshotObjectId },
      { $set: orderUpdate }
    );

    if (orderResult.matchedCount === 0) {
      console.log('⚠️ No order found with paymentScreenshotId:', isUUID ? screenshotId : screenshotObjectId);
    } else {
      console.log('✅ Order status updated successfully');
    }

    // If verified, also update the listing status to 'sold';
    // If rejected, revert listing back to 'active'
    // Prepare ObjectId for listing updates
    let productObjectId = null;
    try {
      productObjectId = typeof screenshot.productId === 'string'
        ? new ObjectId(screenshot.productId)
        : screenshot.productId;
    } catch (_) {
      productObjectId = null;
    }

    if (status === 'verified') {
      try {
        const listingsCollection = db.collection('listings');
        const listingResult = await listingsCollection.updateOne(
          { _id: productObjectId || screenshot.productId },
          { 
            $set: { 
              status: 'sold',
              soldAt: new Date(),
              soldTo: screenshot.buyerId
            }
          }
        );
        
        if (listingResult.matchedCount > 0) {
          console.log('✅ Listing marked as sold:', screenshot.productId);
        } else {
          console.log('⚠️ No listing found to mark as sold:', screenshot.productId);
        }
      } catch (listingError) {
        console.error('❌ Error updating listing status:', listingError);
        // Don't fail the entire operation if listing update fails
      }
    } else if (status === 'rejected') {
      try {
        const listingsCollection = db.collection('listings');
        const listingResult = await listingsCollection.updateOne(
          { _id: productObjectId || screenshot.productId },
          { 
            $set: { 
              status: 'active',
              soldAt: null,
              soldTo: null
            }
          }
        );
        
        if (listingResult.matchedCount > 0) {
          console.log('✅ Listing reverted to active:', screenshot.productId);
        } else {
          console.log('⚠️ No listing found to revert:', screenshot.productId);
        }
      } catch (listingError) {
        console.error('❌ Error reverting listing status:', listingError);
        // Don't fail the entire operation if listing update fails
      }
    }

    console.log('🎉 Payment verification process completed successfully');

    return Response.json({
      success: true,
      message: `Payment screenshot ${status} successfully`,
      data: { 
        screenshotId, 
        status,
        verifiedAt: updateData.verifiedAt,
        verifiedBy: updateData.verifiedBy
      }
    });

  } catch (error) {
    console.error('❌ Error in payment verification:', error);
    return Response.json({
      success: false,
      error: 'Internal server error',
      details: error.message
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