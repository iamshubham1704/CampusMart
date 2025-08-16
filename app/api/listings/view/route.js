import { NextResponse } from 'next/server';
import { NotificationService } from '../../../utils/notificationService';
import clientPromise from '../../../../lib/mongo';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    const body = await request.json();
    const { listingId, userId } = body;

    // Validate required fields
    if (!listingId) {
      return NextResponse.json({
        success: false,
        message: 'Missing required field: listingId'
      }, { status: 400 });
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(listingId)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid listingId format'
      }, { status: 400 });
    }

    // Validate userId if provided
    if (userId && !ObjectId.isValid(userId)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid userId format'
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');
    
    // Record view
    const views = db.collection('views');
    const listings = db.collection('listings');
    
    // Check if this user has already viewed this listing today (to prevent spam)
    const today = new Date().toISOString().split('T')[0];
    let shouldRecordView = true;
    
    if (userId) {
      const existingView = await views.findOne({
        listingId: new ObjectId(listingId),
        userId: new ObjectId(userId),
        date: today
      });
      
      if (existingView) {
        shouldRecordView = false;
      }
    }
    
    // Add view record if it should be recorded
    if (shouldRecordView) {
      await views.insertOne({
        listingId: new ObjectId(listingId),
        userId: userId ? new ObjectId(userId) : null, // Allow anonymous views
        viewedAt: new Date(),
        date: today, // For daily grouping
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      });
    }

    // Get today's view count
    const todayViews = await views.countDocuments({
      listingId: new ObjectId(listingId),
      date: today
    });

    // Get total view count
    const totalViews = await views.countDocuments({
      listingId: new ObjectId(listingId)
    });

    // Get listing details
    const listing = await listings.findOne({ _id: new ObjectId(listingId) });

    if (!listing) {
      return NextResponse.json({
        success: false,
        message: 'Listing not found'
      }, { status: 404 });
    }

    // Update listing view count in the listing document
    await listings.updateOne(
      { _id: new ObjectId(listingId) },
      { $set: { views: totalViews, updatedAt: new Date() } }
    );

    // Create notification for significant milestones
    if (shouldRecordView && [10, 25, 50, 100, 250, 500, 1000].includes(todayViews)) {
      await NotificationService.createViewNotification(
        listing.sellerId,
        {
          id: listingId,
          title: listing.title
        },
        todayViews
      );
    }

    return NextResponse.json({
      success: true,
      views: todayViews,
      totalViews: totalViews,
      viewRecorded: shouldRecordView
    });

  } catch (error) {
    console.error('Error recording view:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}