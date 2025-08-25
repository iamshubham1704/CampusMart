import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongo';
import { verifyToken, verifyAdminToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// GET - Fetch assignments (admin can see all, buyer can see their own)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userType = searchParams.get('userType'); // 'admin' or 'buyer'
    
    let decoded;
    if (userType === 'admin') {
      decoded = verifyAdminToken(request);
      if (!decoded) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      decoded = verifyToken(request);
      if (!decoded) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const client = await clientPromise;
    const db = client.db('campusmart');

    let filter = {};
    if (userType === 'buyer') {
      filter.buyerId = new ObjectId(decoded.userId);
    }

    const assignments = await db.collection('assignments').find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    // If admin, populate buyer details
    if (userType === 'admin') {
      const enhancedAssignments = await Promise.all(
        assignments.map(async (assignment) => {
          try {
            const buyer = await db.collection('buyers').findOne(
              { _id: new ObjectId(assignment.buyerId) },
              { projection: { name: 1, email: 1, phone: 1, college: 1, university: 1 } }
            );
            
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
        data: enhancedAssignments 
      });
    }

    return NextResponse.json({ 
      success: true, 
      data: assignments 
    });

  } catch (error) {
    console.error('GET /api/assignments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new assignment
export async function POST(request) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      title, 
      description, 
      type, 
      subject, 
      deadline, 
      budget, 
      location, 
      additionalRequirements,
      pdfUrl 
    } = body;

    if (!title || !type || !subject || !budget) {
      return NextResponse.json({ 
        error: 'Title, type, subject, and budget are required' 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');

    // Get buyer details from buyers collection
    let buyer;
    try {
      buyer = await db.collection('buyers').findOne(
        { _id: new ObjectId(decoded.userId) },
        { projection: { name: 1, email: 1, college: 1, university: 1 } }
      );
    } catch (error) {
      console.error('Error finding buyer:', error);
      // Try users collection as fallback
      buyer = await db.collection('users').findOne(
        { _id: new ObjectId(decoded.userId) },
        { projection: { name: 1, email: 1, college: 1, university: 1 } }
      );
    }

    if (!buyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });
    }

    const newAssignment = {
      title,
      description: description || '',
      type,
      subject,
      deadline: deadline ? new Date(deadline) : null,
      budget: parseFloat(budget),
      location: location || '',
      additionalRequirements: additionalRequirements || '',
      pdfUrl: pdfUrl || '',
      buyerId: new ObjectId(decoded.userId),
      buyerName: buyer.name,
      buyerCollege: buyer.university || buyer.college,
      status: 'pending',
      adminId: null,
      adminName: null,
      tentativeDeliveryDate: null,
      confirmedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('assignments').insertOne(newAssignment);
    newAssignment._id = result.insertedId;

    console.log('✅ New assignment created:', {
      assignmentId: newAssignment._id.toString(),
      buyerId: decoded.userId,
      title: newAssignment.title,
      budget: newAssignment.budget
    });

    return NextResponse.json({ 
      success: true, 
      data: newAssignment,
      message: 'Assignment created successfully' 
    }, { status: 201 });

  } catch (error) {
    console.error('POST /api/assignments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update assignment (for PDF URL updates)
export async function PUT(request) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { assignmentId, pdfUrl } = body;

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');

    // Verify the assignment belongs to the user
    const assignment = await db.collection('assignments').findOne({
      _id: new ObjectId(assignmentId),
      buyerId: new ObjectId(decoded.userId)
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found or unauthorized' }, { status: 404 });
    }

    // Update the assignment
    const result = await db.collection('assignments').updateOne(
      { _id: new ObjectId(assignmentId) },
      { 
        $set: { 
          pdfUrl: pdfUrl || '',
          updatedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    console.log('✅ Assignment PDF updated:', {
      assignmentId,
      buyerId: decoded.userId,
      pdfUrl
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Assignment updated successfully' 
    });

  } catch (error) {
    console.error('PUT /api/assignments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
