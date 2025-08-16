import { NextResponse } from 'next/server';
import { NotificationService } from '../../../../utils/notificationService';
import clientPromise from '../../../../lib/mongo';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    const body = await request.json();
    const { listingId, userId } = body;

    // Validate required fields
    if (!listingId || !userId) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: listingId and userId'
      }, { status: 400 });
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(listingId) || !ObjectId.isValid(userId)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid ID format'
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');
    
    // Add like to listing
    const listings = db.collection('listings');
    const likes = db.collection('likes');
    
    // Check if already liked
    const existingLike = await likes.findOne({ 
      listingId: new ObjectId(listingId), 
      userId: new ObjectId(userId) 
    });
    
    if (existingLike) {
      return NextResponse.json({
        success: false,
        message: 'Already liked'
      }, { status: 400 });
    }

    // Add like
    await likes.insertOne({
      listingId: new ObjectId(listingId),
      userId: new ObjectId(userId),
      createdAt: new Date()
    });

    // Get listing and total likes
    const listing = await listings.findOne({ _id: new ObjectId(listingId) });
    const totalLikes = await likes.countDocuments({ listingId: new ObjectId(listingId) });

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
      totalLikes,
      message: 'Like added successfully'
    });

  } catch (error) {
    console.error('Error adding like:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json();
    const { listingId, userId } = body;

    // Validate required fields
    if (!listingId || !userId) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: listingId and userId'
      }, { status: 400 });
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(listingId) || !ObjectId.isValid(userId)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid ID format'
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');
    const likes = db.collection('likes');
    
    // Remove like
    const result = await likes.deleteOne({
      listingId: new ObjectId(listingId),
      userId: new ObjectId(userId)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({
        success: false,
        message: 'Like not found'
      }, { status: 404 });
    }

    // Get updated total likes
    const totalLikes = await likes.countDocuments({ listingId: new ObjectId(listingId) });

    return NextResponse.json({
      success: true,
      totalLikes,
      message: 'Like removed successfully'
    });

  } catch (error) {
    console.error('Error removing like:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}