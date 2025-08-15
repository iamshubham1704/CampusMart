// app/api/messages/mark-read/route.js
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '../../../../lib/mongo';

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

    const { conversationId, userId } = body;

    console.log('POST /api/messages/mark-read - Body:', {
      conversationId,
      userId
    });

    // Validate required fields
    if (!conversationId) {
      return NextResponse.json(
        { error: 'Missing conversationId field' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId field' },
        { status: 400 }
      );
    }

    // Validate ObjectId formats
    if (!ObjectId.isValid(conversationId)) {
      console.error('Invalid conversationId format:', conversationId);
      return NextResponse.json(
        { error: 'Invalid conversationId format' },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(userId)) {
      console.error('Invalid userId format:', userId);
      return NextResponse.json(
        { error: 'Invalid userId format' },
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

    // Mark all messages in the conversation as read for the current user
    // (messages that were NOT sent by the current user and are not already read)
    const updateFilter = {
      conversation_id: new ObjectId(conversationId),
      sender_id: { $ne: new ObjectId(userId) },
      read_at: null
    };

    const result = await db.collection('messages').updateMany(
      updateFilter,
      {
        $set: { read_at: new Date() }
      }
    );

    console.log(`Marked ${result.modifiedCount} messages as read for user ${userId} in conversation ${conversationId}`);

    return NextResponse.json({ 
      success: true, 
      modifiedCount: result.modifiedCount,
      conversationId,
      userId
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}