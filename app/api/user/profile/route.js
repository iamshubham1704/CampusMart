import { verifyToken } from '../../../../lib/auth';
import clientPromise from '@/lib/mongo';
import { ObjectId } from 'mongodb';

// Helper function to get user ID from decoded token
const getUserId = (decoded) => {
  const possibleIds = ['userId', 'sellerId', 'id', 'user_id', 'sub'];
  for (const field of possibleIds) {
    if (decoded[field]) {
      console.log(`Found user ID in field: ${field}, value: ${decoded[field]}`);
      return decoded[field];
    }
  }
  console.log('No user ID found in token fields:', Object.keys(decoded));
  return null;
};

// Helper function to convert string to ObjectId if valid
const toObjectId = (id) => {
  if (typeof id === 'string' && ObjectId.isValid(id)) {
    return new ObjectId(id);
  }
  return id;
};

// GET - Fetch user profile
export async function GET(request) {
  console.log('=== USER PROFILE API GET REQUEST ===');
  
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    console.log('Auth header present:', !!authHeader);
    console.log('Auth header preview:', authHeader?.substring(0, 20) + '...');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Invalid authorization header format');
      return Response.json({ 
        success: false,
        message: 'Invalid authorization header format' 
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    if (!token) {
      console.log('No token found after Bearer');
      return Response.json({ 
        success: false,
        message: 'No token provided' 
      }, { status: 401 });
    }

    console.log('Token extracted, length:', token.length);

    // Verify the token
    const decoded = verifyToken(token);
    if (!decoded) {
      console.log('Token verification failed');
      return Response.json({ 
        success: false,
        message: 'Invalid or expired token' 
      }, { status: 401 });
    }

    console.log('Token verification successful. Decoded token:', JSON.stringify(decoded, null, 2));

    // Connect to database
    const client = await clientPromise;
    const db = client.db('campusmart');
    console.log('Database connection established');

    // Get user ID from token
    const userId = getUserId(decoded);
    if (!userId) {
      console.error('No valid user ID found in token');
      return Response.json({ 
        success: false,
        message: 'Invalid token: no user ID found' 
      }, { status: 401 });
    }

    const objectId = toObjectId(userId);
    console.log('Looking for user with ID:', userId, 'as ObjectId:', objectId);

    // Try multiple collections to find the user
    let user = null;
    const collections = ['sellers', 'users']; // Add other collection names if needed

    for (const collectionName of collections) {
      console.log(`Checking collection: ${collectionName}`);
      user = await db.collection(collectionName).findOne(
        { _id: objectId },
        {
          projection: {
            password: 0,
            __v: 0
          }
        }
      );
      
      if (user) {
        console.log(`User found in collection: ${collectionName}`);
        break;
      }
    }

    // If not found by ObjectId, try finding by string ID or email
    if (!user) {
      console.log('User not found by ObjectId, trying alternative searches...');
      
      for (const collectionName of collections) {
        // Try by string ID
        user = await db.collection(collectionName).findOne(
          { _id: userId },
          { projection: { password: 0, __v: 0 } }
        );
        
        if (user) {
          console.log(`User found by string ID in collection: ${collectionName}`);
          break;
        }
        
        // Try by email if userId looks like an email
        if (typeof userId === 'string' && userId.includes('@')) {
          user = await db.collection(collectionName).findOne(
            { email: userId },
            { projection: { password: 0, __v: 0 } }
          );
          
          if (user) {
            console.log(`User found by email in collection: ${collectionName}`);
            break;
          }
        }
      }
    }

    if (!user) {
      console.log('User not found in any collection');
      return Response.json({ 
        success: false,
        message: 'User not found' 
      }, { status: 404 });
    }

    console.log('User found:', user.name || user.email);

    // Initialize seller statistics
    let sellerStats = {
      totalSales: 0,
      totalEarnings: 0,
      rating: 0,
      responseRate: 0,
      accountType: 'Standard',
      memberSince: user.createdAt ? new Date(user.createdAt).getFullYear() : new Date().getFullYear()
    };

    // Fetch seller statistics if user is a seller
    if (user.isSeller || user.accountType === 'seller') {
      console.log('Fetching seller statistics...');

      try {
        // Fetch sales data
        const sales = await db.collection('orders').aggregate([
          {
            $match: {
              sellerId: user._id,
              status: 'completed'
            }
          },
          {
            $group: {
              _id: null,
              totalSales: { $sum: 1 },
              totalEarnings: { $sum: '$amount' }
            }
          }
        ]).toArray();

        // Fetch ratings
        const ratings = await db.collection('reviews').aggregate([
          {
            $match: { sellerId: user._id }
          },
          {
            $group: {
              _id: null,
              averageRating: { $avg: '$rating' },
              totalReviews: { $sum: 1 }
            }
          }
        ]).toArray();

        // Calculate response rate (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const messages = await db.collection('messages').aggregate([
          {
            $match: {
              receiverId: user._id,
              createdAt: { $gte: thirtyDaysAgo }
            }
          },
          {
            $group: {
              _id: null,
              totalMessages: { $sum: 1 },
              respondedMessages: {
                $sum: {
                  $cond: [{ $ne: ['$responseTime', null] }, 1, 0]
                }
              }
            }
          }
        ]).toArray();

        // Update seller stats
        if (sales.length > 0) {
          sellerStats.totalSales = sales[0].totalSales || 0;
          sellerStats.totalEarnings = sales[0].totalEarnings || 0;
        }

        if (ratings.length > 0) {
          sellerStats.rating = Math.round((ratings[0].averageRating || 0) * 10) / 10;
        }

        if (messages.length > 0 && messages[0].totalMessages > 0) {
          sellerStats.responseRate = Math.round(
            (messages[0].respondedMessages / messages[0].totalMessages) * 100
          );
        }

        sellerStats.accountType = user.accountType || 'Seller';
        console.log('Seller stats calculated:', sellerStats);

      } catch (statsError) {
        console.error('Error calculating seller stats:', statsError);
        // Continue with default stats if calculation fails
      }
    }

    // Format the response
    const profileData = {
      _id: user._id,
      name: user.name || user.fullName || '',
      email: user.email || '',
      phone: user.phone || '',
      location: user.location || '',
      bio: user.bio || '',
      college: user.college || '',
      year: user.year || '',
      profileImage: user.profileImage || '',
      isSeller: user.isSeller || false,
      accountType: user.accountType || 'user',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      ...sellerStats
    };

    console.log('Profile data prepared successfully');

    return Response.json({
      success: true,
      data: profileData
    }, { status: 200 });

  } catch (error) {
    console.error('=== USER PROFILE API ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return Response.json({
      success: false,
      message: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { 
        error: error.message,
        stack: error.stack 
      })
    }, { status: 500 });
  }
}

