// app/api/admin/admins/route.js
import { verifyToken } from '@/lib/auth';
import clientPromise from '@/lib/mongo';

// Verify admin token
function verifyAdminToken(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    // Check if user has admin role
    if (!decoded || decoded.role !== 'admin') {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('Admin token verification failed:', error);
    return null;
  }
}

// GET - Fetch all admins
export async function GET(request) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return Response.json({ 
        error: 'Unauthorized. Admin access required.' 
      }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');
    const adminsCollection = db.collection('admins');

    // Get all admins (excluding password)
    const admins = await adminsCollection
      .find({})
      .project({ password: 0 })
      .sort({ name: 1 })
      .toArray();

    return Response.json({
      success: true,
      data: {
        admins,
        total: admins.length
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching admins:', error);
    return Response.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
