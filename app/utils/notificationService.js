import { NextResponse } from 'next/server';
import clientPromise from '../../lib/mongo';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    const body = await request.json();
    const { listingId, userId } = body;

    const client = await clientPromise;
    const db = client.db('campusmart'); // Changed from 'campusmarket' to match other files
    
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

    // Note: Notification functionality removed - implement NotificationService if needed
    console.log(`Listing ${listingId} received ${totalLikes} likes`);

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