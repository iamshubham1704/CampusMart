// app/api/alpha/assignments/route.js
import { verifyToken } from '@/lib/auth';
import clientPromise from '@/lib/mongo';
import { ObjectId } from 'mongodb';

/**
 * Verify Alpha token (like verifyAdminToken but for alpha role)
 */
function verifyAlphaToken(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== 'alpha') {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('Alpha token verification failed:', error);
    return null;
  }
}

/**
 * POST - Get assignments for an alpha
 * Expects body: { alphaName }
 */
export async function POST(request) {
  try {
    const decoded = verifyAlphaToken(request);
    if (!decoded) {
      return Response.json(
        { error: 'Unauthorized. Alpha access required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { alphaName } = body;

    if (!alphaName) {
      return Response.json(
        { error: 'Missing required field: alphaName' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('campusmart'); // replace with your DB name

    // ✅ Find the alpha
    const alpha = await db.collection('alphas').findOne({ name: alphaName });
    if (!alpha) {
      return Response.json({ error: 'Alpha not found' }, { status: 404 });
    }

    // ✅ Fetch assignments assigned to this alpha
    const assignments = await db.collection('assignments')
      .aggregate([
        { $match: { assignedTo: alpha._id } },
        {
          $lookup: {
            from: 'buyers',
            localField: 'buyerId',
            foreignField: '_id',
            as: 'buyer'
          }
        },
        {
          $lookup: {
            from: 'admins',
            localField: 'adminId',
            foreignField: '_id',
            as: 'admin'
          }
        },
        {
          $lookup: {
            from: 'admins',
            localField: 'assignedToAdmin',
            foreignField: '_id',
            as: 'assignedAdmin'
          }
        },
        {
          $project: {
            _id: 1,
            title: 1,
            description: 1,
            type: 1,
            subject: 1,
            deadline: 1,
            budget: 1,
            buyerPrice: 1,
            alphaPrice: 1,
            location: 1,
            additionalRequirements: 1,
            pdfUrl: 1,
            status: 1,
            buyerName: { $arrayElemAt: ['$buyer.name', 0] },
            buyerRole: { $arrayElemAt: ['$buyer.role', 0] },
            assignedBy: { $arrayElemAt: ['$admin.name', 0] },
            assignedByEmail: { $arrayElemAt: ['$admin.email', 0] },
            assignedByPhone: { $arrayElemAt: ['$admin.phone', 0] }, // <-- ✅ Added phone
            assignedAdminName: { $arrayElemAt: ['$assignedAdmin.name', 0] },
            assignedAdminEmail: { $arrayElemAt: ['$assignedAdmin.email', 0] },
            createdAt: 1,
            updatedAt: 1,
          }
        },
        { $sort: { createdAt: -1 } }
      ])
      .toArray();

    return Response.json(
      {
        success: true,
        alpha: {
          id: alpha._id,
          name: alpha.name,
          email: alpha.email,
          role: alpha.role,
        },
        assignments
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('Error fetching alpha assignments:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
