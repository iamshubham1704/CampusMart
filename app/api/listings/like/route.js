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
    
    // Add like to listing
    const listings = db.collection('listings');
    const likes = db.collection('likes');
    
    // Check if already liked
    const existingLike = await likes.findOne({ listingId, userId });
    if (existingLike) {
      return NextResponse.json({
        success: false,
        message: 'Already liked'
      }, { status: 400 });
    }

    // Add like
    await likes.insertOne({
      listingId,
      userId,
      createdAt: new Date()
    });

    // Get listing and total likes
    const listing = await listings.findOne({ _id: new ObjectId(listingId) });
    const totalLikes = await likes.countDocuments({ listingId });

    // Create notification for seller (but not too frequently)
    if (listing && totalLikes % 5 === 0) { // Every 5th like
      await NotificationService.createLikeNotification(
        listing.sellerId,
        {
          id: listingId,
          title: listing.title
        },
        totalLikes
      );
    }

    return NextResponse.json({
      success: true,
      totalLikes
    });

  } catch (error) {
    console.error('Error adding like:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
