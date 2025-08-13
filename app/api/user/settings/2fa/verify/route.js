import { verifyToken } from '../../../../../../lib/auth';
import clientPromise from '@/lib/mongo';
import { authenticator } from 'otplib';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return Response.json({ message: 'Invalid or expired token' }, { status: 401 });
    }

    const { token } = await request.json();

    if (!token) {
      return Response.json({ message: 'Verification token is required' }, { status: 400 });
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

    // Get user with temp secret
    const user = await db.collection('sellers').findOne({ _id: userId });
    if (!user || !user.twoFactorTempSecret) {
      return Response.json({ message: 'No 2FA setup in progress' }, { status: 400 });
    }

    // Verify token
    const isValid = authenticator.verify({
      token,
      secret: user.twoFactorTempSecret
    });

    if (!isValid) {
      return Response.json({ message: 'Invalid verification token' }, { status: 400 });
    }

    // Enable 2FA and move temp secret to permanent
    await db.collection('sellers').updateOne(
      { _id: userId },
      { 
        $set: { 
          twoFactorSecret: user.twoFactorTempSecret,
          twoFactorEnabled: true,
          updatedAt: new Date()
        },
        $unset: {
          twoFactorTempSecret: 1
        }
      }
    );

    return Response.json({
      success: true,
      message: '2FA enabled successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Error verifying 2FA:', error);
    return Response.json({
      success: false,
      message: 'Failed to verify 2FA'
    }, { status: 500 });
  }
}