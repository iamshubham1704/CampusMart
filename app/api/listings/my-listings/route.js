import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongo'; // your existing connection
import { verifyToken } from '../../../../lib/auth';
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
    const db = client.db('campusmart'); // replace with your database name
    
    // Fetch user's listings from listings collection
    const listings = await db.collection('listings')
      .find({ 
        sellerId: new ObjectId(userId) 
      })
      .sort({ createdAt: -1 })
      .toArray();

       const totalCount = await db.collection('listings')
      .countDocuments({ sellerId: new ObjectId(userId) });

    // Transform the data for frontend
    const transformedListings = listings.map(listing => ({
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
      image: listing.images?.[0] || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=200&fit=crop',
      images: listing.images || [],
      status: listing.status,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
      favoritesCount: listing.favorites?.length || 0
    }));

    return NextResponse.json({
      success: true,
      listings: transformedListings,
      total: totalCount
    });

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch listings' 
    }, { status: 500 });
  }
}