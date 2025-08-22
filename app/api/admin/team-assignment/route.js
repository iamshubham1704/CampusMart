import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongo';
import { verifyAdminToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// GET - Fetch team assignments for the logged-in admin
export async function GET(request) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminId = decoded.adminId || decoded.userId;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'sellers', 'buyers', or 'all'

    const client = await clientPromise;
    const db = client.db('campusmart');

    let filter = { assignedAdminId: new ObjectId(adminId) };
    
    if (type === 'sellers') {
      filter.userType = 'seller';
    } else if (type === 'buyers') {
      filter.userType = 'buyer';
    }

    const teamAssignments = await db.collection('admin_team_assignments').find(filter).toArray();

    // Get user details for each assignment
    const enhancedAssignments = await Promise.all(
      teamAssignments.map(async (assignment) => {
        let userDetails = null;
        
        if (assignment.userType === 'seller') {
          userDetails = await db.collection('users').findOne(
            { _id: assignment.userId },
            { projection: { name: 1, email: 1, phone: 1, college: 1, password: 0 } }
          );
        } else if (assignment.userType === 'buyer') {
          userDetails = await db.collection('users').findOne(
            { _id: assignment.userId },
            { projection: { name: 1, email: 1, phone: 1, college: 1, password: 0 } }
          );
        }

        return {
          ...assignment,
          user: userDetails
        };
      })
    );

    return NextResponse.json({ 
      success: true, 
      data: enhancedAssignments 
    }, { status: 200 });
  } catch (error) {
    console.error('GET /api/admin/team-assignment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Assign users to admin team
export async function POST(request) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminId = decoded.adminId || decoded.userId;
    const body = await request.json();
    const { userId, userType, notes } = body;

    if (!userId || !userType) {
      return NextResponse.json({ 
        error: 'User ID and user type are required' 
      }, { status: 400 });
    }

    if (!['seller', 'buyer'].includes(userType)) {
      return NextResponse.json({ 
        error: 'User type must be either "seller" or "buyer"' 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');

    // Validate user exists
    let userObjectId;
    try {
      userObjectId = new ObjectId(userId);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const user = await db.collection('users').findOne({ _id: userObjectId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is already assigned to an admin
    const existingAssignment = await db.collection('admin_team_assignments').findOne({
      userId: userObjectId,
      userType
    });

    if (existingAssignment) {
      return NextResponse.json({ 
        error: `User is already assigned to admin: ${existingAssignment.assignedAdminId}` 
      }, { status: 409 });
    }

    // Create team assignment
    const newAssignment = {
      userId: userObjectId,
      userType,
      assignedAdminId: new ObjectId(adminId),
      assignedAt: new Date(),
      notes: notes || '',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('admin_team_assignments').insertOne(newAssignment);
    newAssignment._id = result.insertedId;

    console.log('✅ User assigned to admin team:', {
      userId: userObjectId.toString(),
      userType,
      adminId,
      userName: user.name || user.email
    });

    return NextResponse.json({ 
      success: true, 
      data: newAssignment,
      message: `User ${user.name || user.email} assigned to your team successfully`
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/team-assignment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update team assignment
export async function PUT(request) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminId = decoded.adminId || decoded.userId;
    const body = await request.json();
    const { assignmentId, notes, status } = body;

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

    // Verify the assignment belongs to this admin
    const assignment = await db.collection('admin_team_assignments').findOne({
      _id: assignmentObjectId,
      assignedAdminId: new ObjectId(adminId)
    });

    if (!assignment) {
      return NextResponse.json({ 
        error: 'Assignment not found or access denied' 
      }, { status: 404 });
    }

    // Update the assignment
    const updateData = { updatedAt: new Date() };
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;

    const result = await db.collection('admin_team_assignments').updateOne(
      { _id: assignmentObjectId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Team assignment updated successfully' 
    }, { status: 200 });
  } catch (error) {
    console.error('PUT /api/admin/team-assignment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove user from admin team
export async function DELETE(request) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminId = decoded.adminId || decoded.userId;
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

    // Verify the assignment belongs to this admin
    const assignment = await db.collection('admin_team_assignments').findOne({
      _id: assignmentObjectId,
      assignedAdminId: new ObjectId(adminId)
    });

    if (!assignment) {
      return NextResponse.json({ 
        error: 'Assignment not found or access denied' 
      }, { status: 404 });
    }

    // Delete the assignment
    const result = await db.collection('admin_team_assignments').deleteOne({
      _id: assignmentObjectId
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    console.log('✅ User removed from admin team:', {
      assignmentId: assignmentObjectId.toString(),
      adminId,
      userType: assignment.userType
    });

    return NextResponse.json({ 
      success: true, 
      message: 'User removed from team successfully' 
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE /api/admin/team-assignment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
