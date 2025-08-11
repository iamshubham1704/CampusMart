import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import clientPromise from '@/lib/mongo'; // Your existing mongo.js file

export async function GET(request) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }

    const sellerId = decoded.sellerId || decoded.userId || decoded.id;

    // Connect using your existing clientPromise
    const client = await clientPromise;
    const db = client.db(); // Uses default database from connection string

    // Get collections directly
    const listingsCollection = db.collection('listings');
    const chatsCollection = db.collection('chats');
    const reviewsCollection = db.collection('reviews');
    const savedItemsCollection = db.collection('savedItems');

    // Get current date for time-based calculations
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch all statistics in parallel
    const [
      totalListings,
      activeListings,
      totalViews,
      totalEarnings,
      savedItemsCount,
      activeChatsCount,
      reviewsData,
      newListingsThisWeek,
      newChatsToday
    ] = await Promise.all([
      // Total listings count
      listingsCollection.countDocuments({ sellerId }),
      
      // Active listings count
      listingsCollection.countDocuments({ sellerId, status: 'active' }),
      
      // Total views across all listings
      listingsCollection.aggregate([
        { $match: { sellerId } },
        { $group: { _id: null, totalViews: { $sum: '$views' } } }
      ]).toArray(),
      
      // Total earnings (sum of sold items)
      listingsCollection.aggregate([
        { $match: { sellerId, status: 'sold' } },
        { $group: { _id: null, totalEarnings: { $sum: '$price' } } }
      ]).toArray(),
      
      // Saved items count (items saved by other users)
      savedItemsCollection.aggregate([
        {
          $lookup: {
            from: 'listings',
            localField: 'listingId',
            foreignField: '_id',
            as: 'listing'
          }
        },
        {
          $match: {
            'listing.sellerId': sellerId
          }
        },
        {
          $count: 'total'
        }
      ]).toArray(),
      
      // Active chats count
      chatsCollection.countDocuments({
        $or: [
          { sellerId },
          { buyerId: sellerId }
        ],
        status: 'active'
      }),
      
      // Reviews data
      reviewsCollection.aggregate([
        { $match: { sellerId } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            averageRating: { $avg: '$rating' }
          }
        }
      ]).toArray(),
      
      // New listings this week
      listingsCollection.countDocuments({
        sellerId,
        createdAt: { $gte: weekAgo }
      }),
      
      // New chats today
      chatsCollection.countDocuments({
        $or: [
          { sellerId },
          { buyerId: sellerId }
        ],
        createdAt: { $gte: new Date(now.setHours(0, 0, 0, 0)) }
      })
    ]);

    // Process aggregation results
    const totalViewsCount = totalViews[0]?.totalViews || 0;
    const totalEarningsAmount = totalEarnings[0]?.totalEarnings || 0;
    const savedCount = savedItemsCount[0]?.total || 0;
    const reviewsCount = reviewsData[0]?.count || 0;
    const averageRating = reviewsData[0]?.averageRating || 0;

    // Calculate response rate (mock calculation)
    const responseRate = activeChatsCount > 0 ? Math.round((activeChatsCount * 0.95) * 100) / 100 : 95;

    const stats = {
      // Main dashboard stats
      savedItems: savedCount,
      activeChats: activeChatsCount,
      activeListings: activeListings,
      reviewsGiven: reviewsCount,
      
      // Additional stats
      totalListings,
      totalViews: totalViewsCount,
      totalEarnings: totalEarningsAmount,
      rating: Math.round(averageRating * 10) / 10,
      responseRate,
      
      // Time-based changes
      changes: {
        savedItemsWeekly: `+${Math.floor(Math.random() * 5) + 1} this week`,
        activeChatsDaily: `+${newChatsToday} new today`,
        activeListingsMonthly: "This month",
        reviewsRating: `${Math.round(averageRating * 10) / 10} avg rating`
      },
      
      // Profile data
      memberSince: new Date().getFullYear(),
      accountType: 'Premium',
      unreadNotifications: Math.floor(Math.random() * 5) + 1
    };

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error fetching seller stats:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}