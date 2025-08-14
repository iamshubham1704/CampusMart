import { verifyToken } from '../../../../lib/auth';
import clientPromise from '@/lib/mongo';
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return Response.json({ message: 'Invalid or expired token' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');
    
    let userId = decoded.userId || decoded.sellerId || decoded.id || decoded.user_id;
    if (!userId) {
      return Response.json({ message: 'Invalid token: no user ID found' }, { status: 401 });
    }
    
    if (typeof userId === 'string' && ObjectId.isValid(userId)) {
      userId = new ObjectId(userId);
    }

    // Get user settings
    const user = await db.collection('sellers').findOne(
      { _id: userId },
      { 
        projection: { 
          settings: 1,
          notifications: 1,
          privacy: 1,
          security: 1
        } 
      }
    );

    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }

    // Default settings if not found
    const defaultSettings = {
      notifications: {
        emailNotifications: true,
        pushNotifications: true,
        messageNotifications: true,
        listingNotifications: true,
        marketingEmails: false,
        weeklyDigest: true,
        instantMessages: true,
        priceAlerts: true
      },
      privacy: {
        profileVisibility: 'public',
        showEmail: false,
        showPhone: false,
        showLastSeen: true,
        allowSearchEngines: true,
        dataCollection: true
      },
      security: {
        twoFactorEnabled: false,
        loginAlerts: true,
        sessionTimeout: '24h'
      }
    };

    const settings = {
      notifications: { ...defaultSettings.notifications, ...(user.notifications || {}) },
      privacy: { ...defaultSettings.privacy, ...(user.privacy || {}) },
      security: { ...defaultSettings.security, ...(user.security || {}) }
    };

    return Response.json({
      success: true,
      data: settings
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching settings:', error);
    return Response.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}