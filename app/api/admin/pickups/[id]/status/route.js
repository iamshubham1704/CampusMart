import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongo';
import { verifyAdminToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// PUT - Update pickup status by ID
export async function PUT(request, { params }) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
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
        error: 'Invalid status' 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');

    let objectId;
    try {
      objectId = new ObjectId(id);
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

    const update = { 
      $set: { 
        status, 
        updatedAt: new Date() 
      } 
    };
    
    if (adminNotes) {
      update.$set.adminNotes = adminNotes;
    }

    const result = await db.collection('pickups').updateOne(
      { _id: objectId },
      update
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Pickup not found' }, { status: 404 });
    }

    const updatedPickup = await db.collection('pickups').findOne({ _id: objectId });

    return NextResponse.json({ 
      success: true, 
      data: updatedPickup 
    }, { status: 200 });
  } catch (error) {
    console.error('PUT /api/admin/pickups/[id]/status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
