import { NextResponse } from 'next/server';
import clientPromise from '../../../../../lib/mongo';
import { ObjectId } from 'mongodb';

export async function GET(request, context) {
  try {
    // Await params before accessing properties
    const params = await context.params;

    const client = await clientPromise;
    const db = client.db('campusmart');

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid listing ID' },
        { status: 400 }
      );
    }

    const listing = await db.collection('listings')
      .aggregate([
        {
          $match: {
            _id: new ObjectId(params.id),
            status: { $in: ['active', null] }
          }
        },
        {
          $lookup: {
            from: 'sellers',
            let: { sellerId: '$sellerId' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', { $toObjectId: '$$sellerId' }] }
                }
              }
            ],
            as: 'seller'
          }
        }
      ])
      .toArray();

    if (!listing || listing.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Listing not found' },
        { status: 404 }
      );
    }

    const listingData = listing[0];

    return NextResponse.json({
      success: true,
      ...listingData,
      seller: listingData.seller?.[0] || null
    });

  } catch (error) {
    console.error('Error fetching public listing:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch listing' },
      { status: 500 }
    );
  }
}