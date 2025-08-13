import { verifyToken } from '../../../../../lib/auth';
import clientPromise from '@/lib/mongo';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';

export async function DELETE(request) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return Response.json({ message: 'Invalid or expired token' }, { status: 401 });
    }

    const { password } = await request.json();

    if (!password) {
      return Response.json({ message: 'Password is required for account deletion' }, { status: 400 });
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

    // Get user to verify password
    const user = await db.collection('sellers').findOne({ _id: userId });
    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return Response.json({ message: 'Incorrect password' }, { status: 400 });
    }

    // Start transaction for account deletion
    const session = client.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Delete user's listings
        await db.collection('listings').deleteMany({ sellerId: userId }, { session });
        
        // Delete user's messages
        await db.collection('messages').deleteMany({ 
          $or: [{ senderId: userId }, { receiverId: userId }] 
        }, { session });
        
        // Delete user's reviews
        await db.collection('reviews').deleteMany({ 
          $or: [{ reviewerId: userId }, { revieweeId: userId }] 
        }, { session });
        
        // Delete user's saved items
        await db.collection('savedItems').deleteMany({ userId: userId }, { session });
        
        // Delete user's chats
        await db.collection('chats').deleteMany({ 
          participants: { $in: [userId] } 
        }, { session });
        
        // Delete user's notifications
        await db.collection('notifications').deleteMany({ userId: userId }, { session });
        
        // Finally, delete the user account
        await db.collection('sellers').deleteOne({ _id: userId }, { session });
      });
      
      await session.endSession();

      return Response.json({
        success: true,
        message: 'Account deleted successfully'
      }, { status: 200 });

    } catch (transactionError) {
      await session.endSession();
      throw transactionError;
    }

  } catch (error) {
    console.error('Error deleting account:', error);
    return Response.json({
      success: false,
      message: 'Failed to delete account'
    }, { status: 500 });
  }
}
