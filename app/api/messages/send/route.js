import { NextResponse } from 'next/server';
import { NotificationService } from '../../../../utils/notificationService';
import clientPromise from '../../../../lib/mongo';

export async function POST(request) {
  try {
    const body = await request.json();
    const { sellerId, buyerId, listingId, message, senderName } = body;

    // Send the message (your existing logic here)
    // ... message sending logic ...

    // Get listing details for notification
    const client = await clientPromise;
    const db = client.db('campusmarket');
    const listings = db.collection('listings');
    const listing = await listings.findOne({ _id: new ObjectId(listingId) });

    // Create notification for the seller
    if (listing) {
      await NotificationService.createMessageNotification(
        sellerId,
        {
          id: buyerId,
          name: senderName,
          message: message.substring(0, 100) + (message.length > 100 ? '...' : '')
        },
        {
          id: listingId,
          title: listing.title
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}