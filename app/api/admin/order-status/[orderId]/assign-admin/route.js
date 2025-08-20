// app/api/admin/order-status/[orderId]/assign-admin/route.js
import { verifyToken } from '@/lib/auth';
import clientPromise from '@/lib/mongo';
import { ObjectId } from 'mongodb';

// Verify admin token
function verifyAdminToken(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded || decoded.role !== 'admin') {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('Admin token verification failed:', error);
    return null;
  }
}

// PUT - Assign/Update assigned admin for an order
export async function PUT(request, { params }) {
  try {
    const admin = verifyAdminToken(request);
    if (!admin) {
      return Response.json({ 
        error: 'Unauthorized. Admin access required.' 
      }, { status: 401 });
    }

    const { orderId } = await params;
    const { assignedAdminId } = await request.json();

    // Validate input
    if (!orderId) {
      return Response.json({ 
        error: 'Order ID is required' 
      }, { status: 400 });
    }

    if (!assignedAdminId) {
      return Response.json({ 
        error: 'Assigned admin ID is required' 
      }, { status: 400 });
    }

    let orderObjectId;
    let adminObjectId;
    
    try {
      orderObjectId = new ObjectId(orderId);
      adminObjectId = new ObjectId(assignedAdminId);
    } catch (error) {
      return Response.json({ 
        error: 'Invalid ID format' 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');

    // Verify the assigned admin exists
    const assignedAdmin = await db.collection('admins').findOne({ _id: adminObjectId });
    if (!assignedAdmin) {
      return Response.json({ 
        error: 'Assigned admin not found' 
      }, { status: 404 });
    }

    // Get current order status
    const currentOrderStatus = await db.collection('order_status').findOne({ _id: orderObjectId });
    if (!currentOrderStatus) {
      return Response.json({ 
        error: 'Order status not found' 
      }, { status: 404 });
    }

    // Update the assigned admin
    const result = await db.collection('order_status').updateOne(
      { _id: orderObjectId },
      { 
        $set: {
          assignedAdminId: adminObjectId,
          assignedAt: new Date(),
          assignedBy: new ObjectId(admin.adminId || admin.userId),
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return Response.json({ 
        error: 'Order status not found' 
      }, { status: 404 });
    }

    // Log the action
    console.log(`👤 Admin assigned to order:`, {
      orderId,
      assignedAdminId,
      assignedAdminName: assignedAdmin.name,
      assignedBy: admin.adminId || admin.userId,
      assignedByName: admin.name
    });

    return Response.json({
      success: true,
      message: `Order assigned to admin: ${assignedAdmin.name}`,
      data: { 
        orderId, 
        assignedAdminId,
        assignedAdminName: assignedAdmin.name,
        assignedAt: new Date(),
        assignedBy: admin.adminId || admin.userId
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error assigning admin to order:', error);
    return Response.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
