// app/api/payment-screenshots/route.js - UPDATED VERSION WITH IMAGEKIT
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongo';
import { verifyAdminToken } from '../../../lib/auth';

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

    // Get payment screenshots with pagination
    // No need to exclude imageData anymore since we're using ImageKit
    const screenshots = await collection
      .find(filter)
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

        // Prepare image URLs based on storage method
        let imageUrl = null;
        let thumbnailUrl = null;

        if (screenshot.imageKit && screenshot.imageKit.url) {
          // NEW: ImageKit URLs
          imageUrl = screenshot.imageKit.url;
          thumbnailUrl = screenshot.imageKit.thumbnailUrl || screenshot.imageKit.url;
        } else {
          // FALLBACK: Old API route for base64 images
          imageUrl = `/api/payment-screenshots/image/${screenshot._id}`;
          thumbnailUrl = `/api/payment-screenshots/image/${screenshot._id}?thumbnail=true`;
        }

        return {
          ...screenshot,
          buyer: buyer || null,
          seller: seller || null,
          product: product || null,
          imageUrl,
          thumbnailUrl,
          // Additional metadata for admin
          storageMethod: screenshot.imageKit ? 'imagekit' : 'base64',
          imageKit: screenshot.imageKit || null
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
    const db = client.db('campusmart');
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