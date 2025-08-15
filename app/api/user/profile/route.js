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
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Invalid authorization header format');
      return new Response(JSON.stringify({ 
        success: false,
        message: 'Invalid authorization header format' 
      }), { 
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    const token = authHeader.substring(7);
    if (!token) {
      console.log('No token found after Bearer');
      return new Response(JSON.stringify({ 
        success: false,
        message: 'No token provided' 
      }), { 
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    console.log('Token extracted, length:', token.length);

    // Verify the token with error handling
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (tokenError) {
      console.error('Token verification error:', tokenError);
      return new Response(JSON.stringify({ 
        success: false,
        message: 'Invalid or expired token',
        error: process.env.NODE_ENV === 'development' ? tokenError.message : undefined
      }), { 
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    if (!decoded) {
      console.log('Token verification failed');
      return new Response(JSON.stringify({ 
        success: false,
        message: 'Invalid or expired token' 
      }), { 
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    console.log('Token verification successful. Decoded token:', JSON.stringify(decoded, null, 2));

    // Connect to database with timeout
    let client;
    try {
      client = await Promise.race([
        clientPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database connection timeout')), 10000)
        )
      ]);
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return new Response(JSON.stringify({
        success: false,
        message: 'Database connection failed',
        error: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      }), { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    const db = client.db('campusmart');
    console.log('Database connection established');

    // Get user ID from token
    const userId = getUserId(decoded);
    if (!userId) {
      console.error('No valid user ID found in token');
      return new Response(JSON.stringify({ 
        success: false,
        message: 'Invalid token: no user ID found' 
      }), { 
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    const objectId = toObjectId(userId);
    console.log('Looking for user with ID:', userId, 'as ObjectId:', objectId);

    // Try multiple collections to find the user
    let user = null;
    const collections = ['sellers', 'users']; // Add other collection names if needed

    for (const collectionName of collections) {
      try {
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
      } catch (findError) {
        console.error(`Error finding user in ${collectionName}:`, findError);
        continue;
      }
    }

    // If not found by ObjectId, try finding by string ID or email
    if (!user) {
      console.log('User not found by ObjectId, trying alternative searches...');
      
      for (const collectionName of collections) {
        try {
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
        } catch (findError) {
          console.error(`Error in alternative search for ${collectionName}:`, findError);
          continue;
        }
      }
    }

    if (!user) {
      console.log('User not found in any collection');
      return new Response(JSON.stringify({ 
        success: false,
        message: 'User not found' 
      }), { 
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
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
        // Fetch sales data with timeout
        const salesPromise = db.collection('orders').aggregate([
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

        // Fetch ratings with timeout
        const ratingsPromise = db.collection('reviews').aggregate([
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

        // Calculate response rate (last 30 days) with timeout
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const messagesPromise = db.collection('messages').aggregate([
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

        // Execute all queries with timeout
        const [sales, ratings, messages] = await Promise.allSettled([
          Promise.race([salesPromise, new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Sales query timeout')), 5000))]),
          Promise.race([ratingsPromise, new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Ratings query timeout')), 5000))]),
          Promise.race([messagesPromise, new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Messages query timeout')), 5000))])
        ]);

        // Update seller stats
        if (sales.status === 'fulfilled' && sales.value.length > 0) {
          sellerStats.totalSales = sales.value[0].totalSales || 0;
          sellerStats.totalEarnings = sales.value[0].totalEarnings || 0;
        }

        if (ratings.status === 'fulfilled' && ratings.value.length > 0) {
          sellerStats.rating = Math.round((ratings.value[0].averageRating || 0) * 10) / 10;
        }

        if (messages.status === 'fulfilled' && messages.value.length > 0 && messages.value[0].totalMessages > 0) {
          sellerStats.responseRate = Math.round(
            (messages.value[0].respondedMessages / messages.value[0].totalMessages) * 100
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

    return new Response(JSON.stringify({
      success: true,
      data: profileData
    }), { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });

  } catch (error) {
    console.error('=== USER PROFILE API ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(JSON.stringify({
      success: false,
      message: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { 
        error: error.message,
        stack: error.stack 
      })
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
}

// PUT - Update user profile
export async function PUT(request) {
  console.log('=== USER PROFILE API PUT REQUEST ===');

  try {
    // Extract and verify token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ 
        success: false,
        message: 'Invalid authorization header' 
      }), { 
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    const token = authHeader.substring(7);
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (tokenError) {
      console.error('Token verification error:', tokenError);
      return new Response(JSON.stringify({ 
        success: false,
        message: 'Invalid or expired token',
        error: process.env.NODE_ENV === 'development' ? tokenError.message : undefined
      }), { 
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }
    
    if (!decoded) {
      return new Response(JSON.stringify({ 
        success: false,
        message: 'Invalid or expired token' 
      }), { 
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    console.log('Token verified for update request:', decoded.userId || decoded.id);

    // Get update data with validation
    let updateData;
    try {
      updateData = await request.json();
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError);
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid JSON data'
      }), { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

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

    // Connect to database with timeout
    let client;
    try {
      client = await Promise.race([
        clientPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database connection timeout')), 10000)
        )
      ]);
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return new Response(JSON.stringify({
        success: false,
        message: 'Database connection failed',
        error: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      }), { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    const db = client.db('campusmart');

    // Get user ID
    const userId = getUserId(decoded);
    if (!userId) {
      return new Response(JSON.stringify({ 
        success: false,
        message: 'Invalid token: no user ID found' 
      }), { 
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    const objectId = toObjectId(userId);

    // Try to update in multiple collections
    let updateResult = null;
    const collections = ['sellers', 'users'];

    for (const collectionName of collections) {
      try {
        const result = await db.collection(collectionName).updateOne(
          { _id: objectId },
          { $set: filteredData }
        );

        if (result.matchedCount > 0) {
          updateResult = result;
          console.log(`Profile updated in collection: ${collectionName}, modified: ${result.modifiedCount}`);
          break;
        }
      } catch (updateError) {
        console.error(`Error updating in ${collectionName}:`, updateError);
        continue;
      }
    }

    // If not found by ObjectId, try string ID
    if (!updateResult || updateResult.matchedCount === 0) {
      for (const collectionName of collections) {
        try {
          const result = await db.collection(collectionName).updateOne(
            { _id: userId },
            { $set: filteredData }
          );

          if (result.matchedCount > 0) {
            updateResult = result;
            console.log(`Profile updated by string ID in collection: ${collectionName}`);
            break;
          }
        } catch (updateError) {
          console.error(`Error updating by string ID in ${collectionName}:`, updateError);
          continue;
        }
      }
    }

    if (!updateResult || updateResult.matchedCount === 0) {
      return new Response(JSON.stringify({ 
        success: false,
        message: 'User not found' 
      }), { 
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    // Fetch updated user data
    let updatedUser = null;
    for (const collectionName of collections) {
      try {
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
      } catch (fetchError) {
        console.error(`Error fetching updated user from ${collectionName}:`, fetchError);
        continue;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    }), { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });

  } catch (error) {
    console.error('=== USER PROFILE UPDATE ERROR ===');
    console.error('Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      message: 'Failed to update profile',
      ...(process.env.NODE_ENV === 'development' && { 
        error: error.message 
      })
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}