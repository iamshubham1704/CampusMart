// app/api/admin/stats/route.js
import { verifyToken } from '@/lib/auth';
import clientPromise from '@/lib/mongo';

// Verify admin token
function verifyAdminToken(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    // Check if user has admin role
    if (!decoded || decoded.role !== 'admin') {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('Admin token verification failed:', error);
    return null;
  }
}

export async function GET(request) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return Response.json({ 
        error: 'Unauthorized. Admin access required.' 
      }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');

    // Get current date for time-based calculations
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch all statistics in parallel
    const [
      totalBuyers,
      totalSellers,
      activeBuyers,
      activeSellers,
      newBuyersThisWeek,
      newSellersThisWeek,
      newBuyersThisMonth,
      newSellersThisMonth,
      totalListings,
      activeListings
    ] = await Promise.all([
      // Total counts
      db.collection('buyers').countDocuments({}),
      db.collection('sellers').countDocuments({}),
      
      // Active users
      db.collection('buyers').countDocuments({ isActive: true }),
      db.collection('sellers').countDocuments({ isActive: true }),
      
      // New users this week
      db.collection('buyers').countDocuments({ 
        createdAt: { $gte: weekAgo } 
      }),
      db.collection('sellers').countDocuments({ 
        createdAt: { $gte: weekAgo } 
      }),
      
      // New users this month
      db.collection('buyers').countDocuments({ 
        createdAt: { $gte: monthAgo } 
      }),
      db.collection('sellers').countDocuments({ 
        createdAt: { $gte: monthAgo } 
      }),
      
      // Listings stats
      db.collection('listings').countDocuments({}),
      db.collection('listings').countDocuments({ status: 'active' })
    ]);

    const stats = {
      users: {
        totalUsers: totalBuyers + totalSellers,
        totalBuyers,
        totalSellers,
        activeBuyers,
        activeSellers,
        inactiveBuyers: totalBuyers - activeBuyers,
        inactiveSellers: totalSellers - activeSellers,
        newUsersThisWeek: newBuyersThisWeek + newSellersThisWeek,
        newUsersThisMonth: newBuyersThisMonth + newSellersThisMonth,
        newBuyersThisWeek,
        newSellersThisWeek,
        newBuyersThisMonth,
        newSellersThisMonth
      },
      listings: {
        totalListings,
        activeListings,
        inactiveListings: totalListings - activeListings
      },
      overview: {
        totalUsers: totalBuyers + totalSellers,
        activeUsers: activeBuyers + activeSellers,
        inactiveUsers: (totalBuyers - activeBuyers) + (totalSellers - activeSellers),
        userGrowthWeekly: ((newBuyersThisWeek + newSellersThisWeek) / (totalBuyers + totalSellers) * 100).toFixed(1),
        userGrowthMonthly: ((newBuyersThisMonth + newSellersThisMonth) / (totalBuyers + totalSellers) * 100).toFixed(1)
      }
    };

    return Response.json({
      success: true,
      data: stats
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return Response.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}