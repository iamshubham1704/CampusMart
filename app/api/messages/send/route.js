import { NextResponse } from 'next/server';
import { NotificationService } from '../../../../utils/notificationService';
import clientPromise from '../../../../lib/mongo';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    const body = await request.json();
    const { sellerId, buyerId, listingId, message, senderName, senderType = 'buyer' } = body;

    // Validate required fields
    if (!sellerId || !buyerId || !listingId || !message) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: sellerId, buyerId, listingId, message'
      }, { status: 400 });
    }

    // Validate ObjectId formats
    if (!ObjectId.isValid(sellerId) || !ObjectId.isValid(buyerId) || !ObjectId.isValid(listingId)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid ID format'
      }, { status: 400 });
    }

    // Validate message content
    if (!message.trim()) {
      return NextResponse.json({
        success: false,
        message: 'Message cannot be empty'
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');
    
    // Get listing details
    const listings = db.collection('listings');
    const listing = await listings.findOne({ _id: new ObjectId(listingId) });

    if (!listing) {
      return NextResponse.json({
        success: false,
        message: 'Listing not found'
      }, { status: 404 });
    }

    // Verify that the listing belongs to the seller
    const listingOwner = listing.sellerId.toString();
    if (listingOwner !== sellerId) {
      return NextResponse.json({
        success: false,
        message: 'Listing does not belong to specified seller'
      }, { status: 400 });
    }

    // Find or create conversation
    const conversations = db.collection('conversations');
    let conversation = await conversations.findOne({
      $or: [
        {
          participant1: new ObjectId(sellerId),
          participant2: new ObjectId(buyerId),
          listingId: new ObjectId(listingId)
        },
        {
          participant1: new ObjectId(buyerId),
          participant2: new ObjectId(sellerId),
          listingId: new ObjectId(listingId)
        }
      ]
    });

    if (!conversation) {
      // Create new conversation
      const newConversation = {
        participant1: new ObjectId(buyerId),
        participant2: new ObjectId(sellerId),
        listingId: new ObjectId(listingId),
        listingTitle: listing.title,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessage: message.trim(),
        lastMessageAt: new Date()
      };

      const conversationResult = await conversations.insertOne(newConversation);
      conversation = { _id: conversationResult.insertedId, ...newConversation };
    } else {
      // Update existing conversation
      await conversations.updateOne(
        { _id: conversation._id },
        {
          $set: {
            updatedAt: new Date(),
            lastMessage: message.trim(),
            lastMessageAt: new Date()
          }
        }
      );
    }

    // Save the message
    const messages = db.collection('messages');
    const newMessage = {
      conversation_id: conversation._id,
      sender_id: new ObjectId(buyerId),
      sender_type: senderType,
      message: message.trim(),
      created_at: new Date(),
      read_at: null
    };

    const messageResult = await messages.insertOne(newMessage);

    // Get sender name if not provided
    let finalSenderName = senderName;
    if (!finalSenderName) {
      const buyers = db.collection('buyers');
      const buyer = await buyers.findOne({ _id: new ObjectId(buyerId) });
      finalSenderName = buyer?.name || 'Anonymous';
    }

    // Create notification for the seller
    await NotificationService.createMessageNotification(
      sellerId,
      {
        id: buyerId,
        name: finalSenderName,
        message: message.length > 100 ? message.substring(0, 100) + '...' : message
      },
      {
        id: listingId,
        title: listing.title
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      data: {
        messageId: messageResult.insertedId.toString(),
        conversationId: conversation._id.toString(),
        timestamp: newMessage.created_at
      }
    });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}