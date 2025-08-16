import { NextResponse } from 'next/server';
import { NotificationService } from '../../../utils/notificationService';
import clientPromise from '../../../../lib/mongo';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    const body = await request.json();
    const { sellerId, reviewerId, rating, reviewText, reviewerName, listingId, transactionId } = body;

    // Validate required fields
    if (!sellerId || !reviewerId || !rating || !reviewText || !reviewerName) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: sellerId, reviewerId, rating, reviewText, reviewerName'
      }, { status: 400 });
    }

    // Validate ObjectId formats
    if (!ObjectId.isValid(sellerId) || !ObjectId.isValid(reviewerId)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid ID format for sellerId or reviewerId'
      }, { status: 400 });
    }

    // Validate optional ObjectIds
    if (listingId && !ObjectId.isValid(listingId)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid listingId format'
      }, { status: 400 });
    }

    if (transactionId && !ObjectId.isValid(transactionId)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid transactionId format'
      }, { status: 400 });
    }

    // Validate rating
    const numericRating = parseInt(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return NextResponse.json({
        success: false,
        message: 'Rating must be between 1 and 5'
      }, { status: 400 });
    }

    // Validate review text length
    if (reviewText.trim().length < 10) {
      return NextResponse.json({
        success: false,
        message: 'Review text must be at least 10 characters long'
      }, { status: 400 });
    }

    if (reviewText.trim().length > 1000) {
      return NextResponse.json({
        success: false,
        message: 'Review text cannot exceed 1000 characters'
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');
    const reviews = db.collection('reviews');

    // Check if seller exists
    const sellers = db.collection('sellers');
    const seller = await sellers.findOne({ _id: new ObjectId(sellerId) });
    if (!seller) {
      return NextResponse.json({
        success: false,
        message: 'Seller not found'
      }, { status: 404 });
    }

    // Check if reviewer exists
    const buyers = db.collection('buyers');
    const reviewer = await buyers.findOne({ _id: new ObjectId(reviewerId) });
    if (!reviewer) {
      return NextResponse.json({
        success: false,
        message: 'Reviewer not found'
      }, { status: 404 });
    }

    // Check if user already reviewed this seller
    const existingReview = await reviews.findOne({
      sellerId: new ObjectId(sellerId),
      reviewerId: new ObjectId(reviewerId)
    });

    if (existingReview) {
      return NextResponse.json({
        success: false,
        message: 'You have already reviewed this seller'
      }, { status: 400 });
    }

    // Prevent self-review
    if (sellerId === reviewerId) {
      return NextResponse.json({
        success: false,
        message: 'Cannot review yourself'
      }, { status: 400 });
    }

    // Create review document
    const review = {
      sellerId: new ObjectId(sellerId),
      reviewerId: new ObjectId(reviewerId),
      rating: numericRating,
      reviewText: reviewText.trim(),
      reviewerName: reviewerName.trim(),
      listingId: listingId ? new ObjectId(listingId) : null,
      transactionId: transactionId ? new ObjectId(transactionId) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
      helpful: 0, // For future "helpful" feature
      reported: false // For moderation
    };

    const result = await reviews.insertOne(review);

    // Update seller's average rating
    const allReviews = await reviews.find({ sellerId: new ObjectId(sellerId) }).toArray();
    const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / allReviews.length;
    const reviewCount = allReviews.length;

    // Update seller document with new rating stats
    await sellers.updateOne(
      { _id: new ObjectId(sellerId) },
      {
        $set: {
          rating: parseFloat(averageRating.toFixed(2)),
          reviewCount: reviewCount,
          updatedAt: new Date()
        }
      }
    );

    // Create notification for seller
    await NotificationService.createReviewNotification(
      sellerId,
      {
        id: reviewerId,
        name: reviewerName.trim(),
        reviewText: reviewText.trim()
      },
      numericRating
    );

    return NextResponse.json({
      success: true,
      message: 'Review created successfully',
      data: {
        reviewId: result.insertedId.toString(),
        rating: numericRating,
        reviewText: reviewText.trim(),
        reviewerName: reviewerName.trim(),
        createdAt: review.createdAt,
        sellerStats: {
          averageRating: parseFloat(averageRating.toFixed(2)),
          totalReviews: reviewCount
        }
      }
    });

  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}