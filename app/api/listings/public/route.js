import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongo';
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
    const client = await clientPromise;
    
    if (!client) {
      throw new Error('MongoDB client is undefined');
    }
    
    const db = client.db('campusmart'); // Use your database name
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const condition = searchParams.get('condition');
    const location = searchParams.get('location');
    

    let filter = { status: { $in: ['active', null] } }; // Include null for backward compatibility
    
    // Add category filter
    if (category && category !== 'all') {
      filter.category = new RegExp(category, 'i');
    }
    
    // Add search filter
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }
    
    // Add price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    
    // Add condition filter
    if (condition) {
      filter.condition = condition;
    }
    
    // Add location filter
    if (location) {
      filter.location = new RegExp(location, 'i');
    }
  
    const listings = await db.collection('listings')
      .aggregate([
        { $match: filter },
        {
          $lookup: {
            from: 'sellers', // Join with sellers collection
            let: { sellerId: '$sellerId' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$_id', { $toObjectId: '$$sellerId' }]
                  }
                }
              }
            ],
            as: 'sellerInfo'
          }
        },
        { $sort: { createdAt: -1 } },
        { $limit: 100 }
      ])
      .toArray();
    
    const transformedListings = listings.map(listing => {
      const seller = listing.sellerInfo && listing.sellerInfo[0];
      
      return {
        id: listing._id.toString(),
        title: listing.title || 'Untitled',
        price: parseFloat(listing.price * 1.1) || 0,
        originalPrice: listing.originalPrice
          ? parseFloat(listing.originalPrice)
          : parseFloat(listing.price) * 1.3,
        image: listing.images && listing.images[0]
          ? listing.images[0]
          : 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=300&fit=crop',
        seller: seller?.name || seller?.businessName || 'Anonymous Seller',
        rating: seller?.rating || 4.5,
        location: listing.location || 'Campus',
        timePosted: formatTimeAgo(listing.createdAt),
        category: mapCategory(listing.category),
        condition: listing.condition || 'Good',
        description: listing.description || 'No description available',
        views: listing.views || 0,
        status: listing.status || 'active',
        sellerId: listing.sellerId
      };
    });

    return NextResponse.json({
      success: true,
      listings: transformedListings,
      count: transformedListings.length
    });
    
  } catch (error) {

    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch listings',
        error: error.message 
      },
      { status: 500 }
    );
  }
}

// Helper function to format "time ago"
function formatTimeAgo(dateString) {
  if (!dateString) return 'Recently';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
}

// Helper function to map backend categories to frontend categories
function mapCategory(backendCategory) {
  if (!backendCategory) return 'all';
  
  const categoryMap = {
    'Books': 'textbooks',
    'Textbooks': 'textbooks',
    'Electronics': 'electronics',
    'Clothing': 'clothing',
    'Furniture': 'furniture',
    'Food': 'food',
    'Food & Drinks': 'food',
    'Gaming': 'gaming',
    'Other': 'all'
  };
  
  return categoryMap[backendCategory] || 'all';
}