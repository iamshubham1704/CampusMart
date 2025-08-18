import { NextResponse } from 'next/server';
import clientPromise from '../../../../../lib/mongo';
import { getThumbnailUrl } from '../../../../../lib/imagekit';
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

    // Increment view count first
    await db.collection('listings').updateOne(
      { _id: new ObjectId(params.id) },
      { $inc: { views: 1 } }
    );

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
    const seller = listingData.seller?.[0];

    // Process images to ensure proper format
    let processedImages = [];
    
    if (listingData.images && listingData.images.length > 0) {
      processedImages = listingData.images.map((image, index) => {
        if (typeof image === 'string') {
          // Old format - base64 string
          return {
            url: image,
            thumbnailUrl: image,
            index
          };
        } else if (typeof image === 'object' && image.url) {
          // New format - ImageKit object
          return {
            url: image.url,
            thumbnailUrl: image.thumbnailUrl || getThumbnailUrl(image.url, 500),
            fileId: image.fileId,
            fileName: image.fileName,
            width: image.width,
            height: image.height,
            index
          };
        }
        return null;
      }).filter(img => img !== null);
    }

    // Format seller data
    const sellerInfo = seller ? {
      _id: seller._id.toString(),
      id: seller._id.toString(),
      name: seller.name || seller.businessName || 'Anonymous Seller',
      avatar: seller.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.name || 'User')}&size=100&background=3b82f6&color=ffffff`,
      rating: seller.rating || 4.5,
      verified: seller.verified || false,
      totalSales: seller.totalSales || 0,
      responseTime: seller.responseTime || '2 hours',
      university: seller.university || seller.college || 'Campus',
      joinedDate: seller.createdAt || seller.joinedDate
    } : null;

    // Format the response
    const responseData = {
      success: true,
      listing: {
        id: listingData._id.toString(),
        _id: listingData._id.toString(),
        title: listingData.title,
        description: listingData.description,
        price: listingData.price,
        originalPrice: listingData.originalPrice,
        commission: listingData.commission ?? 10,
        finalPrice: (listingData.price || 0) + ((listingData.price || 0) * ((listingData.commission ?? 10) / 100)),
        condition: listingData.condition,
        category: listingData.category,
        subcategory: listingData.subcategory,
        location: listingData.location,
        college: listingData.college,
        images: processedImages,
        tags: listingData.tags || [],
        status: listingData.status,
        views: (listingData.views || 0) + 1, // Include the incremented view
        createdAt: listingData.createdAt,
        updatedAt: listingData.updatedAt,
        seller: sellerInfo,
        sellerId: listingData.sellerId?.toString()
      }
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('❌ Error fetching public listing:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch listing' },
      { status: 500 }
    );
  }
}