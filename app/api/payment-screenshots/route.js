// app/api/admin/payment-screenshots/route.js
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongo';
import { verifyAdminToken } from '../../../../lib/auth';

export async function GET(request) {
  // Verify admin authentication
  const admin = verifyAdminToken(request);
  if (!admin) {
    return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const buyerId = searchParams.get('buyerId');
    const sellerId = searchParams.get('sellerId');

    const client = await clientPromise;
    const db = client.db('campusmart');
    const collection = db.collection('payment_screenshots');

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (buyerId) filter.buyerId = buyerId;
    if (sellerId) filter.sellerId = sellerId;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get payment screenshots with pagination (exclude large imageData field for list view)
    const screenshots = await collection
      .find(filter, { 
        projection: { 
          imageData: 0 // Exclude imageData from list view for performance
        }
      })
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count for pagination
    const totalCount = await collection.countDocuments(filter);

    // Get additional data for each screenshot
    const screenshotsWithDetails = await Promise.all(
      screenshots.map(async (screenshot) => {
        // Get buyer details
        const buyersCollection = db.collection('buyers');
        const buyer = await buyersCollection.findOne(
          { _id: screenshot.buyerId },
          { projection: { name: 1, email: 1, phone: 1 } }
        );

        // Get seller details
        const sellersCollection = db.collection('sellers');
        const seller = await sellersCollection.findOne(
          { _id: screenshot.sellerId },
          { projection: { name: 1, email: 1, phone: 1 } }
        );

        // Get product details
        const productsCollection = db.collection('listings');
        const product = await productsCollection.findOne(
          { _id: screenshot.productId },
          { projection: { title: 1, price: 1, images: 1 } }
        );

        return {
          ...screenshot,
          buyer: buyer || null,
          seller: seller || null,
          product: product || null,
          // Add image URL for viewing
          imageUrl: `/api/payment-screenshots/image/${screenshot._id}`
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        screenshots: screenshotsWithDetails,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching payment screenshots:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error.message
    }, { status: 500 });
  }
}

export async function PUT(request) {
  // Verify admin authentication
  const admin = verifyAdminToken(request);
  if (!admin) {
    return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
  }

  try {
    const { screenshotId, status, rejectionReason } = await request.json();

    if (!screenshotId || !status) {
      return NextResponse.json({ error: 'Screenshot ID and status are required' }, { status: 400 });
    }

    if (!['verified', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Status must be either "verified" or "rejected"' }, { status: 400 });
    }

    if (status === 'rejected' && !rejectionReason) {
      return NextResponse.json({ error: 'Rejection reason is required when rejecting' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart'); // Replace with your database name
    const collection = db.collection('payment_screenshots');

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

    const result = await collection.updateOne(
      { _id: screenshotId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Payment screenshot not found' }, { status: 404 });
    }

    // Also update the corresponding order status
    const ordersCollection = db.collection('orders');
    const orderStatus = status === 'verified' ? 'payment_verified' : 'payment_rejected';
    
    await ordersCollection.updateOne(
      { paymentScreenshotId: screenshotId },
      { 
        $set: { 
          status: orderStatus,
          updatedAt: new Date(),
          paymentVerifiedAt: status === 'verified' ? new Date() : null,
          paymentRejectionReason: status === 'rejected' ? rejectionReason : null
        }
      }
    );

    console.log(`✅ Payment screenshot ${status}:`, {
      screenshotId,
      status,
      verifiedBy: admin.adminId || admin.userId
    });

    return NextResponse.json({
      success: true,
      message: `Payment screenshot ${status} successfully`,
      data: { screenshotId, status }
    });

  } catch (error) {
    console.error('❌ Error updating payment screenshot:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error.message
    }, { status: 500 });
  }
}

// app/api/admin/payment-screenshots/[id]/route.js
export async function GET(request, { params }) {
  const { id } = params;

  // Verify admin authentication
  const admin = verifyAdminToken(request);
  if (!admin) {
    return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db('campusmart'); // Replace with your database name
    const collection = db.collection('payment_screenshots');

    // Get single payment screenshot with full details (including imageData for admin view)
    const screenshot = await collection.findOne({ _id: id });

    if (!screenshot) {
      return NextResponse.json({ error: 'Payment screenshot not found' }, { status: 404 });
    }

    // Get buyer details
    const buyersCollection = db.collection('buyers');
    const buyer = await buyersCollection.findOne({ _id: screenshot.buyerId });

    // Get seller details
    const sellersCollection = db.collection('sellers');
    const seller = await sellersCollection.findOne({ _id: screenshot.sellerId });

    // Get product details
    const productsCollection = db.collection('listings');
    const product = await productsCollection.findOne({ _id: screenshot.productId });

    // Get order details
    const ordersCollection = db.collection('orders');
    const order = await ordersCollection.findOne({ paymentScreenshotId: id });

    return NextResponse.json({
      success: true,
      data: {
        ...screenshot,
        buyer: buyer || null,
        seller: seller || null,
        product: product || null,
        order: order || null,
        imageUrl: `/api/payment-screenshots/image/${id}`
      }
    });

  } catch (error) {
    console.error('❌ Error fetching payment screenshot details:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error.message
    }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = params;

  // Verify admin authentication
  const admin = verifyAdminToken(request);
  if (!admin) {
    return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db('campusmart'); // Replace with your database name
    const collection = db.collection('payment_screenshots');

    // Delete from database (this will also remove the imageData)
    const result = await collection.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Payment screenshot not found' }, { status: 404 });
    }

    // Also delete related order
    const ordersCollection = db.collection('orders');
    await ordersCollection.deleteOne({ paymentScreenshotId: id });

    console.log('🗑️ Payment screenshot deleted from database:', id);

    return NextResponse.json({
      success: true,
      message: 'Payment screenshot deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting payment screenshot:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error.message
    }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = params;

  // Verify admin authentication
  const admin = verifyAdminToken(request);
  if (!admin) {
    return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db('campusmart'); // Replace with your database name
    const collection = db.collection('payment_screenshots');

    // Get screenshot info before deleting
    const screenshot = await collection.findOne({ _id: id });
    if (!screenshot) {
      return NextResponse.json({ error: 'Payment screenshot not found' }, { status: 404 });
    }

    // Delete from database
    const result = await collection.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Payment screenshot not found' }, { status: 404 });
    }



    console.log('🗑️ Payment screenshot deleted:', id);

    return NextResponse.json({
      success: true,
      message: 'Payment screenshot deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting payment screenshot:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error.message
    }, { status: 500 });
  }
}