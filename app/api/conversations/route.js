import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '../../../lib/mongo';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userType = searchParams.get('userType');
    const userId = searchParams.get('userId');

    if (!userType || !userId) {
      return NextResponse.json(
        { error: 'Missing userType or userId' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Create aggregation pipeline to fetch conversations with details
    const pipeline = [
      {
        $match: {
          [userType === 'buyer' ? 'buyer_id' : 'seller_id']: new ObjectId(userId)
        }
      },
      {
        $lookup: {
          from: 'listings', // Changed from 'products' to 'listings' to match your schema
          localField: 'product_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $lookup: {
          from: 'users', // Make sure this collection exists for buyers
          localField: 'buyer_id',
          foreignField: '_id',
          as: 'buyer'
        }
      },
      {
        $lookup: {
          from: 'users', // Make sure this collection exists for sellers
          localField: 'seller_id',
          foreignField: '_id',
          as: 'seller'
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
          let: { 
            conversationId: '$_id',
            currentUserId: new ObjectId(userId)
          },
          pipeline: [
            { 
              $match: { 
                $expr: { 
                  $and: [
                    { $eq: ['$conversation_id', '$$conversationId'] },
                    { $ne: ['$sender_id', '$$currentUserId'] },
                    { $eq: ['$read_at', null] }
                  ]
                }
              }
            },
            { $count: 'unread' }
          ],
          as: 'unreadCount'
        }
      },
      {
        $project: {
          id: '$_id',
          _id: '$_id', // Keep both for compatibility
          buyer_id: 1,
          seller_id: 1,
          product_id: 1,
          created_at: 1,
          updated_at: 1,
          product_title: { $arrayElemAt: ['$product.title', 0] },
          buyer_name: { $arrayElemAt: ['$buyer.name', 0] },
          seller_name: { $arrayElemAt: ['$seller.name', 0] },
          last_message: { $arrayElemAt: ['$lastMessage.message', 0] },
          last_message_at: { $arrayElemAt: ['$lastMessage.created_at', 0] },
          unread_count: { 
            $ifNull: [{ $arrayElemAt: ['$unreadCount.unread', 0] }, 0] 
          }
        }
      },
      {
        $sort: { 
          last_message_at: -1, 
          created_at: -1 
        }
      }
    ];

    const conversations = await db.collection('conversations').aggregate(pipeline).toArray();

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { buyerId, sellerId, productId } = await request.json();

    if (!buyerId || !sellerId) {
      return NextResponse.json(
        { error: 'Missing buyerId or sellerId' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Check if conversation already exists
    const existingConversation = await db.collection('conversations').findOne({
      buyer_id: new ObjectId(buyerId),
      seller_id: new ObjectId(sellerId),
      product_id: productId ? new ObjectId(productId) : null
    });

    if (existingConversation) {
      return NextResponse.json({ 
        conversationId: existingConversation._id,
        conversation: {
          ...existingConversation,
          id: existingConversation._id // Add id field for compatibility
        }
      });
    }

    // Create new conversation
    const newConversation = {
      buyer_id: new ObjectId(buyerId),
      seller_id: new ObjectId(sellerId),
      product_id: productId ? new ObjectId(productId) : null,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await db.collection('conversations').insertOne(newConversation);
    
    const conversationWithId = {
      ...newConversation,
      _id: result.insertedId,
      id: result.insertedId // Add id field for compatibility
    };

    return NextResponse.json({ 
      conversationId: result.insertedId,
      conversation: conversationWithId
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}