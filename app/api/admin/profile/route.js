import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongo';
import { verifyAdminToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// GET current admin profile
export async function GET(request) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminId = decoded.adminId || decoded.userId;
    if (!adminId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');

    let objectId;
    try {
      objectId = new ObjectId(adminId);
    } catch (_) {
      return NextResponse.json({ error: 'Invalid admin id' }, { status: 400 });
    }

    const admin = await db.collection('admins').findOne(
      { _id: objectId },
      { projection: { password: 0 } }
    );

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: admin }, { status: 200 });
  } catch (error) {
    console.error('GET /api/admin/profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT update admin profile: name, phone
export async function PUT(request) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : undefined;
    const phone = typeof body.phone === 'string' ? body.phone.trim() : undefined;

    if (!name && !phone) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    if (name && name.length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 });
    }

    if (phone && !/^\+?[0-9\-()\s]{7,15}$/.test(phone)) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    const adminId = decoded.adminId || decoded.userId;
    const client = await clientPromise;
    const db = client.db('campusmart');

    let objectId;
    try {
      objectId = new ObjectId(adminId);
    } catch (_) {
      return NextResponse.json({ error: 'Invalid admin id' }, { status: 400 });
    }

    const update = { $set: { updatedAt: new Date() } };
    if (name !== undefined) update.$set.name = name;
    if (phone !== undefined) update.$set.phone = phone;

    // Use updateOne for broader driver compatibility, then fetch the updated doc
    const updateResult = await db.collection('admins').updateOne(
      { _id: objectId },
      update
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    const updated = await db.collection('admins').findOne(
      { _id: objectId },
      { projection: { password: 0 } }
    );

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error) {
    console.error('PUT /api/admin/profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


