// app/api/admin/users/route.js
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

// GET - Fetch all buyers and sellers
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
    const userType = url.searchParams.get('type'); // 'buyer', 'seller', or null for all
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const skip = (page - 1) * limit;

    let users = [];
    let totalCount = 0;

    if (userType === 'buyer' || !userType) {
      const buyers = await db.collection('buyers')
        .find({})
        .skip(userType === 'buyer' ? skip : 0)
        .limit(userType === 'buyer' ? limit : 0)
        .project({ password: 0 }) // Exclude password
        .sort({ createdAt: -1 })
        .toArray();

      const buyersWithType = buyers.map(buyer => ({
        ...buyer,
        userType: 'buyer'
      }));

      users = users.concat(buyersWithType);

      if (userType === 'buyer') {
        totalCount = await db.collection('buyers').countDocuments({});
      }
    }

    if (userType === 'seller' || !userType) {
      const sellers = await db.collection('sellers')
        .find({})
        .skip(userType === 'seller' ? skip : 0)
        .limit(userType === 'seller' ? limit : 0)
        .project({ password: 0 }) // Exclude password
        .sort({ createdAt: -1 })
        .toArray();

      const sellersWithType = sellers.map(seller => ({
        ...seller,
        userType: 'seller'
      }));

      users = users.concat(sellersWithType);

      if (userType === 'seller') {
        totalCount = await db.collection('sellers').countDocuments({});
      }
    }

    // If fetching all users, get total count
    if (!userType) {
      const [buyerCount, sellerCount] = await Promise.all([
        db.collection('buyers').countDocuments({}),
        db.collection('sellers').countDocuments({})
      ]);
      totalCount = buyerCount + sellerCount;

      // Apply pagination for all users
      users = users.slice(skip, skip + limit);
    }

    return Response.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching users:', error);
    return Response.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// PUT - Update user status (ban/unban)
export async function PUT(request) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return Response.json({ 
        error: 'Unauthorized. Admin access required.' 
      }, { status: 401 });
    }

    const { userId, userType, isActive } = await request.json();

    if (!userId || !userType || typeof isActive !== 'boolean') {
      return Response.json({ 
        error: 'Missing required fields: userId, userType, isActive' 
      }, { status: 400 });
    }

    if (!['buyer', 'seller'].includes(userType)) {
      return Response.json({ 
        error: 'Invalid userType. Must be buyer or seller' 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');

    let objectId;
    try {
      objectId = new ObjectId(userId);
    } catch (error) {
      return Response.json({ 
        error: 'Invalid userId format' 
      }, { status: 400 });
    }

    const collection = userType === 'buyer' ? 'buyers' : 'sellers';
    
    // Update user status
    const result = await db.collection(collection).updateOne(
      { _id: objectId },
      { 
        $set: { 
          isActive: isActive,
          updatedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return Response.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Get updated user data
    const updatedUser = await db.collection(collection).findOne(
      { _id: objectId },
      { projection: { password: 0 } }
    );

    return Response.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'banned'} successfully`,
      data: {
        ...updatedUser,
        userType
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating user status:', error);
    return Response.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}