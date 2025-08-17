// app/api/admin/reports/route.js - ADMIN REPORTS MANAGEMENT API
import clientPromise from '../../../../lib/mongo';
import { NextResponse } from 'next/server';
import { verifyAdminToken } from '../../../../lib/auth';
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
    // Verify admin authentication
    const adminAuth = verifyAdminToken(request);
    if (!adminAuth) {
      return NextResponse.json(
        { error: 'Admin authentication required', success: false },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const issueType = searchParams.get('issueType');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit')) || 20;
    const page = parseInt(searchParams.get('page')) || 1;

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('campusmart');
    const collection = db.collection('reports');

    // Build query filters
    const query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (priority && priority !== 'all') {
      query.priority = priority;
    }
    
    if (issueType && issueType !== 'all') {
      query.issueType = issueType;
    }

    // Add search functionality
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { reportId: searchRegex },
        { email: searchRegex },
        { description: searchRegex },
        { adminNotes: searchRegex }
      ];
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalReports = await collection.countDocuments(query);
    const totalPages = Math.ceil(totalReports / limit);

    // Use aggregation pipeline for proper priority sorting
    const pipeline = [
      { $match: query },
      {
        $addFields: {
          priorityOrder: {
            $switch: {
              branches: [
                { case: { $eq: ['$priority', 'critical'] }, then: 1 },
                { case: { $eq: ['$priority', 'high'] }, then: 2 },
                { case: { $eq: ['$priority', 'medium'] }, then: 3 },
                { case: { $eq: ['$priority', 'low'] }, then: 4 }
              ],
              default: 5
            }
          }
        }
      },
      { $sort: { priorityOrder: 1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      { $project: { priorityOrder: 0 } } // Remove the temporary field
    ];

    const reports = await collection.aggregate(pipeline).toArray();

    // Get statistics for dashboard
    const stats = await collection.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    // Get priority distribution
    const priorityStats = await collection.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    // Get issue type distribution
    const issueTypeStats = await collection.aggregate([
      {
        $group: {
          _id: '$issueType',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    // Format stats
    const statusStats = {
      pending: 0,
      'in-progress': 0,
      resolved: 0,
      closed: 0
    };

    stats.forEach(stat => {
      if (statusStats.hasOwnProperty(stat._id)) {
        statusStats[stat._id] = stat.count;
      }
    });

    const priorityDistribution = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };

    priorityStats.forEach(stat => {
      if (priorityDistribution.hasOwnProperty(stat._id)) {
        priorityDistribution[stat._id] = stat.count;
      }
    });

    const issueTypeDistribution = {};
    issueTypeStats.forEach(stat => {
      issueTypeDistribution[stat._id] = stat.count;
    });

    return NextResponse.json({
      success: true,
      reports: reports.map(report => ({
        ...report,
        _id: report._id.toString()
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalReports,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      statistics: {
        status: statusStats,
        priority: priorityDistribution,
        issueType: issueTypeDistribution,
        total: totalReports
      }
    });

  } catch (error) {
    console.error('🔴 Error fetching admin reports:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to fetch reports',
        success: false
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    // Verify admin authentication
    const adminAuth = verifyAdminToken(request);
    if (!adminAuth) {
      return NextResponse.json(
        { error: 'Admin authentication required', success: false },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { reportId, status, adminNotes, priority } = body;

    // Validation
    if (!reportId) {
      return NextResponse.json(
        { error: 'Report ID is required', success: false },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required', success: false },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'in-progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be pending, in-progress, resolved, or closed', success: false },
        { status: 400 }
      );
    }

    if (priority) {
      const validPriorities = ['low', 'medium', 'high', 'critical'];
      if (!validPriorities.includes(priority)) {
        return NextResponse.json(
          { error: 'Invalid priority level', success: false },
          { status: 400 }
        );
      }
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('campusmart');
    const collection = db.collection('reports');

    // Check if report exists
    const existingReport = await collection.findOne({ reportId });
    if (!existingReport) {
      return NextResponse.json(
        { error: 'Report not found', success: false },
        { status: 404 }
      );
    }

    // Prepare update document
    const updateDoc = {
      status,
      updatedAt: new Date(),
      adminId: adminAuth.adminId,
      adminName: adminAuth.name
    };

    if (adminNotes && adminNotes.trim()) {
      updateDoc.adminNotes = adminNotes.trim();
    }

    if (priority) {
      updateDoc.priority = priority;
    }

    // Set resolved date if status is resolved or closed
    if (status === 'resolved' || status === 'closed') {
      updateDoc.resolvedAt = new Date();
      updateDoc.resolvedBy = adminAuth.adminId;
    }

    // If moving from resolved/closed back to pending/in-progress, clear resolved fields
    if ((status === 'pending' || status === 'in-progress') && 
        (existingReport.status === 'resolved' || existingReport.status === 'closed')) {
      updateDoc.resolvedAt = null;
      updateDoc.resolvedBy = null;
    }

    // Create activity log entry
    const activityEntry = {
      action: 'status_updated',
      previousStatus: existingReport.status,
      newStatus: status,
      adminId: adminAuth.adminId,
      adminName: adminAuth.name,
      notes: adminNotes || '',
      timestamp: new Date()
    };

    // Update the report
    const result = await collection.updateOne(
      { reportId },
      { 
        $set: updateDoc,
        $push: { activityLog: activityEntry }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Report not found', success: false },
        { status: 404 }
      );
    }

    // Log the action for admin audit
    console.log(`✅ Report ${reportId} status updated by admin ${adminAuth.name} (${adminAuth.adminId}): ${existingReport.status} → ${status}`);

    // Get updated report
    const updatedReport = await collection.findOne({ reportId });

    return NextResponse.json({
      success: true,
      message: 'Report updated successfully',
      report: {
        ...updatedReport,
        _id: updatedReport._id.toString()
      },
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('🔴 Error updating report:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to update report',
        success: false
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    // Verify admin authentication
    const adminAuth = verifyAdminToken(request);
    if (!adminAuth) {
      return NextResponse.json(
        { error: 'Admin authentication required', success: false },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('reportId');

    if (!reportId) {
      return NextResponse.json(
        { error: 'Report ID is required', success: false },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('campusmart');
    const collection = db.collection('reports');

    // Check if report exists
    const existingReport = await collection.findOne({ reportId });
    if (!existingReport) {
      return NextResponse.json(
        { error: 'Report not found', success: false },
        { status: 404 }
      );
    }

    // Soft delete - mark as deleted instead of actually deleting
    const result = await collection.updateOne(
      { reportId },
      { 
        $set: {
          status: 'deleted',
          deletedAt: new Date(),
          deletedBy: adminAuth.adminId,
          updatedAt: new Date()
        },
        $push: {
          activityLog: {
            action: 'deleted',
            adminId: adminAuth.adminId,
            adminName: adminAuth.name,
            timestamp: new Date(),
            notes: 'Report deleted by admin'
          }
        }
      }
    );

    console.log(`🗑️ Report ${reportId} deleted by admin ${adminAuth.name} (${adminAuth.adminId})`);

    return NextResponse.json({
      success: true,
      message: 'Report deleted successfully',
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('🔴 Error deleting report:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to delete report',
        success: false
      },
      { status: 500 }
    );
  }
}

// POST endpoint for bulk actions
export async function POST(request) {
  try {
    // Verify admin authentication
    const adminAuth = verifyAdminToken(request);
    if (!adminAuth) {
      return NextResponse.json(
        { error: 'Admin authentication required', success: false },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, reportIds, status, adminNotes } = body;

    if (!action || !reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
      return NextResponse.json(
        { error: 'Action and reportIds array are required', success: false },
        { status: 400 }
      );
    }

    const validActions = ['bulk_status_update', 'bulk_delete', 'bulk_priority_update'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid bulk action', success: false },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('campusmart');
    const collection = db.collection('reports');

    let result;
    const timestamp = new Date();

    if (action === 'bulk_status_update') {
      if (!status) {
        return NextResponse.json(
          { error: 'Status is required for bulk status update', success: false },
          { status: 400 }
        );
      }

      const validStatuses = ['pending', 'in-progress', 'resolved', 'closed'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status', success: false },
          { status: 400 }
        );
      }

      const updateDoc = {
        status,
        updatedAt: timestamp,
        adminId: adminAuth.adminId,
        adminName: adminAuth.name
      };

      if (adminNotes) {
        updateDoc.adminNotes = adminNotes;
      }

      if (status === 'resolved' || status === 'closed') {
        updateDoc.resolvedAt = timestamp;
        updateDoc.resolvedBy = adminAuth.adminId;
      }

      result = await collection.updateMany(
        { reportId: { $in: reportIds } },
        { 
          $set: updateDoc,
          $push: {
            activityLog: {
              action: 'bulk_status_update',
              newStatus: status,
              adminId: adminAuth.adminId,
              adminName: adminAuth.name,
              notes: adminNotes || `Bulk update to ${status}`,
              timestamp
            }
          }
        }
      );
    } else if (action === 'bulk_delete') {
      result = await collection.updateMany(
        { reportId: { $in: reportIds } },
        { 
          $set: {
            status: 'deleted',
            deletedAt: timestamp,
            deletedBy: adminAuth.adminId,
            updatedAt: timestamp
          },
          $push: {
            activityLog: {
              action: 'bulk_deleted',
              adminId: adminAuth.adminId,
              adminName: adminAuth.name,
              timestamp,
              notes: 'Bulk deleted by admin'
            }
          }
        }
      );
    }

    console.log(`🔄 Bulk action ${action} performed by admin ${adminAuth.name} on ${result.modifiedCount} reports`);

    return NextResponse.json({
      success: true,
      message: `Bulk action completed successfully`,
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    });

  } catch (error) {
    console.error('🔴 Error performing bulk action:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to perform bulk action',
        success: false
      },
      { status: 500 }
    );
  }
}