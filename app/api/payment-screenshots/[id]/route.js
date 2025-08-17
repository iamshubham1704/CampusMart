
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongo';
import { verifyAdminToken } from '../../../../lib/auth';

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
    const db = client.db('campusmart');
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

    // Also delete related order
    const ordersCollection = db.collection('orders');
    await ordersCollection.deleteOne({ paymentScreenshotId: id });

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