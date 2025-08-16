// app/api/admin/listings/route.js
import { verifyToken } from '@/lib/auth';
import clientPromise from '@/lib/mongo';
import { ObjectId } from 'mongodb';

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

// GET - Fetch all listings with seller details
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

    // Get query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const skip = (page - 1) * limit;
    const status = url.searchParams.get('status'); // 'active', 'inactive', 'sold', or null for all
    const category = url.searchParams.get('category');

    let matchStage = {};
    if (status) {
      matchStage.status = status;
    }
    if (category) {
      matchStage.category = new RegExp(category, 'i');
    }

    // Fetch listings with seller details
    const listings = await db.collection('listings')
      .aggregate([
        { $match: matchStage },
        {
          $lookup: {
            from: 'sellers',
            localField: 'sellerId',
            foreignField: '_id',
            as: 'seller'
          }
        },
        {
          $project: {
            _id: 1,
            title: 1,
            description: 1,
            price: 1,
            originalPrice: 1,
            condition: 1,
            category: 1,
            subcategory: 1,
            location: 1,
            college: 1,
            images: 1,
            tags: 1,
            status: 1,
            views: 1,
            favorites: 1,
            createdAt: 1,
            updatedAt: 1,
            seller_name: { $arrayElemAt: ['$seller.name', 0] },
            seller_email: { $arrayElemAt: ['$seller.email', 0] },
            seller_phone: { $arrayElemAt: ['$seller.phone', 0] }
          }
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit }
      ])
      .toArray();

    // Get total count
    const totalListings = await db.collection('listings').countDocuments(matchStage);

    // Get status counts
    const statusStats = await db.collection('listings').aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    return Response.json({
      success: true,
      data: {
        listings,
        pagination: {
          page,
          limit,
          total: totalListings,
          totalPages: Math.ceil(totalListings / limit)
        },
        statusStats
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching listings:', error);
    return Response.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// PUT - Update listing status
export async function PUT(request) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return Response.json({ 
        error: 'Unauthorized. Admin access required.' 
      }, { status: 401 });
    }

    const { listingId, status } = await request.json();

    if (!listingId || !status) {
      return Response.json({ 
        error: 'Missing required fields: listingId, status' 
      }, { status: 400 });
    }

    // Validate status
    const validStatuses = ['active', 'inactive', 'sold', 'pending', 'rejected'];
    if (!validStatuses.includes(status)) {
      return Response.json({ 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');

    let objectId;
    try {
      objectId = new ObjectId(listingId);
    } catch (error) {
      return Response.json({ 
        error: 'Invalid listingId format' 
      }, { status: 400 });
    }

    // Update listing status
    const result = await db.collection('listings').updateOne(
      { _id: objectId },
      { 
        $set: { 
          status: status,
          updatedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return Response.json({ 
        error: 'Listing not found' 
      }, { status: 404 });
    }

    return Response.json({
      success: true,
      message: `Listing status updated to ${status} successfully`
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating listing status:', error);
    return Response.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}