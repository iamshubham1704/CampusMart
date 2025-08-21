// app/api/seller/order-admin/route.js
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongo';
import { verifyToken } from '../../../../lib/auth';
import { ObjectId } from 'mongodb';

// Verify seller token
function verifySellerToken(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    const token = authHeader.substring(7);
    
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return null;
    }
    
    // Check if user is a seller - either by role or by having sellerId
    if (decoded.role === 'seller' || decoded.sellerId || decoded.userId || decoded.id || decoded.sub) {
      return decoded;
    }
    
    return null;
  } catch (error) {
    console.error('Error verifying seller token:', error);
    return null;
  }
}

// GET - Fetch admin details for a specific order
export async function GET(request) {
  try {
    const seller = verifySellerToken(request);
    
    if (!seller) {
      return NextResponse.json({ 
        error: 'Unauthorized. Seller authentication required.' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    
    if (!orderId) {
      return NextResponse.json({ 
        error: 'Order ID is required' 
      }, { status: 400 });
    }

    console.log('🔍 Fetching admin details for seller order:', orderId);
    console.log('🔍 Seller info:', { 
      userId: seller.userId, 
      role: seller.role, 
      email: seller.email 
    });

    const client = await clientPromise;
    const db = client.db('campusmart');

    // Build flexible filter for seller's orders
    const idCandidates = [];
    try {
      if (orderId) {
        idCandidates.push(orderId);
        if (ObjectId.isValid(orderId)) {
          try { idCandidates.push(new ObjectId(orderId)); } catch (_) {}
        }
      }
    } catch (_) {}

    const emailCandidate = seller.email || seller.userEmail || seller.preferred_username || null;

    const possibleFields = ['sellerId', 'seller_id', 'seller', 'userId', 'user_id', 'user'];
    const orConditions = [];
    for (const field of possibleFields) {
      if (idCandidates.length > 0) {
        orConditions.push({ [field]: { $in: idCandidates } });
      }
    }
    if (emailCandidate) {
      orConditions.push({ sellerEmail: emailCandidate });
      orConditions.push({ email: emailCandidate });
      orConditions.push({ 'seller.email': emailCandidate });
    }

    let filter = orConditions.length > 0 ? { $or: orConditions } : {};
    
    // Also try to find by _id directly
    if (idCandidates.length > 0) {
      filter = { $or: [filter, { _id: { $in: idCandidates } }] };
    }

    console.log('🔍 Final filter for seller orders:', JSON.stringify(filter));

    // First verify this order belongs to the seller
    const order = await db.collection('orders').findOne(filter);

    if (!order) {
      console.log('❌ Order not found or access denied for seller');
      return NextResponse.json({ 
        error: 'Order not found or access denied' 
      }, { status: 404 });
    }

    console.log('✅ Seller order found:', order._id);

    // Get order status to find assigned admin
    const orderStatus = await db.collection('order_status').findOne({
      orderId: order._id
    });

    console.log('🔍 Order status found:', orderStatus ? 'Yes' : 'No');
    if (orderStatus) {
      console.log('🔍 Assigned admin ID:', orderStatus.assignedAdminId);
    }

    if (!orderStatus || !orderStatus.assignedAdminId) {
      return NextResponse.json({
        success: true,
        data: {
          hasAssignedAdmin: false,
          message: 'No admin has been assigned to this order yet'
        }
      }, { status: 200 });
    }

    // Get admin details
    const admin = await db.collection('admins').findOne({
      _id: orderStatus.assignedAdminId
    }, {
      projection: {
        name: 1,
        email: 1,
        phone: 1,
        role: 1
      }
    });

    if (!admin) {
      console.log('❌ Admin not found for ID:', orderStatus.assignedAdminId);
      return NextResponse.json({
        success: true,
        data: {
          hasAssignedAdmin: true,
          admin: null,
          message: 'Admin details not found'
        }
      }, { status: 200 });
    }

    console.log('✅ Admin found:', admin.name);

    return NextResponse.json({
      success: true,
      data: {
        hasAssignedAdmin: true,
        admin: {
          name: admin.name,
          email: admin.email,
          phone: admin.phone,
          role: admin.role
        },
        assignedAt: orderStatus.assignedAt,
        message: 'Admin details retrieved successfully'
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error fetching seller order admin details:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error.message
    }, { status: 500 });
  }
}
