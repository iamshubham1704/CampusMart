import { verifyToken } from '../../../../../../lib/auth';
import clientPromise from '@/lib/mongo';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { ObjectId } from 'mongodb';

export async function POST(request) {
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

    // Get user
    const user = await db.collection('sellers').findOne({ _id: userId });
    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }

    // Generate secret
    const secret = authenticator.generateSecret();
    
    // Create service name and account name for QR code
    const serviceName = 'CampusMarket';
    const accountName = user.email;
    
    // Generate otpauth URL
    const otpUrl = authenticator.keyuri(accountName, serviceName, secret);
    
    // Generate QR code
    const qrCode = await QRCode.toDataURL(otpUrl);
    
    // Store temp secret (don't enable 2FA until verified)
    await db.collection('sellers').updateOne(
      { _id: userId },
      { 
        $set: { 
          twoFactorTempSecret: secret,
          updatedAt: new Date()
        } 
      }
    );

    return Response.json({
      success: true,
      data: {
        secret,
        qrCode,
        backupCodes: [] // Generate backup codes in real implementation
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error setting up 2FA:', error);
    return Response.json({
      success: false,
      message: 'Failed to setup 2FA'
    }, { status: 500 });
  }
}