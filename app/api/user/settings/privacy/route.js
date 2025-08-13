import { verifyToken } from '../../../../../lib/auth';
import clientPromise from '@/lib/mongo';
import { ObjectId } from 'mongodb';

export async function PUT(request) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return Response.json({ message: 'Invalid or expired token' }, { status: 401 });
    }

    const privacyData = await request.json();

    const client = await clientPromise;
    const db = client.db('campusmart');
    
    let userId = decoded.userId || decoded.sellerId || decoded.id || decoded.user_id;
    if (!userId) {
      return Response.json({ message: 'Invalid token: no user ID found' }, { status: 401 });
    }
    
    if (typeof userId === 'string' && ObjectId.isValid(userId)) {
      userId = new ObjectId(userId);
    }

    // Update privacy settings
    const result = await db.collection('sellers').updateOne(
      { _id: userId },
      { 
        $set: { 
          privacy: privacyData,
          updatedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }

    return Response.json({
      success: true,
      message: 'Privacy settings updated successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating privacy settings:', error);
    return Response.json({
      success: false,
      message: 'Failed to update privacy settings'
    }, { status: 500 });
  }
}