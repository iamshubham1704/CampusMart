// app/api/payment-screenshots/[id]/route.js - UPDATED VERSION WITH IMAGEKIT
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongo';
import { verifyAdminToken } from '../../../../lib/auth';
import { deleteImageFromImageKit } from '../../../../lib/imagekit';

export async function GET(request, { params }) {
  const { id } = params;

  // Verify admin authentication
  const admin = verifyAdminToken(request);
  if (!admin) {
    return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db('campusmart');
    const collection = db.collection('payment_screenshots');

    // Get single payment screenshot with full details
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

    return NextResponse.json({
      success: true,
      data: {
        ...screenshot,
        buyer: buyer || null,
        seller: seller || null,
        product: product || null,
        order: order || null,
        imageUrl,
        thumbnailUrl,
        // Additional metadata for admin
        storageMethod: screenshot.imageKit ? 'imagekit' : 'base64',
        imageKit: screenshot.imageKit || null
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
    const db = client.db('campusmart');
    const collection = db.collection('payment_screenshots');

    // Get screenshot info before deleting
    const screenshot = await collection.findOne({ _id: id });
    if (!screenshot) {
      return NextResponse.json({ error: 'Payment screenshot not found' }, { status: 404 });
    }

    // Delete from ImageKit if it exists
    if (screenshot.imageKit && screenshot.imageKit.fileId) {
      console.log('🗑️ Deleting image from ImageKit:', screenshot.imageKit.fileId);
      
      const deleteResult = await deleteImageFromImageKit(screenshot.imageKit.fileId);
      if (!deleteResult.success) {
        console.warn('⚠️ Failed to delete image from ImageKit:', deleteResult.error);
        // Don't fail the entire operation, just log the warning
      } else {
        console.log('✅ Image deleted from ImageKit successfully');
      }
    }

    // Delete from database
    const result = await collection.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Payment screenshot not found' }, { status: 404 });
    }

    // Also delete related order
    const ordersCollection = db.collection('orders');
    const orderDeleteResult = await ordersCollection.deleteOne({ paymentScreenshotId: id });

    console.log('🗑️ Payment screenshot deleted:', {
      screenshotId: id,
      imagekitDeleted: screenshot.imageKit ? 'attempted' : 'not_applicable',
      orderDeleted: orderDeleteResult.deletedCount > 0
    });

    return NextResponse.json({
      success: true,
      message: 'Payment screenshot deleted successfully',
      data: {
        screenshotDeleted: true,
        orderDeleted: orderDeleteResult.deletedCount > 0,
        imagekitDeleted: screenshot.imageKit ? true : false
      }
    });

  } catch (error) {
    console.error('❌ Error deleting payment screenshot:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error.message
    }, { status: 500 });
  }
}