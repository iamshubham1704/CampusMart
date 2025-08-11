import { verifyToken } from '../../../../lib/auth'; 
import clientPromise from '@/lib/mongo';
import { ObjectId } from 'mongodb';

// For App Router (Next.js 13+)
export async function GET(request) {
  try {
    // Pass the entire request object to verifyToken
    const decoded = verifyToken(request);
    if (!decoded) {
      return Response.json({ message: 'Invalid or expired token' }, { status: 401 });
    }

    // Connect to database - FIX: Don't call clientPromise as a function
    const client = await clientPromise; // Remove the parentheses
    const db = client.db('campusmart'); // Specify your database name here
    
    // Debug logging
    console.log('Decoded token:', decoded);
    console.log('User ID from token:', decoded.userId);
    
    // Handle different possible user ID field names from token
    let userId = decoded.userId || decoded.sellerId || decoded.id || decoded.user_id;
    
    if (!userId) {
      console.error('No valid user ID found in token');
      return Response.json({ message: 'Invalid token: no user ID found' }, { status: 401 });
    }
    
    console.log('Using user ID:', userId);
    
    // Fetch user profile data - Convert userId to ObjectId if it's a string
    if (typeof userId === 'string' && ObjectId.isValid(userId)) {
      userId = new ObjectId(userId);
    }
    
    const user = await db.collection('sellers').findOne(
      { _id: userId },
      { 
        projection: { 
          password: 0 
        } 
      }
    );

    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }

    // Fetch seller statistics if user is a seller
    let sellerStats = {
      totalSales: 0,
      totalEarnings: 0,
      rating: 0,
      responseRate: 0,
      accountType: 'Standard',
      memberSince: user.createdAt || '2024'
    };

    // If user has seller data, fetch statistics
    if (user.isSeller || user.accountType === 'sellers') {
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

      // Calculate response rate (example logic)
      const messages = await db.collection('messages').aggregate([
        {
          $match: {
            receiverId: user._id,
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
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

      if (sales.length > 0) {
        sellerStats.totalSales = sales[0].totalSales;
        sellerStats.totalEarnings = sales[0].totalEarnings;
      }

      if (ratings.length > 0) {
        sellerStats.rating = Math.round(ratings[0].averageRating * 10) / 10;
      }

      if (messages.length > 0 && messages[0].totalMessages > 0) {
        sellerStats.responseRate = Math.round(
          (messages[0].respondedMessages / messages[0].totalMessages) * 100
        );
      }

      sellerStats.accountType = user.accountType || 'Seller';
    }

    // Format the response to match your component's expected structure
    const profileData = {
      _id: user._id,
      name: user.name || user.fullName,
      email: user.email,
      phone: user.phone,
      location: user.location,
      bio: user.bio,
      college: user.college,
      year: user.year,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      ...sellerStats
    };

    return Response.json({
      success: true,
      data: profileData
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return Response.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

// For updating profile
export async function PUT(request) {
  try {
    // Pass the entire request object to verifyToken
    const decoded = verifyToken(request);
    if (!decoded) {
      return Response.json({ message: 'Invalid or expired token' }, { status: 401 });
    }

    const updateData = await request.json();
    
    // Remove fields that shouldn't be updated via this endpoint
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

    // Connect to database - FIX: Don't call clientPromise as a function
    const client = await clientPromise; // Remove the parentheses
    const db = client.db('campusmart'); // Specify your database name here
    
    // Convert userId to ObjectId if it's a string
    let userId = decoded.userId || decoded.sellerId || decoded.id || decoded.user_id;
    
    if (!userId) {
      console.error('No valid user ID found in token');
      return Response.json({ message: 'Invalid token: no user ID found' }, { status: 401 });
    }
    
    if (typeof userId === 'string' && ObjectId.isValid(userId)) {
      userId = new ObjectId(userId);
    }
    
    // Update user profile
    const result = await db.collection('sellers').updateOne(
      { _id: userId },
      { $set: filteredData }
    );

    if (result.matchedCount === 0) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }

    // Fetch updated user data
    const updatedUser = await db.collection('sellers').findOne(
      { _id: userId },
      { projection: { password: 0 } }
    );

    return Response.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating user profile:', error);
    return Response.json({
      success: false,
      message: 'Failed to update profile'
    }, { status: 500 });
  }
}