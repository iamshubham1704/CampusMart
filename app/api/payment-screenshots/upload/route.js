import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongo';
import { verifyToken } from '../../../../lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    // Verify authentication
    const user = verifyToken(request);
    if (!user || !user.buyerId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const screenshot = formData.get('screenshot');
    
    if (!screenshot) {
      return NextResponse.json({ error: 'No screenshot file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(screenshot.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' }, { status: 400 });
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (screenshot.size > maxSize) {
      return NextResponse.json({ error: 'File size too large. Maximum 10MB allowed.' }, { status: 400 });
    }

    // Convert file to base64 for database storage
    const bytes = await screenshot.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString('base64');

    // Connect to database
    const client = await clientPromise;
    const db = client.db('campusmart'); // Replace with your database name
    
    // Get form data
    const productId = formData.get('productId');
    const sellerId = formData.get('sellerId');
    const amount = parseFloat(formData.get('amount'));
    const paymentMethod = formData.get('paymentMethod') || 'upi';
    const upiId = formData.get('upiId') || '8750471736@ptsbi';

    // Store screenshot in payment_screenshots collection
    const screenshotsCollection = db.collection('payment_screenshots');
    const screenshotData = {
      _id: uuidv4(),
      buyerId: user.buyerId,
      buyerEmail: user.email,
      productId: productId,
      sellerId: sellerId,
      orderId: uuidv4(),
      amount: amount,
      paymentMethod: paymentMethod,
      upiId: upiId,
      
      // File data stored in database
      imageData: base64Data,
      originalFilename: screenshot.name,
      fileSize: screenshot.size,
      mimeType: screenshot.type,
      
      // Status and metadata
      uploadedAt: new Date(),
      status: 'pending_verification',
      verifiedAt: null,
      verifiedBy: null,
      rejectionReason: null,
      metadata: {
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      }
    };

    // Insert screenshot record
    const screenshotResult = await screenshotsCollection.insertOne(screenshotData);

    if (!screenshotResult.acknowledged) {
      throw new Error('Failed to save screenshot record');
    }

    // Create order record
    const ordersCollection = db.collection('orders');
    const orderData = {
      _id: screenshotData.orderId,
      buyerId: user.buyerId,
      sellerId: sellerId,
      productId: productId,
      amount: screenshotData.amount,
      paymentMethod: screenshotData.paymentMethod,
      paymentScreenshotId: screenshotData._id,
      status: 'payment_pending_verification',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const orderResult = await ordersCollection.insertOne(orderData);

    if (!orderResult.acknowledged) {
      // If order creation fails, remove the screenshot
      await screenshotsCollection.deleteOne({ _id: screenshotData._id });
      throw new Error('Failed to create order record');
    }

    console.log('✅ Payment screenshot uploaded to database:', {
      screenshotId: screenshotData._id,
      orderId: screenshotData.orderId,
      fileSize: screenshot.size,
      mimeType: screenshot.type
    });

    return NextResponse.json({
      success: true,
      message: 'Screenshot uploaded successfully',
      data: {
        screenshotId: screenshotData._id,
        orderId: screenshotData.orderId,
        status: 'pending_verification',
        uploadedAt: screenshotData.uploadedAt
      }
    });

  } catch (error) {
    console.error('❌ Error uploading payment screenshot:', error);
    
    return NextResponse.json({
      error: 'Failed to upload screenshot',
      message: error.message
    }, { status: 500 });
  }
}