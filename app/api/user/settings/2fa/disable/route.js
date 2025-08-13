import { verifyToken } from '../../../../../../lib/auth';
import clientPromise from '@/lib/mongo';
import { authenticator } from 'otplib';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return Response.json({ message: 'Invalid or expired token' }, { status: 401 });
    }

    const { password, token } = await request.json();

    if (!password) {
      return Response.json({ message: 'Password is required' }, { status: 400 });
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

    // Get user
    const user = await db.collection('sellers').findOne({ _id: userId });
    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return Response.json({ message: 'Incorrect password' }, { status: 400 });
    }

    // If 2FA is enabled, verify the 2FA token
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      if (!token) {
        return Response.json({ message: '2FA token is required' }, { status: 400 });
      }

      const isTokenValid = authenticator.verify({
        token,
        secret: user.twoFactorSecret
      });

      if (!isTokenValid) {
        return Response.json({ message: 'Invalid 2FA token' }, { status: 400 });
      }
    }

    // Disable 2FA
    await db.collection('sellers').updateOne(
      { _id: userId },
      { 
        $unset: {
          twoFactorSecret: 1,
          twoFactorTempSecret: 1
        },
        $set: {
          twoFactorEnabled: false,
          updatedAt: new Date()
        }
      }
    );

    return Response.json({
      success: true,
      message: '2FA disabled successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Error disabling 2FA:', error);
    return Response.json({
      success: false,
      message: 'Failed to disable 2FA'
    }, { status: 500 });
  }
}