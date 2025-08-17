// app/api/payment-screenshots/image/[id]/route.js - FIXED VERSION
import { NextResponse } from 'next/server';
import clientPromise from '../../../../../lib/mongo';
import { verifyToken } from '../../../../../lib/auth';

export async function GET(request, context) {
  try {
    // Fix 1: Await params before accessing properties
    const params = await context.params;
    const { id } = params;

    console.log('🔍 Fetching screenshot image for ID:', id);

    // Fix 2: Check for token in both Authorization header and query params
    let token = null;
    
    // Try Authorization header first
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // If no auth header, try query params (for admin access)
    if (!token) {
      const url = new URL(request.url);
      token = url.searchParams.get('token');
    }

    if (!token) {
      console.log('❌ No authentication token provided');
      return NextResponse.json({ 
        error: 'Authentication required',
        message: 'Please provide a valid authentication token'
      }, { status: 401 });
    }

    // Fix 3: Verify token manually since we might get it from query params
    let user = null;
    try {
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
      
      const decoded = jwt.verify(token, JWT_SECRET);
      user = {
        userId: decoded.userId || decoded.id || decoded.sellerId || decoded.adminId,
        adminId: decoded.adminId,
        sellerId: decoded.sellerId,
        buyerId: decoded.buyerId,
        email: decoded.email,
        role: decoded.role,
        ...decoded
      };
      
      console.log('✅ Token verified for user:', {
        userId: user.userId,
        role: user.role,
        adminId: user.adminId,
        buyerId: user.buyerId
      });
      
    } catch (tokenError) {
      console.log('❌ Token verification failed:', tokenError.message);
      return NextResponse.json({ 
        error: 'Invalid authentication token',
        message: 'Please provide a valid token'
      }, { status: 401 });
    }

    // Connect to database
    const client = await clientPromise;
    const db = client.db('campusmart');
    const collection = db.collection('payment_screenshots');

    // Get the screenshot record
    const screenshot = await collection.findOne({ _id: id });

    if (!screenshot) {
      console.log('❌ Screenshot not found for ID:', id);
      return NextResponse.json({ 
        error: 'Screenshot not found',
        message: `No payment screenshot found with ID: ${id}`
      }, { status: 404 });
    }

    // Fix 4: Authorization check - admin can view any, users can view their own
    let isAuthorized = false;
    
    if (user.role === 'admin') {
      // Admin can view any screenshot
      isAuthorized = true;
      console.log('✅ Admin access granted');
    } else {
      // Regular user can only view their own screenshot
      const isBuyerOwner = user.buyerId === screenshot.buyerId || user.userId === screenshot.buyerId;
      const isSellerOwner = user.sellerId === screenshot.sellerId || user.userId === screenshot.sellerId;
      isAuthorized = isBuyerOwner || isSellerOwner;
      
      console.log('🔍 User authorization check:', {
        userBuyerId: user.buyerId,
        userSellerId: user.sellerId,
        screenshotBuyerId: screenshot.buyerId,
        screenshotSellerId: screenshot.sellerId,
        isBuyerOwner,
        isSellerOwner,
        isAuthorized
      });
    }

    if (!isAuthorized) {
      console.log('❌ User not authorized to view this screenshot');
      return NextResponse.json({ 
        error: 'Not authorized to view this screenshot',
        message: 'You can only view your own payment screenshots'
      }, { status: 403 });
    }

    // Check if imageData exists
    if (!screenshot.imageData) {
      console.log('❌ Screenshot data not found for ID:', id);
      return NextResponse.json({ 
        error: 'Screenshot data not found',
        message: 'The image data for this screenshot is missing'
      }, { status: 404 });
    }

    // Fix 5: Convert base64 back to buffer properly
    let imageBuffer;
    try {
      // Handle both with and without data URL prefix
      let base64Data = screenshot.imageData;
      if (base64Data.startsWith('data:')) {
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        base64Data = base64Data.split(',')[1];
      }
      
      imageBuffer = Buffer.from(base64Data, 'base64');
      
      if (imageBuffer.length === 0) {
        throw new Error('Empty image buffer');
      }
      
      console.log('✅ Image buffer created successfully:', {
        originalSize: screenshot.fileSize,
        bufferSize: imageBuffer.length
      });
      
    } catch (error) {
      console.error('❌ Error converting base64 to buffer:', error);
      return NextResponse.json({ 
        error: 'Invalid image data',
        message: 'Unable to process the image data'
      }, { status: 500 });
    }

    // Fix 6: Create proper image response
    const response = new NextResponse(imageBuffer);
    
    // Set proper content type
    const mimeType = screenshot.mimeType || 'image/jpeg';
    response.headers.set('Content-Type', mimeType);
    response.headers.set('Content-Length', imageBuffer.length.toString());
    
    // Set appropriate cache headers
    if (user.role === 'admin') {
      // Admin viewing - shorter cache for freshness
      response.headers.set('Cache-Control', 'private, max-age=1800'); // 30 minutes
    } else {
      // User viewing their own - longer cache
      response.headers.set('Cache-Control', 'private, max-age=7200'); // 2 hours
    }
    
    // Set filename for proper display
    const filename = screenshot.originalFilename || `payment-screenshot-${id}.${mimeType.split('/')[1] || 'jpg'}`;
    response.headers.set('Content-Disposition', `inline; filename="${filename}"`);
    
    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    console.log('✅ Image served successfully:', {
      id,
      mimeType,
      size: imageBuffer.length,
      filename,
      userRole: user.role
    });
    
    return response;

  } catch (error) {
    console.error('❌ Error serving screenshot image:', error);
    return NextResponse.json({
      error: 'Failed to load image',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        name: error.name
      } : undefined
    }, { status: 500 });
  }
}