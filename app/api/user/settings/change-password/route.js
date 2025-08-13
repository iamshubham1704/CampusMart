import { verifyToken } from '../../../../../lib/auth';
import clientPromise from '@/lib/mongo';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';

export async function PUT(request) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return Response.json({ message: 'Invalid or expired token' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return Response.json({ 
        message: 'Current password and new password are required' 
      }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return Response.json({ 
        message: 'New password must be at least 6 characters long' 
      }, { status: 400 });
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

    // Get user with current password
    const user = await db.collection('sellers').findOne({ _id: userId });
    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return Response.json({ message: 'Current password is incorrect' }, { status: 400 });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    const result = await db.collection('sellers').updateOne(
      { _id: userId },
      { 
        $set: { 
          password: hashedNewPassword,
          updatedAt: new Date(),
          passwordChangedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return Response.json({ message: 'Failed to update password' }, { status: 500 });
    }

    return Response.json({
      success: true,
      message: 'Password changed successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Error changing password:', error);
    return Response.json({
      success: false,
      message: 'Failed to change password'
    }, { status: 500 });
  }
}