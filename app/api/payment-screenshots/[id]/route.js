// app/api/payment-screenshots/image/[id]/route.js - UPDATE EXISTING FILE
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongo';
import { verifyAdminToken, verifyToken } from '../../../../lib/auth';

export async function GET(request, { params }) {
  const { id } = params;

  try {
    // First try to verify as admin, then as regular user
    const admin = verifyAdminToken(request);
    const user = verifyToken(request);
    
    if (!admin && !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');
    const collection = db.collection('payment_screenshots');

    // Get the screenshot record
    const screenshot = await collection.findOne({ _id: id });

    if (!screenshot) {
      return NextResponse.json({ error: 'Screenshot not found' }, { status: 404 });
    }

    // Authorization check
    let isAuthorized = false;
    
    if (admin) {
      // Admin can view any screenshot
      isAuthorized = true;
    } else if (user) {
      // Regular user can only view their own screenshot
      const isBuyerOwner = user.buyerId === screenshot.buyerId;
      const isSellerOwner = user.sellerId === screenshot.sellerId;
      isAuthorized = isBuyerOwner || isSellerOwner;
    }

    if (!isAuthorized) {
      return NextResponse.json({ 
        error: 'Not authorized to view this screenshot' 
      }, { status: 403 });
    }

    // Check if imageData exists
    if (!screenshot.imageData) {
      return NextResponse.json({ 
        error: 'Screenshot data not found' 
      }, { status: 404 });
    }

    // Convert base64 back to buffer
    let imageBuffer;
    try {
      imageBuffer = Buffer.from(screenshot.imageData, 'base64');
    } catch (error) {
      console.error('Error converting base64 to buffer:', error);
      return NextResponse.json({ 
        error: 'Invalid image data' 
      }, { status: 500 });
    }

    // Validate image buffer
    if (!imageBuffer || imageBuffer.length === 0) {
      return NextResponse.json({ 
        error: 'Empty image data' 
      }, { status: 500 });
    }

    // Create response with proper headers
    const response = new NextResponse(imageBuffer);
    
    // Set content type
    const mimeType = screenshot.mimeType || 'image/jpeg';
    response.headers.set('Content-Type', mimeType);
    response.headers.set('Content-Length', imageBuffer.length.toString());
    
    // Set cache headers
    if (admin) {
      // Admin viewing - shorter cache
      response.headers.set('Cache-Control', 'private, max-age=1800'); // 30 minutes
    } else {
      // User viewing their own - longer cache
      response.headers.set('Cache-Control', 'private, max-age=7200'); // 2 hours
    }
    
    // Set filename for download
    const filename = screenshot.originalFilename || `payment-screenshot-${id}.${mimeType.split('/')[1]}`;
    response.headers.set('Content-Disposition', `inline; filename="${filename}"`);
    
    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    
    return response;

  } catch (error) {
    console.error('❌ Error serving screenshot image:', error);
    return NextResponse.json({
      error: 'Failed to load image',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}