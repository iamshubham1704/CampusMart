import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongo';
import { verifyAdminToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// GET - Fetch all assignments for admin
export async function GET(request) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // Filter by status
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const skip = (page - 1) * limit;

    const client = await clientPromise;
    const db = client.db('campusmart');

    let filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Get total count for pagination
    const totalCount = await db.collection('assignments').countDocuments(filter);
    
    // Get assignments with pagination
    const assignments = await db.collection('assignments').find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Populate buyer details for each assignment
    const enhancedAssignments = await Promise.all(
      assignments.map(async (assignment) => {
        try {
          let buyer = await db.collection('buyers').findOne(
            { _id: new ObjectId(assignment.buyerId) },
            { projection: { name: 1, email: 1, phone: 1, college: 1, university: 1 } }
          );
          
          // If not found in buyers collection, try users collection as fallback
          if (!buyer) {
            buyer = await db.collection('users').findOne(
              { _id: new ObjectId(assignment.buyerId) },
              { projection: { name: 1, email: 1, phone: 1, college: 1, university: 1 } }
            );
          }
          
          return {
            ...assignment,
            buyer: buyer || {}
          };
        } catch (error) {
          console.error('Error populating buyer details:', error);
          return {
            ...assignment,
            buyer: {}
          };
        }
      })
    );

    return NextResponse.json({ 
      success: true, 
      data: enhancedAssignments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNextPage: page * limit < totalCount,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('GET /api/admin/assignments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update assignment status and assign admin
export async function PUT(request) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      assignmentId, 
      status, 
      tentativeDeliveryDate, 
      adminNotes 
    } = body;

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');

    let assignmentObjectId;
    try {
      assignmentObjectId = new ObjectId(assignmentId);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid assignment ID' }, { status: 400 });
    }

    // Get admin details
    const admin = await db.collection('admins').findOne(
      { _id: new ObjectId(decoded.adminId || decoded.userId) },
      { projection: { name: 1, email: 1 } }
    );

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Update the assignment
    const updateData = { 
      updatedAt: new Date(),
      adminId: new ObjectId(decoded.adminId || decoded.userId),
      adminName: admin.name
    };

    if (status) updateData.status = status;
    if (tentativeDeliveryDate) updateData.tentativeDeliveryDate = new Date(tentativeDeliveryDate);
    if (adminNotes) updateData.adminNotes = adminNotes;
    
    if (status === 'confirmed') {
      updateData.confirmedAt = new Date();
    }

    const result = await db.collection('assignments').updateOne(
      { _id: assignmentObjectId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Get updated assignment
    const updatedAssignment = await db.collection('assignments').findOne({ _id: assignmentObjectId });
    
    // Populate buyer details
    let buyer;
    try {
      buyer = await db.collection('buyers').findOne(
        { _id: new ObjectId(updatedAssignment.buyerId) },
        { projection: { name: 1, email: 1, phone: 1, college: 1, university: 1 } }
      );
      
      // If not found in buyers collection, try users collection as fallback
      if (!buyer) {
        buyer = await db.collection('users').findOne(
          { _id: new ObjectId(updatedAssignment.buyerId) },
          { projection: { name: 1, email: 1, phone: 1, college: 1, university: 1 } }
        );
      }
    } catch (error) {
      console.error('Error populating buyer details:', error);
      buyer = {};
    }

    const enhancedAssignment = {
      ...updatedAssignment,
      buyer: buyer || {}
    };

    console.log('✅ Assignment updated:', {
      assignmentId: assignmentObjectId.toString(),
      adminId: decoded.adminId || decoded.userId,
      status: status || 'updated',
      tentativeDeliveryDate: tentativeDeliveryDate || 'not set'
    });

    return NextResponse.json({ 
      success: true, 
      data: enhancedAssignment,
      message: 'Assignment updated successfully' 
    });

  } catch (error) {
    console.error('PUT /api/admin/assignments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete assignment (admin only)
export async function DELETE(request) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('id');

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');

    let assignmentObjectId;
    try {
      assignmentObjectId = new ObjectId(assignmentId);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid assignment ID' }, { status: 400 });
    }

    const result = await db.collection('assignments').deleteOne({
      _id: assignmentObjectId
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    console.log('✅ Assignment deleted:', {
      assignmentId: assignmentObjectId.toString(),
      adminId: decoded.adminId || decoded.userId
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Assignment deleted successfully' 
    });

  } catch (error) {
    console.error('DELETE /api/admin/assignments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

