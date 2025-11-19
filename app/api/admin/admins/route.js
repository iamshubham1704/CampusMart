// app/api/admin/admins/route.js
import { verifyToken, verifyAdminToken } from '@/lib/auth';
import clientPromise from '@/lib/mongo';
import { NextResponse } from 'next/server';

// GET - Fetch all admins
export async function GET(request) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return NextResponse.json({ 
        success: false,
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

    return NextResponse.json({
      success: true,
      data: {
        admins,
        total: admins.length
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching admins:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
