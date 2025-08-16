// app/api/admin/messages/route.js
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

// GET - Fetch all messages with conversation and user details
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
    const limit = parseInt(url.searchParams.get('limit')) || 50;
    const skip = (page - 1) * limit;
    const status = url.searchParams.get('status'); // 'active', 'inactive', or null for all

    let matchStage = {};
    if (status === 'active') {
      matchStage = { $or: [{ isActive: true }, { isActive: { $exists: false } }] };
    } else if (status === 'inactive') {
      matchStage = { isActive: false };
    }

    // Fetch messages with conversation and user details
    const messages = await db.collection('messages')
      .aggregate([
        { $match: matchStage },
        {
          $lookup: {
            from: 'conversations',
            localField: 'conversation_id',
            foreignField: '_id',
            as: 'conversation'
          }
        },
        {
          $lookup: {
            from: 'buyers',
            localField: 'sender_id',
            foreignField: '_id',
            as: 'buyer'
          }
        },
        {
          $lookup: {
            from: 'sellers',
            localField: 'sender_id',
            foreignField: '_id',
            as: 'seller'
          }
        },
        {
          $lookup: {
            from: 'listings',
            let: { productId: { $arrayElemAt: ['$conversation.product_id', 0] } },
            pipeline: [
              { $match: { $expr: { $eq: ['$_id', '$$productId'] } } }
            ],
            as: 'listing'
          }
        },
        {
          $project: {
            _id: 1,
            conversation_id: 1,
            sender_id: 1,
            sender_type: 1,
            message: 1,
            created_at: 1,
            read_at: 1,
            isActive: { $ifNull: ['$isActive', true] },
            sender_name: {
              $ifNull: [
                { $arrayElemAt: ['$buyer.name', 0] },
                { $arrayElemAt: ['$seller.name', 0] },
                'Unknown User'
              ]
            },
            sender_email: {
              $ifNull: [
                { $arrayElemAt: ['$buyer.email', 0] },
                { $arrayElemAt: ['$seller.email', 0] },
                'No email'
              ]
            },
            listing_title: { $arrayElemAt: ['$listing.title', 0] },
            conversation_created: { $arrayElemAt: ['$conversation.created_at', 0] }
          }
        },
        { $sort: { created_at: -1 } },
        { $skip: skip },
        { $limit: limit }
      ])
      .toArray();

    // Get total count
    const totalMessages = await db.collection('messages').countDocuments(matchStage);

    return Response.json({
      success: true,
      data: {
        messages,
        pagination: {
          page,
          limit,
          total: totalMessages,
          totalPages: Math.ceil(totalMessages / limit)
        }
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return Response.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// PUT - Update message status (activate/deactivate)
export async function PUT(request) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return Response.json({ 
        error: 'Unauthorized. Admin access required.' 
      }, { status: 401 });
    }

    const { messageId, isActive } = await request.json();

    if (!messageId || typeof isActive !== 'boolean') {
      return Response.json({ 
        error: 'Missing required fields: messageId, isActive' 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');

    let objectId;
    try {
      objectId = new ObjectId(messageId);
    } catch (error) {
      return Response.json({ 
        error: 'Invalid messageId format' 
      }, { status: 400 });
    }

    // Update message status
    const result = await db.collection('messages').updateOne(
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
        error: 'Message not found' 
      }, { status: 404 });
    }

    return Response.json({
      success: true,
      message: `Message ${isActive ? 'activated' : 'deactivated'} successfully`
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating message status:', error);
    return Response.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}