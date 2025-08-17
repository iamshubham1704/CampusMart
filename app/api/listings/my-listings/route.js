import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongo';
import { verifyToken } from '../../../../lib/auth';
import { getThumbnailUrl } from '../../../../lib/imagekit';
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
    // Verify user token
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const userId = decoded.sellerId || decoded.userId || decoded.id || decoded.sub;
    
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('campusmart');
    
    // Fetch user's listings from listings collection
    const listings = await db.collection('listings')
      .find({ 
        sellerId: new ObjectId(userId) 
      })
      .sort({ createdAt: -1 })
      .toArray();

    const totalCount = await db.collection('listings')
      .countDocuments({ sellerId: new ObjectId(userId) });

    // Transform the data for frontend with ImageKit optimization
    const transformedListings = listings.map(listing => {
      // Handle both old base64 format and new ImageKit format
      let imageUrl = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=200&fit=crop';
      let thumbnailUrl = imageUrl;

      if (listing.images && listing.images.length > 0) {
        const firstImage = listing.images[0];
        
        if (typeof firstImage === 'string') {
          // Old format - base64 string
          imageUrl = firstImage;
          thumbnailUrl = firstImage;
        } else if (typeof firstImage === 'object' && firstImage.url) {
          // New format - ImageKit object
          imageUrl = firstImage.url;
          thumbnailUrl = firstImage.thumbnailUrl || getThumbnailUrl(firstImage.url, 300);
        }
      }

      return {
        id: listing._id.toString(),
        title: listing.title,
        description: listing.description,
        price: listing.price,
        originalPrice: listing.originalPrice,
        condition: listing.condition,
        category: listing.category,
        subcategory: listing.subcategory,
        location: listing.location,
        views: listing.views || 0,
        image: thumbnailUrl, // Use thumbnail for listings grid
        images: listing.images || [], // Full image data for editing
        status: listing.status,
        createdAt: listing.createdAt,
        updatedAt: listing.updatedAt,
        favoritesCount: listing.favorites?.length || 0
      };
    });

    return NextResponse.json({
      success: true,
      listings: transformedListings,
      total: totalCount
    });

  } catch (error) {
    console.error('❌ Fetch my listings error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch listings' 
    }, { status: 500 });
  }
}