import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import clientPromise from '@/lib/mongo';

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }

    const sellerId = decoded.sellerId || decoded.userId || decoded.id;

    // Connect using your existing clientPromise
    const client = await clientPromise;
    const db = client.db();

    // Get recent activities from the last 7 days
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activities = [];

    // Get recent listings
    const recentListings = await db.collection('listings')
      .find({
        sellerId,
        createdAt: { $gte: weekAgo }
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .project({ title: 1, createdAt: 1 }) // equivalent to .select() in Mongoose
      .toArray();

    recentListings.forEach(listing => {
      activities.push({
        type: 'listing',
        title: 'New listing created',
        subtitle: `${listing.title} posted successfully`,
        time: getTimeAgo(listing.createdAt),
        createdAt: listing.createdAt
      });
    });

    // Get recent chats
    const recentChats = await db.collection('chats')
      .find({
        $or: [{ sellerId }, { buyerId: sellerId }],
        updatedAt: { $gte: weekAgo }
      })
      .sort({ updatedAt: -1 })
      .limit(5)
      .toArray();

    // For each chat, try to get listing info
    for (const chat of recentChats) {
      let listingTitle = 'Item';
      if (chat.listingId) {
        const listing = await db.collection('listings')
          .findOne({ _id: chat.listingId }, { projection: { title: 1 } });
        listingTitle = listing?.title || 'Item';
      }
      
      activities.push({
        type: 'message',
        title: 'New message',
        subtitle: `Message about ${listingTitle}`,
        time: getTimeAgo(chat.updatedAt),
        createdAt: chat.updatedAt
      });
    }

    // Get recent reviews
    const recentReviews = await db.collection('reviews')
      .find({
        sellerId,
        createdAt: { $gte: weekAgo }
      })
      .sort({ createdAt: -1 })
      .limit(3)
      .toArray();

    // For each review, try to get listing info
    for (const review of recentReviews) {
      let listingTitle = '';
      if (review.listingId) {
        const listing = await db.collection('listings')
          .findOne({ _id: review.listingId }, { projection: { title: 1 } });
        listingTitle = listing?.title ? ` for ${listing.title}` : '';
      }
      
      activities.push({
        type: 'review',
        title: 'New review received',
        subtitle: `${review.rating} stars${listingTitle}`,
        time: getTimeAgo(review.createdAt),
        createdAt: review.createdAt
      });
    }

    // Get recent views (based on recently updated listings with views > 0)
    const recentlyViewedListings = await db.collection('listings')
      .find({
        sellerId,
        updatedAt: { $gte: weekAgo },
        views: { $gt: 0 }
      })
      .sort({ updatedAt: -1 })
      .limit(3)
      .project({ title: 1, views: 1, updatedAt: 1 })
      .toArray();

    recentlyViewedListings.forEach(listing => {
      activities.push({
        type: 'view',
        title: 'Item viewed',
        subtitle: `Someone viewed ${listing.title}`,
        time: getTimeAgo(listing.updatedAt),
        createdAt: listing.updatedAt
      });
    });

    // Sort all activities by creation time and limit to 10 most recent
    const sortedActivities = activities
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
      .map(activity => ({
        type: activity.type,
        title: activity.title,
        subtitle: activity.subtitle,
        time: activity.time
      }));

    return NextResponse.json({
      success: true,
      activities: sortedActivities
    });

  } catch (error) {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to format time ago
function getTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
}