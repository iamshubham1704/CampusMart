import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongo';
import { verifyAdminToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function PUT(request, { params }) {
  try {
    // Verify admin token
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { status } = await request.json();

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');

    // Update delivery status
    const result = await db.collection('deliveries').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: status,
          updatedAt: new Date(),
          adminId: decoded.userId
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 });
    }

    // Note: We don't need to update currentSlots here because it's calculated dynamically
    // when fetching schedules. The slot count is based on the actual number of deliveries
    // in the deliveries collection, not a stored count.

    return NextResponse.json({ 
      success: true, 
      message: `Delivery status updated to ${status}` 
    });

  } catch (error) {
    console.error('Error updating delivery status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
