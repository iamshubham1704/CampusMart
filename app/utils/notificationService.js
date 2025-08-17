// app/utils/notificationService.js
import clientPromise from '../../lib/mongo';
import { ObjectId } from 'mongodb';

export class NotificationService {
  // Create a like notification
  static async createLikeNotification(sellerId, listing, totalLikes) {
    try {
      const client = await clientPromise;
      const db = client.db('campusmart');
      const notifications = db.collection('notifications');

      const notification = {
        userId: new ObjectId(sellerId),
        type: 'like',
        title: 'Your listing received likes!',
        message: `Your listing "${listing.title}" has reached ${totalLikes} likes!`,
        data: {
          listingId: listing.id,
          listingTitle: listing.title,
          totalLikes: totalLikes
        },
        read: false,
        createdAt: new Date()
      };

      await notifications.insertOne(notification);
      console.log('✅ Like notification created for seller:', sellerId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error creating like notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Create a view notification
  static async createViewNotification(sellerId, listing, viewCount) {
    try {
      const client = await clientPromise;
      const db = client.db('campusmart');
      const notifications = db.collection('notifications');

      const notification = {
        userId: new ObjectId(sellerId),
        type: 'view',
        title: 'Listing milestone reached!',
        message: `Your listing "${listing.title}" has received ${viewCount} views today!`,
        data: {
          listingId: listing.id,
          listingTitle: listing.title,
          viewCount: viewCount
        },
        read: false,
        createdAt: new Date()
      };

      await notifications.insertOne(notification);
      console.log('✅ View notification created for seller:', sellerId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error creating view notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Create a message notification
  static async createMessageNotification(sellerId, buyer, listing) {
    try {
      const client = await clientPromise;
      const db = client.db('campusmart');
      const notifications = db.collection('notifications');

      const notification = {
        userId: new ObjectId(sellerId),
        type: 'message',
        title: 'New message received!',
        message: `${buyer.name} sent you a message about "${listing.title}"`,
        data: {
          buyerId: buyer.id,
          buyerName: buyer.name,
          listingId: listing.id,
          listingTitle: listing.title,
          messagePreview: buyer.message
        },
        read: false,
        createdAt: new Date()
      };

      await notifications.insertOne(notification);
      console.log('✅ Message notification created for seller:', sellerId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error creating message notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Create a review notification
  static async createReviewNotification(sellerId, reviewer, listing, rating) {
    try {
      const client = await clientPromise;
      const db = client.db('campusmart');
      const notifications = db.collection('notifications');

      const notification = {
        userId: new ObjectId(sellerId),
        type: 'review',
        title: 'New review received!',
        message: `${reviewer.name} left you a ${rating}-star review for "${listing.title}"`,
        data: {
          reviewerId: reviewer.id,
          reviewerName: reviewer.name,
          listingId: listing.id,
          listingTitle: listing.title,
          rating: rating
        },
        read: false,
        createdAt: new Date()
      };

      await notifications.insertOne(notification);
      console.log('✅ Review notification created for seller:', sellerId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error creating review notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Get notifications for a user
  static async getNotifications(userId, page = 1, limit = 20) {
    try {
      const client = await clientPromise;
      const db = client.db('campusmart');
      const notifications = db.collection('notifications');

      const skip = (page - 1) * limit;

      const [notificationsList, totalCount] = await Promise.all([
        notifications
          .find({ userId: new ObjectId(userId) })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .toArray(),
        notifications.countDocuments({ userId: new ObjectId(userId) })
      ]);

      return {
        success: true,
        notifications: notificationsList,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      };
    } catch (error) {
      console.error('❌ Error getting notifications:', error);
      return { success: false, error: error.message };
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId) {
    try {
      const client = await clientPromise;
      const db = client.db('campusmart');
      const notifications = db.collection('notifications');

      await notifications.updateOne(
        { _id: new ObjectId(notificationId) },
        { $set: { read: true, readAt: new Date() } }
      );

      return { success: true };
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      return { success: false, error: error.message };
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId) {
    try {
      const client = await clientPromise;
      const db = client.db('campusmart');
      const notifications = db.collection('notifications');

      await notifications.updateMany(
        { userId: new ObjectId(userId), read: false },
        { $set: { read: true, readAt: new Date() } }
      );

      return { success: true };
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
      return { success: false, error: error.message };
    }
  }

  // Get unread notification count
  static async getUnreadCount(userId) {
    try {
      const client = await clientPromise;
      const db = client.db('campusmart');
      const notifications = db.collection('notifications');

      const count = await notifications.countDocuments({
        userId: new ObjectId(userId),
        read: false
      });

      return { success: true, count };
    } catch (error) {
      console.error('❌ Error getting unread count:', error);
      return { success: false, count: 0, error: error.message };
    }
  }

  // Delete notification
  static async deleteNotification(notificationId) {
    try {
      const client = await clientPromise;
      const db = client.db('campusmart');
      const notifications = db.collection('notifications');

      const result = await notifications.deleteOne({
        _id: new ObjectId(notificationId)
      });

      if (result.deletedCount === 0) {
        return { success: false, error: 'Notification not found' };
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Clear all notifications for a user
  static async clearAllNotifications(userId) {
    try {
      const client = await clientPromise;
      const db = client.db('campusmart');
      const notifications = db.collection('notifications');

      await notifications.deleteMany({
        userId: new ObjectId(userId)
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Error clearing all notifications:', error);
      return { success: false, error: error.message };
    }
  }
}

// Default export for backward compatibility
export default NotificationService;