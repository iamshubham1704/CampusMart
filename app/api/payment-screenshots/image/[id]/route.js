// app/api/payment-screenshots/image/[id]/route.js
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../../../../lib/mongo';
import { verifyAdminToken, verifyToken } from '../../../../../lib/auth';

export async function GET(request, { params }) {
  const { id } = params;

  try {
    // Verify authentication (either admin or the buyer who uploaded it)
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart'); // Replace with your database name
    const collection = db.collection('payment_screenshots');

    // Get the screenshot record
    const screenshot = await collection.findOne({ _id: id });

    if (!screenshot) {
      return NextResponse.json({ error: 'Screenshot not found' }, { status: 404 });
    }

    // Check authorization - only admin or the buyer who uploaded can view
    const isAdmin = verifyAdminToken(request);
    const isBuyerOwner = user.buyerId === screenshot.buyerId;

    if (!isAdmin && !isBuyerOwner) {
      return NextResponse.json({ error: 'Not authorized to view this screenshot' }, { status: 403 });
    }

    // Convert base64 back to buffer
    const imageBuffer = Buffer.from(screenshot.imageData, 'base64');

    // Create response with proper headers
    const response = new NextResponse(imageBuffer);
    response.headers.set('Content-Type', screenshot.mimeType);
    response.headers.set('Content-Length', screenshot.fileSize.toString());
    response.headers.set('Cache-Control', 'private, max-age=3600'); // Cache for 1 hour
    response.headers.set('Content-Disposition', `inline; filename="${screenshot.originalFilename}"`);

    return response;

  } catch (error) {
    console.error('❌ Error serving screenshot image:', error);
    return NextResponse.json({
      error: 'Failed to load image',
      message: error.message
    }, { status: 500 });
  }
}