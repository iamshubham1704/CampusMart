// app/api/admin/conversations/route.js
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

// GET - Fetch all conversations with details
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
    const status = url.searchParams.get('status'); // 'active', 'inactive', or null for all

    let matchStage = {};
    if (status === 'active') {
      matchStage = { $or: [{ isActive: true }, { isActive: { $exists: false } }] };
    } else if (status === 'inactive') {
      matchStage = { isActive: false };
    }

    // Fetch conversations with related data
    const conversations = await db.collection('conversations')
      .aggregate([
        { $match: matchStage },
        {
          $lookup: {
            from: 'buyers',
            localField: 'buyer_id',
            foreignField: '_id',
            as: 'buyer'
          }
        },
        {
          $lookup: {
            from: 'sellers',
            localField: 'seller_id',
            foreignField: '_id',
            as: 'seller'
          }
        },
        {
          $lookup: {
            from: 'listings',
            localField: 'product_id',
            foreignField: '_id',
            as: 'listing'
          }
        },
        {
          $lookup: {
            from: 'messages',
            let: { conversationId: '$_id' },
            pipeline: [
              { $match: { $expr: { $eq: ['$conversation_id', '$$conversationId'] } } },
              { $sort: { created_at: -1 } },
              { $limit: 1 }
            ],
            as: 'lastMessage'
          }
        },
        {
          $lookup: {
            from: 'messages',
            localField: '_id',
            foreignField: 'conversation_id',
            as: 'messages'
          }
        },
        {
          $project: {
            _id: 1,
            buyer_id: 1,
            seller_id: 1,
            product_id: 1,
            created_at: 1,
            updated_at: 1,
            isActive: { $ifNull: ['$isActive', true] },
            buyer_name: { $arrayElemAt: ['$buyer.name', 0] },
            buyer_email: { $arrayElemAt: ['$buyer.email', 0] },
            seller_name: { $arrayElemAt: ['$seller.name', 0] },
            seller_email: { $arrayElemAt: ['$seller.email', 0] },
            listing_title: { $arrayElemAt: ['$listing.title', 0] },
            listing_price: { $arrayElemAt: ['$listing.price', 0] },
            last_message: { $arrayElemAt: ['$lastMessage.message', 0] },
            last_message_at: { $arrayElemAt: ['$lastMessage.created_at', 0] },
            messages_count: { $size: '$messages' }
          }
        },
        { $sort: { updated_at: -1 } },
        { $skip: skip },
        { $limit: limit }
      ])
      .toArray();

    // Get total count
    const totalConversations = await db.collection('conversations').countDocuments(matchStage);

    return Response.json({
      success: true,
      data: {
        conversations,
        pagination: {
          page,
          limit,
          total: totalConversations,
          totalPages: Math.ceil(totalConversations / limit)
        }
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    return Response.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// PUT - Update conversation status (activate/deactivate)
export async function PUT(request) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return Response.json({ 
        error: 'Unauthorized. Admin access required.' 
      }, { status: 401 });
    }

    const { conversationId, isActive } = await request.json();

    if (!conversationId || typeof isActive !== 'boolean') {
      return Response.json({ 
        error: 'Missing required fields: conversationId, isActive' 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');

    let objectId;
    try {
      objectId = new ObjectId(conversationId);
    } catch (error) {
      return Response.json({ 
        error: 'Invalid conversationId format' 
      }, { status: 400 });
    }

    // Update conversation status
    const result = await db.collection('conversations').updateOne(
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
        error: 'Conversation not found' 
      }, { status: 404 });
    }

    // If deactivating conversation, also deactivate all its messages
    if (!isActive) {
      await db.collection('messages').updateMany(
        { conversation_id: objectId },
        { 
          $set: { 
            isActive: false,
            updatedAt: new Date()
          } 
        }
      );
    }

    return Response.json({
      success: true,
      message: `Conversation ${isActive ? 'activated' : 'deactivated'} successfully`
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating conversation status:', error);
    return Response.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}