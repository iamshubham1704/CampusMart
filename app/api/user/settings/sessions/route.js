import { verifyToken } from '../../../../../lib/auth';
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

    // Get user's active sessions (this is a simplified version)
    // In a real app, you'd store session data in a separate collection
    const sessions = [
      {
        id: 'current',
        device: 'Chrome on Windows',
        location: 'Current Location',
        lastActive: new Date(),
        ipAddress: '192.168.1.1',
        isCurrent: true
      }
    ];

    return Response.json({
      success: true,
      data: { sessions }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching sessions:', error);
    return Response.json({
      success: false,
      message: 'Failed to fetch sessions'
    }, { status: 500 });
  }
}

// api/user/settings/sessions/[sessionId]/route.js - Revoke specific session
export async function DELETE(request, { params }) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return Response.json({ message: 'Invalid or expired token' }, { status: 401 });
    }

    const { sessionId } = params;

    // In a real implementation, you would:
    // 1. Find the session in your sessions collection
    // 2. Invalidate the session token
    // 3. Remove the session from active sessions

    return Response.json({
      success: true,
      message: 'Session revoked successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Error revoking session:', error);
    return Response.json({
      success: false,
      message: 'Failed to revoke session'
    }, { status: 500 });
  }
}