// PUT - Update user profile
export async function PUT(request) {
  console.log('=== USER PROFILE API PUT REQUEST ===');

  try {
    // Extract and verify token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({ 
        success: false,
        message: 'Invalid authorization header' 
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return Response.json({ 
        success: false,
        message: 'Invalid or expired token' 
      }, { status: 401 });
    }

    console.log('Token verified for update request:', decoded.userId || decoded.id);

    // Get update data
    const updateData = await request.json();
    console.log('Update data received:', Object.keys(updateData));

    // Define allowed fields for security
    const allowedFields = [
      'name', 'phone', 'location', 'bio',
      'college', 'year', 'profileImage'
    ];

    const filteredData = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });

    // Add update timestamp
    filteredData.updatedAt = new Date();

    console.log('Filtered update data:', Object.keys(filteredData));

    // Connect to database
    const client = await clientPromise;
    const db = client.db('campusmart');

    // Get user ID
    const userId = getUserId(decoded);
    if (!userId) {
      return Response.json({ 
        success: false,
        message: 'Invalid token: no user ID found' 
      }, { status: 401 });
    }

    const objectId = toObjectId(userId);

    // Try to update in multiple collections
    let updateResult = null;
    const collections = ['sellers', 'users'];

    for (const collectionName of collections) {
      const result = await db.collection(collectionName).updateOne(
        { _id: objectId },
        { $set: filteredData }
      );

      if (result.matchedCount > 0) {
        updateResult = result;
        console.log(`Profile updated in collection: ${collectionName}, modified: ${result.modifiedCount}`);
        break;
      }
    }

    // If not found by ObjectId, try string ID
    if (!updateResult || updateResult.matchedCount === 0) {
      for (const collectionName of collections) {
        const result = await db.collection(collectionName).updateOne(
          { _id: userId },
          { $set: filteredData }
        );

        if (result.matchedCount > 0) {
          updateResult = result;
          console.log(`Profile updated by string ID in collection: ${collectionName}`);
          break;
        }
      }
    }

    if (!updateResult || updateResult.matchedCount === 0) {
      return Response.json({ 
        success: false,
        message: 'User not found' 
      }, { status: 404 });
    }

    // Fetch updated user data
    let updatedUser = null;
    for (const collectionName of collections) {
      updatedUser = await db.collection(collectionName).findOne(
        { _id: objectId },
        { projection: { password: 0, __v: 0 } }
      );
      
      if (updatedUser) break;
      
      // Try string ID if ObjectId didn't work
      updatedUser = await db.collection(collectionName).findOne(
        { _id: userId },
        { projection: { password: 0, __v: 0 } }
      );
      
      if (updatedUser) break;
    }

    return Response.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    }, { status: 200 });

  } catch (error) {
    console.error('=== USER PROFILE UPDATE ERROR ===');
    console.error('Error:', error);
    
    return Response.json({
      success: false,
      message: 'Failed to update profile',
      ...(process.env.NODE_ENV === 'development' && { 
        error: error.message 
      })
    }, { status: 500 });
  }
}