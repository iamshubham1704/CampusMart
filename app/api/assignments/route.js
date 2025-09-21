import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongo';
import { verifyToken, verifyAdminToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// GET - Fetch assignments (admin can see all, buyer can see their own)
// Updated GET method for /api/assignments/route.js
// Replace your existing GET method with this:

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userType = searchParams.get('userType');
    
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

    // Enhanced population
    const enhancedAssignments = await Promise.all(
      assignments.map(async (assignment) => {
        try {
          let result = { ...assignment };

          // DEBUG: Log what fields exist in assignment
          console.log('Assignment fields:', Object.keys(assignment));
          console.log('Assignment adminId:', assignment.adminId);
          console.log('Assignment assignedTo:', assignment.assignedTo);

          // Populate buyer details (for admin view)
          if (userType === 'admin') {
            const buyer = await db.collection('buyers').findOne(
              { _id: new ObjectId(assignment.buyerId) },
              { projection: { name: 1, email: 1, phone: 1, college: 1, university: 1 } }
            );
            result.buyer = buyer || {};
          }

          // Populate admin details (for buyer view) - UPDATED LOGIC
          if (userType === 'buyer') {
            let assignedAdmin = null;
            
            // Try different possible admin ID fields
            const adminId = assignment.adminId || assignment.assignedAdmin || assignment.assignedToAdmin || assignment.assignedTo;
            
            if (adminId) {
              try {
                // Try admins collection first
                assignedAdmin = await db.collection('admins').findOne(
                  { _id: new ObjectId(adminId) },
                  { 
                    projection: { 
                      name: 1, 
                      email: 1, 
                      phone: 1,
                      phoneNumber: 1, // Alternative field name
                      mobile: 1, // Alternative field name
                      contact: 1, // Alternative field name
                      department: 1,
                      experience: 1 
                    } 
                  }
                );
                
                // If not found in admins, try users collection
                if (!assignedAdmin) {
                  assignedAdmin = await db.collection('users').findOne(
                    { _id: new ObjectId(adminId), role: 'admin' },
                    { 
                      projection: { 
                        name: 1, 
                        email: 1, 
                        phone: 1,
                        phoneNumber: 1,
                        mobile: 1,
                        contact: 1,
                        department: 1,
                        experience: 1 
                      } 
                    }
                  );
                }
                
                // Normalize phone field names
                if (assignedAdmin) {
                  assignedAdmin.phone = assignedAdmin.phone || 
                                      assignedAdmin.phoneNumber || 
                                      assignedAdmin.mobile || 
                                      assignedAdmin.contact;
                }
                
              } catch (error) {
                console.error('Error fetching admin:', error);
              }
            }
            
            
            
            result.assignedAdmin = assignedAdmin;
          }

          // For admin view, populate alpha details
          if (userType === 'admin' && assignment.assignedTo) {
            const assignedAlpha = await db.collection('alphas').findOne(
              { _id: new ObjectId(assignment.assignedTo) },
              { 
                projection: { 
                  name: 1, 
                  email: 1, 
                  phone: 1,
                  specialization: 1,
                  rating: 1 
                } 
              }
            );
            result.assignedToAlpha = assignedAlpha || null;
          }

          return result;
        } catch (error) {
          console.error('Error populating assignment details:', error);
          return {
            ...assignment,
            buyer: userType === 'admin' ? {} : undefined,
            assignedAdmin: userType === 'buyer' ? {
              _id: 'error',
              name: 'Support Team',
              email: 'support@campusmart.com',
              phone: '+1234567890',
              department: 'Technical Support'
            } : undefined,
            assignedToAlpha: userType === 'admin' ? null : undefined
          };
        }
      })
    );

    return NextResponse.json({ 
      success: true, 
      data: enhancedAssignments 
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
      deadline, 
      budget, 
      location, 
      additionalRequirements,
      pdfUrl 
    } = body;

    if (!title || !type || !budget) {
      return NextResponse.json({ 
        error: 'Title, type, and budget are required' 
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
      deadline: deadline ? new Date(deadline) : null,
      budget: parseFloat(budget), // Original budget set by buyer
      buyerPrice: null, // Will be set by admin (what buyer pays)
      alphaPrice: null, // Will be set by admin (what alpha receives)
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