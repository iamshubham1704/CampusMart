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
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Request URL:', request.url);
  console.log('Request headers:', JSON.stringify([...request.headers.entries()], null, 2));
  
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    console.log('Auth header present:', !!authHeader);
    console.log('Auth header value:', authHeader ? `${authHeader.substring(0, 20)}...` : 'null');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Invalid authorization header format');
      return new Response(JSON.stringify({ 
        success: false,
        message: 'Invalid authorization header format',
        debug: {
          hasAuthHeader: !!authHeader,
          authHeaderStart: authHeader ? authHeader.substring(0, 10) : null,
          expectedFormat: 'Bearer <token>'
        }
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
    console.log('✓ Token extracted, length:', token.length);
    console.log('Token preview:', token ? `${token.substring(0, 20)}...` : 'null');

    if (!token || token.trim() === '') {
      console.log('❌ No token found after Bearer');
      return new Response(JSON.stringify({ 
        success: false,
        message: 'No token provided',
        debug: {
          tokenLength: token ? token.length : 0,
          tokenPreview: token ? token.substring(0, 10) : null
        }
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

    // Verify the token with enhanced error handling
    let decoded;
    try {
      console.log('🔍 Starting token verification...');
      decoded = verifyToken(token);
      console.log('✓ Token verification successful');
      console.log('Decoded token keys:', Object.keys(decoded || {}));
      console.log('Decoded token sample:', {
        ...decoded,
        // Don't log sensitive data in production
        ...(process.env.NODE_ENV === 'development' && { fullToken: decoded })
      });
    } catch (tokenError) {
      console.error('❌ Token verification error:', {
        name: tokenError.name,
        message: tokenError.message,
        stack: process.env.NODE_ENV === 'development' ? tokenError.stack : 'hidden'
      });
      
      return new Response(JSON.stringify({ 
        success: false,
        message: 'Invalid or expired token',
        debug: {
          error: tokenError.message,
          errorType: tokenError.name,
          tokenLength: token.length,
          environment: process.env.NODE_ENV
        }
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
      console.log('❌ Token verification returned null/undefined');
      return new Response(JSON.stringify({ 
        success: false,
        message: 'Invalid or expired token - verification returned null',
        debug: {
          decodedValue: decoded,
          tokenLength: token.length
        }
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

    // Connect to database with timeout and enhanced logging
    let client;
    try {
      console.log('🔗 Connecting to database...');
      console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);
      console.log('MongoDB URI preview:', process.env.MONGODB_URI ? 
        `${process.env.MONGODB_URI.substring(0, 20)}...` : 'not set');
      
      client = await Promise.race([
        clientPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database connection timeout after 10s')), 10000)
        )
      ]);
      console.log('✓ Database connection established');
    } catch (dbError) {
      console.error('❌ Database connection failed:', {
        name: dbError.name,
        message: dbError.message,
        stack: process.env.NODE_ENV === 'development' ? dbError.stack : 'hidden'
      });
      
      return new Response(JSON.stringify({
        success: false,
        message: 'Database connection failed',
        debug: {
          error: dbError.message,
          hasMongoUri: !!process.env.MONGODB_URI,
          environment: process.env.NODE_ENV
        }
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

    // Get user ID from token
    const userId = getUserId(decoded);
    console.log('🆔 Extracted user ID:', userId);
    console.log('User ID type:', typeof userId);
    
    if (!userId) {
      console.error('❌ No valid user ID found in token');
      console.log('Available token fields:', Object.keys(decoded));
      return new Response(JSON.stringify({ 
        success: false,
        message: 'Invalid token: no user ID found',
        debug: {
          tokenFields: Object.keys(decoded),
          searchedFields: ['userId', 'sellerId', 'id', 'user_id', 'sub']
        }
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
    console.log('🔍 Search criteria:', {
      originalUserId: userId,
      objectId: objectId,
      isObjectIdValid: ObjectId.isValid(userId)
    });

    // Try multiple collections to find the user with enhanced logging
    let user = null;
    const collections = ['sellers', 'users'];
    const searchAttempts = [];

    for (const collectionName of collections) {
      try {
        console.log(`🔍 Checking collection: ${collectionName}`);
        
        // Count total documents in collection for debugging
        const totalDocs = await db.collection(collectionName).countDocuments();
        console.log(`Collection ${collectionName} has ${totalDocs} documents`);
        
        user = await db.collection(collectionName).findOne(
          { _id: objectId },
          {
            projection: {
              password: 0,
              __v: 0
            }
          }
        );
        
        searchAttempts.push({
          collection: collectionName,
          searchType: 'ObjectId',
          searchValue: objectId,
          found: !!user
        });
        
        if (user) {
          console.log(`✓ User found in collection: ${collectionName}`);
          console.log('User data preview:', {
            _id: user._id,
            email: user.email,
            name: user.name,
            accountType: user.accountType
          });
          break;
        } else {
          console.log(`❌ User not found in ${collectionName} with ObjectId`);
        }
      } catch (findError) {
        console.error(`❌ Error finding user in ${collectionName}:`, findError.message);
        searchAttempts.push({
          collection: collectionName,
          searchType: 'ObjectId',
          error: findError.message
        });
        continue;
      }
    }

    // If not found by ObjectId, try finding by string ID or email
    if (!user) {
      console.log('🔍 User not found by ObjectId, trying alternative searches...');
      
      for (const collectionName of collections) {
        try {
          // Try by string ID
          console.log(`🔍 Trying string ID search in ${collectionName}`);
          user = await db.collection(collectionName).findOne(
            { _id: userId },
            { projection: { password: 0, __v: 0 } }
          );
          
          searchAttempts.push({
            collection: collectionName,
            searchType: 'stringId',
            searchValue: userId,
            found: !!user
          });
          
          if (user) {
            console.log(`✓ User found by string ID in collection: ${collectionName}`);
            break;
          }
          
          // Try by email if userId looks like an email
          if (typeof userId === 'string' && userId.includes('@')) {
            console.log(`🔍 Trying email search in ${collectionName}`);
            user = await db.collection(collectionName).findOne(
              { email: userId },
              { projection: { password: 0, __v: 0 } }
            );
            
            searchAttempts.push({
              collection: collectionName,
              searchType: 'email',
              searchValue: userId,
              found: !!user
            });
            
            if (user) {
              console.log(`✓ User found by email in collection: ${collectionName}`);
              break;
            }
          }
        } catch (findError) {
          console.error(`❌ Error in alternative search for ${collectionName}:`, findError.message);
          searchAttempts.push({
            collection: collectionName,
            searchType: 'alternative',
            error: findError.message
          });
          continue;
        }
      }
    }

    if (!user) {
      console.log('❌ User not found in any collection');
      console.log('Search attempts summary:', searchAttempts);
      
      return new Response(JSON.stringify({ 
        success: false,
        message: 'User not found',
        debug: {
          searchAttempts,
          searchedUserId: userId,
          searchedObjectId: objectId,
          collections
        }
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

    console.log('✓ User found successfully:', {
      id: user._id,
      name: user.name || user.email,
      collection: searchAttempts.find(a => a.found)?.collection
    });

    // Initialize seller statistics
    let sellerStats = {
      totalSales: 0,
      totalEarnings: 0,
      rating: 0,
      responseRate: 0,
      accountType: 'Standard',
      memberSince: user.createdAt ? new Date(user.createdAt).getFullYear() : new Date().getFullYear()
    };

    // Fetch seller statistics if user is a seller (with error handling)
    if (user.isSeller || user.accountType === 'seller') {
      console.log('📊 Fetching seller statistics...');

      try {
        const statsPromises = [];
        
        // Sales data
        statsPromises.push(
          db.collection('orders').aggregate([
            { $match: { sellerId: user._id, status: 'completed' } },
            { $group: { _id: null, totalSales: { $sum: 1 }, totalEarnings: { $sum: '$amount' } } }
          ]).toArray()
        );

        // Ratings
        statsPromises.push(
          db.collection('reviews').aggregate([
            { $match: { sellerId: user._id } },
            { $group: { _id: null, averageRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
          ]).toArray()
        );

        // Response rate
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        statsPromises.push(
          db.collection('messages').aggregate([
            { $match: { receiverId: user._id, createdAt: { $gte: thirtyDaysAgo } } },
            { $group: { _id: null, totalMessages: { $sum: 1 }, respondedMessages: { $sum: { $cond: [{ $ne: ['$responseTime', null] }, 1, 0] } } } }
          ]).toArray()
        );

        const [salesResult, ratingsResult, messagesResult] = await Promise.allSettled(
          statsPromises.map(p => Promise.race([p, new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Query timeout')), 5000))]))
        );

        if (salesResult.status === 'fulfilled' && salesResult.value.length > 0) {
          sellerStats.totalSales = salesResult.value[0].totalSales || 0;
          sellerStats.totalEarnings = salesResult.value[0].totalEarnings || 0;
        }

        if (ratingsResult.status === 'fulfilled' && ratingsResult.value.length > 0) {
          sellerStats.rating = Math.round((ratingsResult.value[0].averageRating || 0) * 10) / 10;
        }

        if (messagesResult.status === 'fulfilled' && messagesResult.value.length > 0 && messagesResult.value[0].totalMessages > 0) {
          sellerStats.responseRate = Math.round(
            (messagesResult.value[0].respondedMessages / messagesResult.value[0].totalMessages) * 100
          );
        }

        sellerStats.accountType = user.accountType || 'Seller';
        console.log('✓ Seller stats calculated successfully');

      } catch (statsError) {
        console.error('❌ Error calculating seller stats:', statsError.message);
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

    console.log('✅ Profile data prepared successfully');
    console.log('Response preview:', {
      success: true,
      dataKeys: Object.keys(profileData),
      userId: profileData._id
    });

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
    console.error('🚨 CRITICAL ERROR IN PROFILE API 🚨');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', process.env.NODE_ENV === 'development' ? error.stack : 'hidden in production');
    
    return new Response(JSON.stringify({
      success: false,
      message: 'Internal server error',
      debug: {
        error: error.message,
        errorType: error.name,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      }
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

// PUT method unchanged but with better error responses
export async function PUT(request) {
  console.log('=== USER PROFILE API PUT REQUEST ===');

  try {
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
        debug: process.env.NODE_ENV === 'development' ? { error: tokenError.message } : {}
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

    const allowedFields = ['name', 'phone', 'location', 'bio', 'college', 'year', 'profileImage'];
    const filteredData = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });
    filteredData.updatedAt = new Date();

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
        message: 'Database connection failed'
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
          console.log(`Profile updated in collection: ${collectionName}`);
          break;
        }
      } catch (updateError) {
        console.error(`Error updating in ${collectionName}:`, updateError);
        continue;
      }
    }

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

    let updatedUser = null;
    for (const collectionName of collections) {
      try {
        updatedUser = await db.collection(collectionName).findOne(
          { _id: objectId },
          { projection: { password: 0, __v: 0 } }
        );
        
        if (updatedUser) break;
        
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
      debug: process.env.NODE_ENV === 'development' ? { error: error.message } : {}
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