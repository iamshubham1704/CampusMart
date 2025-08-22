// app/api/admin/users/route.js
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongo';
import { verifyAdminToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// GET - Fetch available users for team assignment
export async function GET(request) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const available = searchParams.get('available'); // 'true' to get users not yet assigned
    const type = searchParams.get('type'); // 'seller' or 'buyer'
    const search = searchParams.get('search'); // Search by name or email

    const client = await clientPromise;
    const db = client.db('campusmart');

    let filter = {};
    
    // Filter by user type if specified
    if (type) {
      filter.role = type;
    }

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { college: { $regex: search, $options: 'i' } }
      ];
    }

    // If available=true, exclude users already assigned to any admin team
    if (available === 'true') {
      const assignedUserIds = await db.collection('admin_team_assignments')
        .find({ status: 'active' })
        .project({ userId: 1 })
        .toArray();
      
      if (assignedUserIds.length > 0) {
        const assignedIds = assignedUserIds.map(a => a.userId);
        filter._id = { $nin: assignedIds };
      }
    }

    // Get users with basic info (include only necessary fields)
    const users = await db.collection('users')
      .find(filter, {
        projection: {
          _id: 1,
          name: 1,
          email: 1,
          phone: 1,
          college: 1,
          role: 1,
          createdAt: 1
        }
      })
      .sort({ createdAt: -1 })
      .limit(100) // Limit results for performance
      .toArray();

    // Add assignment status for each user
    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        const assignment = await db.collection('admin_team_assignments').findOne({
          userId: user._id,
          status: 'active'
        });

        return {
          ...user,
          isAssigned: !!assignment,
          assignedAdminId: assignment?.assignedAdminId || null,
          assignmentStatus: assignment?.status || null
        };
      })
    );

    return NextResponse.json({ 
      success: true, 
      data: usersWithStatus,
      total: usersWithStatus.length
    }, { status: 200 });
  } catch (error) {
    console.error('GET /api/admin/users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update user status (ban/unban)
export async function PUT(request) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return Response.json({ 
        error: 'Unauthorized. Admin access required.' 
      }, { status: 401 });
    }

    const { userId, userType, isActive } = await request.json();

    if (!userId || !userType || typeof isActive !== 'boolean') {
      return Response.json({ 
        error: 'Missing required fields: userId, userType, isActive' 
      }, { status: 400 });
    }

    if (!['buyer', 'seller'].includes(userType)) {
      return Response.json({ 
        error: 'Invalid userType. Must be buyer or seller' 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');

    let objectId;
    try {
      objectId = new ObjectId(userId);
    } catch (error) {
      return Response.json({ 
        error: 'Invalid userId format' 
      }, { status: 400 });
    }

    const collection = userType === 'buyer' ? 'buyers' : 'sellers';
    
    // Update user status
    const result = await db.collection(collection).updateOne(
      { _id: objectId },
      { 
        $set: { 
          isActive: isActive,
          updatedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return Response.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Get updated user data
    const updatedUser = await db.collection(collection).findOne(
      { _id: objectId },
      { projection: { password: 0 } }
    );

    return Response.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'banned'} successfully`,
      data: {
        ...updatedUser,
        userType
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating user status:', error);
    return Response.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}