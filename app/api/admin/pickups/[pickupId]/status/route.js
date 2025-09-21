import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongo';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// PUT - Update pickup status
export async function PUT(request, { params }) {
  try {
    const { pickupId } = params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !['admin', 'buyer'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Admin or buyer access required' }, { status: 403 });
    }

    const body = await request.json();
    const { status, adminNotes } = body;

    if (!status) {
      return NextResponse.json({ 
        error: 'Status is required' 
      }, { status: 400 });
    }

    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status. Must be one of: pending, confirmed, in_progress, completed, cancelled' 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');

    // Validate pickup ID
    let objectId;
    try {
      objectId = new ObjectId(pickupId);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid pickup ID' }, { status: 400 });
    }

    // Check if pickup exists
    const existingPickup = await db.collection('pickups').findOne({
      _id: objectId
    });

    if (!existingPickup) {
      return NextResponse.json({ 
        error: 'Pickup not found' 
      }, { status: 404 });
    }

    // Check access permissions
    const hasAccess = 
      (decoded.role === 'admin') || 
      (decoded.role === 'buyer' && existingPickup.buyerId.toString() === (decoded.buyerId || decoded.userId || decoded.id).toString());

    if (!hasAccess) {
      return NextResponse.json({ 
        error: 'Access denied' 
      }, { status: 403 });
    }

    // Update pickup status
    const updateData = {
      status,
      updatedAt: new Date()
    };

    if (adminNotes && decoded.role === 'admin') {
      updateData.adminNotes = adminNotes;
    }

    const result = await db.collection('pickups').updateOne(
      { _id: objectId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        error: 'Pickup not found' 
      }, { status: 404 });
    }

    // Fetch updated pickup with populated data
    const updatedPickup = await db.collection('pickups').aggregate([
      { $match: { _id: objectId } },
      { $lookup: { from: 'listings', localField: 'productId', foreignField: '_id', as: 'product' } },
      { $lookup: { from: 'admin_schedules', localField: 'adminScheduleId', foreignField: '_id', as: 'adminSchedule' } },
      { $lookup: { from: 'deliveries', localField: 'deliveryId', foreignField: '_id', as: 'delivery' } },
      { $lookup: { from: 'users', localField: 'buyerId', foreignField: '_id', as: 'buyer' } },
      { $addFields: {
        product: { $arrayElemAt: ['$product', 0] },
        adminSchedule: { $arrayElemAt: ['$adminSchedule', 0] },
        delivery: { $arrayElemAt: ['$delivery', 0] },
        buyer: { $arrayElemAt: ['$buyer', 0] }
      } }
    ]).toArray();

    console.log('✅ Pickup status updated:', {
      pickupId,
      status,
      updatedBy: decoded.role,
      updatedAt: new Date()
    });

    return NextResponse.json({ 
      success: true, 
      data: updatedPickup[0],
      message: 'Pickup status updated successfully' 
    }, { status: 200 });

  } catch (error) {
    console.error('PUT /api/admin/pickups/[pickupId]/status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
