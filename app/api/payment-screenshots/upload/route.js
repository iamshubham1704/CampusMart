// app/api/payment-screenshots/upload/route.js - UPDATED VERSION WITH IMAGEKIT
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongo';
import { verifyToken } from '../../../../lib/auth';
import { uploadImageToImageKit } from '../../../../lib/imagekit';
import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';

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
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' 
      }, { status: 400 });
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (screenshot.size > maxSize) {
      return NextResponse.json({ 
        error: 'File size too large. Maximum 10MB allowed.' 
      }, { status: 400 });
    }

    // Convert file to base64 for ImageKit upload
    const bytes = await screenshot.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString('base64');

    // Generate unique filename
    const screenshotId = uuidv4();
    const fileExtension = screenshot.type.split('/')[1];
    const fileName = `payment-screenshot-${screenshotId}.${fileExtension}`;

    console.log('📤 Starting ImageKit upload for payment screenshot:', {
      fileName,
      fileSize: screenshot.size,
      mimeType: screenshot.type
    });

    // Upload to ImageKit
    const uploadResult = await uploadImageToImageKit(
      `data:${screenshot.type};base64,${base64Data}`,
      fileName,
      'campusmart/payment-screenshots'
    );

    if (!uploadResult.success) {
      console.error('❌ ImageKit upload failed:', uploadResult.error);
      return NextResponse.json({
        error: 'Failed to upload image',
        message: uploadResult.error
      }, { status: 500 });
    }

    // Connect to database
    const client = await clientPromise;
    const db = client.db('campusmart');
    
    // Get form data
    const productId = formData.get('productId');
    const sellerId = formData.get('sellerId');
    const amount = parseFloat(formData.get('amount'));
    const paymentMethod = formData.get('paymentMethod') || 'upi';
    const upiId = formData.get('upiId') || '8750471736@ptsbi';

    // Store screenshot record in payment_screenshots collection
    const screenshotsCollection = db.collection('payment_screenshots');
    const screenshotData = {
      _id: screenshotId,
      buyerId: user.buyerId,
      buyerEmail: user.email,
      productId: productId,
      sellerId: sellerId,
      orderId: uuidv4(),
      amount: amount,
      paymentMethod: paymentMethod,
      upiId: upiId,
      
      // ImageKit data (no more base64 in database!)
      imageKit: {
        fileId: uploadResult.data.fileId,
        url: uploadResult.data.url,
        thumbnailUrl: uploadResult.data.thumbnailUrl,
        fileName: uploadResult.data.fileName,
        filePath: uploadResult.data.filePath,
        size: uploadResult.data.size,
        width: uploadResult.data.width,
        height: uploadResult.data.height
      },
      
      // Original file metadata
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
        uploadMethod: 'imagekit'
      }
    };

    // Insert screenshot record
    const screenshotResult = await screenshotsCollection.insertOne(screenshotData);

    if (!screenshotResult.acknowledged) {
      // If database insert fails, delete the uploaded image from ImageKit
      try {
        await deleteImageFromImageKit(uploadResult.data.fileId);
      } catch (cleanupError) {
        console.error('❌ Failed to cleanup ImageKit image after DB error:', cleanupError);
      }
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
      // If order creation fails, remove the screenshot and cleanup ImageKit
      await screenshotsCollection.deleteOne({ _id: screenshotData._id });
      try {
        await deleteImageFromImageKit(uploadResult.data.fileId);
      } catch (cleanupError) {
        console.error('❌ Failed to cleanup ImageKit image after order creation error:', cleanupError);
      }
      throw new Error('Failed to create order record');
    }

    // Immediately mark the listing as inactive to prevent duplicate purchases
    try {
      const listingsCollection = db.collection('listings');
      let listingObjectId;
      try {
        listingObjectId = new ObjectId(productId);
      } catch (_) {
        // If not a valid ObjectId, leave as undefined so the update doesn't run
      }

      if (listingObjectId) {
        await listingsCollection.updateOne(
          { _id: listingObjectId },
          {
            $set: {
              status: 'inactive',
              reservedBy: user.buyerId,
              reservedAt: new Date(),
              reservedOrderId: screenshotData.orderId
            }
          }
        );
        console.log('✅ Listing marked inactive after payment submission:', productId);
      } else {
        console.warn('⚠️ Could not convert productId to ObjectId; listing status not updated:', productId);
      }
    } catch (listingUpdateError) {
      console.error('❌ Error setting listing inactive after payment submission:', listingUpdateError);
      // Do not fail the request; admin can manage status later
    }

    console.log('✅ Payment screenshot uploaded successfully:', {
      screenshotId: screenshotData._id,
      orderId: screenshotData.orderId,
      imagekitFileId: uploadResult.data.fileId,
      imageUrl: uploadResult.data.url
    });

    return NextResponse.json({
      success: true,
      message: 'Screenshot uploaded successfully',
      data: {
        screenshotId: screenshotData._id,
        orderId: screenshotData.orderId,
        imageUrl: uploadResult.data.url,
        thumbnailUrl: uploadResult.data.thumbnailUrl,
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