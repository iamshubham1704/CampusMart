import clientPromise from '@/lib/mongo';
import { verifyAdminToken } from '@/lib/auth';

// GET: Fetch global admin settings (commission, etc.)
export async function GET(request) {
  try {
    const admin = verifyAdminToken(request);
    if (!admin) {
      return Response.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');

    const settingsDoc = await db.collection('settings').findOne({ _id: 'global_settings' });

    return Response.json({
      success: true,
      data: {
        commissionPercent: settingsDoc?.commissionPercent ?? 10
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update global commission percent
export async function PUT(request) {
  try {
    const admin = verifyAdminToken(request);
    if (!admin) {
      return Response.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const { commissionPercent } = await request.json();

    const parsed = parseFloat(commissionPercent);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
      return Response.json({ error: 'commissionPercent must be a number between 0 and 100' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');

    await db.collection('settings').updateOne(
      { _id: 'global_settings' },
      {
        $set: {
          commissionPercent: parsed,
          updatedAt: new Date(),
          updatedBy: admin.adminId || admin.userId || null
        }
      },
      { upsert: true }
    );

    return Response.json({ success: true, message: 'Settings updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating admin settings:', error);
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}


