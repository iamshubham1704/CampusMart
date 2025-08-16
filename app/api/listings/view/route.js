import { NextResponse } from 'next/server';
import { NotificationService } from '../../../../utils/notificationService';
import clientPromise from '../../../../lib/mongo';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    const body = await request.json();
    const { listingId, userId } = body;

    const client = await clientPromise;
    const db = client.db('campusmarket');
    
    // Record view
    const views = db.collection('views');
    const listings = db.collection('listings');
    
    // Add view record
    await views.insertOne({
      listingId,
      userId: userId || null, // Allow anonymous views
      viewedAt: new Date(),
      date: new Date().toISOString().split('T')[0] // For daily grouping
    });

    // Get today's view count
    const today = new Date().toISOString().split('T')[0];
    const todayViews = await views.countDocuments({
      listingId,
      date: today
    });

    // Get listing details
    const listing = await listings.findOne({ _id: new ObjectId(listingId) });

    // Create notification for significant milestones
    if (listing && [10, 25, 50, 100].includes(todayViews)) {
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
      views: todayViews
    });

  } catch (error) {
    console.error('Error recording view:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}