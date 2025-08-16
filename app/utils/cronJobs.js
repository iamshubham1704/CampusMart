import cron from 'node-cron';
import { NotificationService } from './notificationService';
import clientPromise from '../lib/mongo';

// Check for trending products daily at 9 AM
cron.schedule('0 9 * * *', async () => {
  try {
    console.log('Running trending products notification job...');

    const client = await clientPromise;
    const db = client.db('campusmarket');
    
    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Find top viewed products by category
    const trendingProducts = await db.collection('views').aggregate([
      {
        $match: {
          date: yesterdayStr
        }
      },
      {
        $group: {
          _id: '$listingId',
          viewCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'listings',
          localField: '_id',
          foreignField: '_id',
          as: 'listing'
        }
      },
      {
        $unwind: '$listing'
      },
      {
        $group: {
          _id: '$listing.category',
          products: {
            $push: {
              listingId: '$_id',
              viewCount: '$viewCount',
              sellerId: '$listing.sellerId',
              title: '$listing.title'
            }
          }
        }
      },
      {
        $project: {
          category: '$_id',
          topProducts: {
            $slice: [
              {
                $sortArray: {
                  input: '$products',
                  sortBy: { viewCount: -1 }
                }
              },
              3 // Top 3 per category
            ]
          }
        }
      }
    ]).toArray();

    // Send trending notifications
    for (const categoryData of trendingProducts) {
      for (let i = 0; i < categoryData.topProducts.length; i++) {
        const product = categoryData.topProducts[i];
        
        if (product.viewCount >= 20) { // Minimum threshold for trending
          await NotificationService.createTrendingNotification(
            product.sellerId,
            {
              id: product.listingId,
              title: product.title
            },
            categoryData.category,
            i + 1 // Rank
          );
        }
      }
    }

    console.log(`Sent trending notifications for ${trendingProducts.length} categories`);

  } catch (error) {
    console.error('Error in trending products job:', error);
  }
});

// Send profile completion reminders weekly
cron.schedule('0 10 * * 1', async () => { // Monday 10 AM
  try {
    console.log('Running profile completion reminder job...');

    const client = await clientPromise;
    const db = client.db('campusmarket');
    const users = db.collection('users');

    // Find users with incomplete profiles
    const incompleteProfiles = await users.find({
      $or: [
        { profileImage: { $exists: false } },
        { bio: { $exists: false } },
        { college: { $exists: false } },
        { phone: { $exists: false } }
      ]
    }).toArray();

    // Send reminders
    for (const user of incompleteProfiles) {
      const missingFields = [];
      if (!user.profileImage) missingFields.push('profile picture');
      if (!user.bio) missingFields.push('bio');
      if (!user.college) missingFields.push('college');
      if (!user.phone) missingFields.push('phone number');

      const completionPercentage = Math.round(((4 - missingFields.length) / 4) * 100);

      await NotificationService.createSystemNotification(
        user._id,
        'Complete your profile',
        `Your profile is ${completionPercentage}% complete. Add ${missingFields.join(', ')} to build trust with buyers.`,
        '/seller-dashboard/settings'
      );
    }

    console.log(`Sent profile completion reminders to ${incompleteProfiles.length} users`);

  } catch (error) {
    console.error('Error in profile completion job:', error);
  }
});

// Clean up old notifications monthly
cron.schedule('0 2 1 * *', async () => { // 1st of month at 2 AM
  try {
    console.log('Running notification cleanup job...');

    const client = await clientPromise;
    const db = client.db('campusmarket');
    const notifications = db.collection('notifications');

    // Delete notifications older than 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const result = await notifications.deleteMany({
      createdAt: { $lt: threeMonthsAgo }
    });

    console.log(`Cleaned up ${result.deletedCount} old notifications`);

  } catch (error) {
    console.error('Error in cleanup job:', error);
  }
});