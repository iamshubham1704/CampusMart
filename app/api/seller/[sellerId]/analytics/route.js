import clientPromise from '@/lib/mongo';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

export async function GET(req, { params }) {
  try {
    const { sellerId } = params;
    
    // Verify JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (err) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (decoded.sellerId !== sellerId && decoded.userId !== sellerId && decoded.id !== sellerId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }), 
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const client = await clientPromise;
    const db = client.db('campusmart');
    const listings = db.collection('listings');
    const messages = db.collection('messages'); // Assuming you have a messages collection

    // Get all listings for this seller
    const allListings = await listings.find({ 
      sellerId: new ObjectId(sellerId) 
    }).toArray();

    const activeListings = allListings.filter(listing => listing.status === 'active').length;
    const totalViews = allListings.reduce((sum, listing) => sum + (listing.views || 0), 0);
    const totalLikes = allListings.reduce((sum, listing) => sum + (listing.likes || 0), 0);

    // Get messages received (you'll need to implement this based on your message system)
    const messagesReceived = await messages.countDocuments({ 
      sellerId: new ObjectId(sellerId),
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    });

    const analyticsData = {
      activeListings,
      totalViews,
      totalLikes,
      messagesReceived,
      averageViews: allListings.length > 0 ? Math.round(totalViews / allListings.length) : 0,
      mostViewedListing: allListings.reduce((max, listing) => 
        (listing.views || 0) > (max.views || 0) ? listing : max, {}
      ),
      categoryBreakdown: allListings.reduce((acc, listing) => {
        acc[listing.category] = (acc[listing.category] || 0) + 1;
        return acc;
      }, {}),
      performanceMetrics: {
        listingToSaleRatio: allListings.length > 0 ? 
          Math.round((allListings.filter(l => l.status === 'sold').length / allListings.length) * 100) : 0,
        averageDaysToSell: calculateAverageDaysToSell(allListings.filter(l => l.status === 'sold'))
      }
    };

    return new Response(
      JSON.stringify(analyticsData), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

function calculateAverageDaysToSell(soldListings) {
  if (soldListings.length === 0) return 0;
  
  const totalDays = soldListings.reduce((sum, listing) => {
    const createdAt = new Date(listing.createdAt);
    const soldAt = new Date(listing.soldAt || listing.updatedAt);
    const daysDiff = Math.ceil((soldAt - createdAt) / (1000 * 60 * 60 * 24));
    return sum + daysDiff;
  }, 0);
  
  return Math.round(totalDays / soldListings.length);
}