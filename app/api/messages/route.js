// app/api/messages/route.js
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '../../../lib/mongo';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    console.log('GET /api/messages - conversationId:', conversationId);

    if (!conversationId) {
      console.error('Missing conversationId parameter');
      return NextResponse.json(
        { error: 'Missing conversationId parameter' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(conversationId)) {
      console.error('Invalid conversationId format:', conversationId);
      return NextResponse.json(
        { error: 'Invalid conversationId format' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // First check if conversation exists
    const conversationExists = await db.collection('conversations').findOne({
      _id: new ObjectId(conversationId)
    });

    if (!conversationExists) {
      console.error('Conversation not found:', conversationId);
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Fetch messages with sender information
    const pipeline = [
      {
        $match: {
          conversation_id: new ObjectId(conversationId)
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'sender_id',
          foreignField: '_id',
          as: 'sender'
        }
      },
      {
        $project: {
          id: { $toString: '$_id' }, // Convert ObjectId to string for frontend
          _id: 1,
          conversation_id: 1,
          sender_id: 1,
          sender_type: 1,
          message: 1,
          created_at: 1,
          read_at: 1,
          sender_name: { 
            $ifNull: [
              { $arrayElemAt: ['$sender.name', 0] },
              'Unknown User'
            ]
          }
        }
      },
      {
        $sort: { created_at: 1 }
      }
    ];

    const messages = await db.collection('messages').aggregate(pipeline).toArray();
    
    console.log(`Found ${messages.length} messages for conversation ${conversationId}`);

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Parse request body with error handling
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { conversationId, senderId, senderType, message } = body;

    console.log('POST /api/messages - Body:', {
      conversationId,
      senderId,
      senderType,
      messageLength: message?.length
    });

    // Validate required fields
    if (!conversationId) {
      return NextResponse.json(
        { error: 'Missing conversationId field' },
        { status: 400 }
      );
    }

    if (!senderId) {
      return NextResponse.json(
        { error: 'Missing senderId field' },
        { status: 400 }
      );
    }

    if (!senderType) {
      return NextResponse.json(
        { error: 'Missing senderType field' },
        { status: 400 }
      );
    }

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Missing or empty message field' },
        { status: 400 }
      );
    }

    // Validate ObjectId formats
    if (!ObjectId.isValid(conversationId)) {
      return NextResponse.json(
        { error: 'Invalid conversationId format' },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(senderId)) {
      return NextResponse.json(
        { error: 'Invalid senderId format' },
        { status: 400 }
      );
    }

    // Validate senderType
    if (!['student', 'teacher', 'admin'].includes(senderType)) {
      return NextResponse.json(
        { error: 'Invalid senderType. Must be student, teacher, or admin' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Verify conversation exists
    const conversation = await db.collection('conversations').findOne({
      _id: new ObjectId(conversationId)
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Verify user exists
    const user = await db.collection('users').findOne({
      _id: new ObjectId(senderId)
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create new message
    const newMessage = {
      conversation_id: new ObjectId(conversationId),
      sender_id: new ObjectId(senderId),
      sender_type: senderType,
      message: message.trim(),
      created_at: new Date(),
      read_at: null
    };

    const result = await db.collection('messages').insertOne(newMessage);
    
    // Update conversation's updated_at timestamp
    await db.collection('conversations').updateOne(
      { _id: new ObjectId(conversationId) },
      { $set: { updated_at: new Date() } }
    );

    const responseMessage = {
      id: result.insertedId.toString(), // Convert to string for frontend
      _id: result.insertedId,
      ...newMessage,
      sender_name: user.name || 'Unknown User'
    };

    console.log('Message created successfully:', result.insertedId);

    return NextResponse.json({ message: responseMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}