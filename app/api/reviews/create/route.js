import { NextResponse } from 'next/server';
import { NotificationService } from '../../../../utils/notificationService';
import clientPromise from '../../../../lib/mongo';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    const body = await request.json();
    const { sellerId, reviewerId, rating, reviewText, reviewerName } = body;

    const client = await clientPromise;
    const db = client.db('campusmarket');
    const reviews = db.collection('reviews');

    // Create review
    const review = {
      sellerId,
      reviewerId,
      rating,
      reviewText,
      reviewerName,
      createdAt: new Date()
    };

    await reviews.insertOne(review);

    // Create notification for seller
    await NotificationService.createReviewNotification(
      sellerId,
      {
        id: reviewerId,
        name: reviewerName,
        reviewText
      },
      rating
    );

    return NextResponse.json({
      success: true,
      message: 'Review created successfully'
    });

  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
