import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth';
import clientPromise from '@/lib/mongo';
import { ObjectId } from 'mongodb';

export async function PUT(request) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { assignmentId, finalPrice } = body;

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
    }

    if (finalPrice === null || finalPrice === undefined || finalPrice < 0) {
      return NextResponse.json({ error: 'Valid final price is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');

    // Verify the assignment exists
    const assignment = await db.collection('assignments').findOne({
      _id: new ObjectId(assignmentId)
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Update the assignment with final price
    const result = await db.collection('assignments').updateOne(
      { _id: new ObjectId(assignmentId) },
      { 
        $set: { 
          finalPrice: parseFloat(finalPrice),
          updatedAt: new Date(),
          priceUpdatedBy: decoded.userId,
          priceUpdatedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Get the updated assignment
    const updatedAssignment = await db.collection('assignments').findOne({
      _id: new ObjectId(assignmentId)
    });

    console.log('✅ Assignment final price updated:', {
      assignmentId,
      adminId: decoded.userId,
      originalBudget: assignment.budget,
      finalPrice: parseFloat(finalPrice)
    });

    return NextResponse.json({ 
      success: true, 
      data: updatedAssignment,
      message: 'Assignment final price updated successfully' 
    });

  } catch (error) {
    console.error('PUT /api/admin/assignments/update-price error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
