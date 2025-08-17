import clientPromise from '../../../lib/mongo';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Validate required fields
    const { role, issueType, description, priority, email } = body;
    
    if (!role || !issueType || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: role, issueType, and description are required' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['buyer', 'seller', 'visitor'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be buyer, seller, or visitor' },
        { status: 400 }
      );
    }

    // Validate issue type
    const validIssueTypes = ['technical', 'payment', 'fraud', 'seller', 'buyer', 'product', 'other'];
    if (!validIssueTypes.includes(issueType)) {
      return NextResponse.json(
        { error: 'Invalid issue type' },
        { status: 400 }
      );
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority level' },
        { status: 400 }
      );
    }

    // Validate email format if provided
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('campusmart');
    const collection = db.collection('reports');

    // Create the report document
    const reportDoc = {
      role,
      issueType,
      description: description.trim(),
      priority: priority || 'medium',
      email: email || null,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      resolvedAt: null,
      adminNotes: '',
      reportId: `RPT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    };

    // Insert the report into the database
    const result = await collection.insertOne(reportDoc);

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Report submitted successfully',
        reportId: reportDoc.reportId,
        insertedId: result.insertedId
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error processing report submission:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to submit report. Please try again later.'
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    // This endpoint could be used by admins to fetch reports
    // For now, we'll implement basic functionality
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const limit = parseInt(searchParams.get('limit')) || 50;
    const page = parseInt(searchParams.get('page')) || 1;

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('campusmart');
    const collection = db.collection('reports');

    // Build query filters
    const query = {};
    if (status) {
      query.status = status;
    }
    if (priority) {
      query.priority = priority;
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Fetch reports with pagination
    const reports = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count for pagination
    const totalReports = await collection.countDocuments(query);
    const totalPages = Math.ceil(totalReports / limit);

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
      }
    });

  } catch (error) {
    console.error('Error fetching reports:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to fetch reports'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    // This endpoint could be used by admins to update report status
    const body = await request.json();
    const { reportId, status, adminNotes } = body;

    if (!reportId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: reportId and status are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'in-progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be pending, in-progress, resolved, or closed' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('campusmart');
    const collection = db.collection('reports');

    // Prepare update document
    const updateDoc = {
      status,
      updatedAt: new Date()
    };

    if (adminNotes) {
      updateDoc.adminNotes = adminNotes;
    }

    if (status === 'resolved' || status === 'closed') {
      updateDoc.resolvedAt = new Date();
    }

    // Update the report
    const result = await collection.updateOne(
      { reportId },
      { $set: updateDoc }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Report updated successfully',
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Error updating report:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to update report'
      },
      { status: 500 }
    );
  }
}