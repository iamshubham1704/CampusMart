import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongo';
import { verifyAdminToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// POST - Automatically assign users to admin team based on existing order assignments
export async function POST(request) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminId = decoded.adminId || decoded.userId;
    const body = await request.json();
    const { userType, dryRun = false } = body;

    if (!userType || !['seller', 'buyer'].includes(userType)) {
      return NextResponse.json({ 
        error: 'User type must be either "seller" or "buyer"' 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');

    console.log(`🔧 Auto-assigning ${userType}s to admin:`, adminId);

    // Find all orders where this admin is assigned
    const orderStatuses = await db.collection('order_status').find({
      assignedAdminId: new ObjectId(adminId)
    }).toArray();

    console.log(`🔍 Found ${orderStatuses.length} orders assigned to this admin`);

    // Get unique user IDs from these orders
    const userIdField = userType === 'seller' ? 'sellerId' : 'buyerId';
    const userIds = [...new Set(orderStatuses.map(order => order[userIdField]).filter(Boolean))];

    console.log(`🔍 Found ${userIds.length} unique ${userType} IDs`);

    const results = {
      processed: 0,
      assigned: 0,
      alreadyAssigned: 0,
      errors: 0,
      assignments: []
    };

    for (const userId of userIds) {
      try {
        results.processed++;

        // Check if user already has a team assignment
        const existingAssignment = await db.collection('admin_team_assignments').findOne({
          userId: new ObjectId(userId),
          userType
        });

        if (existingAssignment) {
          results.alreadyAssigned++;
          console.log(`⚠️ User ${userId} already assigned to admin: ${existingAssignment.assignedAdminId}`);
          continue;
        }

        // Get user details
        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
        if (!user) {
          console.log(`❌ User ${userId} not found`);
          results.errors++;
          continue;
        }

        if (!dryRun) {
          // Create team assignment
          const newAssignment = {
            userId: new ObjectId(userId),
            userType,
            assignedAdminId: new ObjectId(adminId),
            assignedAt: new Date(),
            notes: `Auto-assigned based on existing order assignments`,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          };

          const result = await db.collection('admin_team_assignments').insertOne(newAssignment);
          newAssignment._id = result.insertedId;

          console.log(`✅ Auto-assigned ${userType}:`, {
            userId: userId,
            userName: user.name || user.email,
            adminId: adminId
          });

          results.assignments.push({
            userId: userId,
            userName: user.name || user.email,
            userEmail: user.email,
            assignmentId: result.insertedId
          });
        } else {
          // Dry run - just log what would be assigned
          console.log(`🔍 Would assign ${userType}:`, {
            userId: userId,
            userName: user.name || user.email,
            adminId: adminId
          });

          results.assignments.push({
            userId: userId,
            userName: user.name || user.email,
            userEmail: user.email,
            wouldAssign: true
          });
        }

        results.assigned++;

      } catch (error) {
        console.error(`❌ Error processing user ${userId}:`, error);
        results.errors++;
      }
    }

    const message = dryRun 
      ? `Dry run completed. Would assign ${results.assigned} ${userType}s to your team.`
      : `Auto-assignment completed. Assigned ${results.assigned} ${userType}s to your team.`;

    return NextResponse.json({ 
      success: true, 
      data: results,
      message
    }, { status: 200 });

  } catch (error) {
    console.error('POST /api/admin/auto-assign-users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
