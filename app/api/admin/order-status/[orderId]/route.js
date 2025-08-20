// app/api/admin/order-status/[orderId]/route.js - CREATE NEW FILE
import { verifyToken } from '@/lib/auth';
import clientPromise from '@/lib/mongo';
import { ObjectId } from 'mongodb';

// Define order steps
const ORDER_STEPS = {
  1: { name: 'Payment Verified', description: 'Payment screenshot has been verified by admin' },
  2: { name: 'Item Status Updated', description: 'Item marked as sold in the system' },
  3: { name: 'Buyer Called', description: 'Admin contacted buyer for delivery coordination' },
  4: { name: 'Seller Called', description: 'Admin contacted seller for delivery coordination' },
  5: { name: 'Order Delivered', description: 'Item successfully delivered to buyer' },
  6: { name: 'Payment Released', description: 'Payment released to seller (minus commission)' },
  7: { name: 'Order Complete', description: 'Order completed and closed' }
};

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

// GET - Fetch specific order status
export async function GET(request, { params }) {
  try {
    const admin = verifyAdminToken(request);
    if (!admin) {
      return Response.json({ 
        error: 'Unauthorized. Admin access required.' 
      }, { status: 401 });
    }

    const { orderId } = params;
    
    if (!orderId) {
      return Response.json({ 
        error: 'Order ID is required' 
      }, { status: 400 });
    }

    let objectId;
    try {
      objectId = new ObjectId(orderId);
    } catch (error) {
      return Response.json({ 
        error: 'Invalid order ID format' 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');

    const orderStatus = await db.collection('order_status').findOne({ _id: objectId });

    if (!orderStatus) {
      return Response.json({ 
        error: 'Order status not found' 
      }, { status: 404 });
    }

    return Response.json({
      success: true,
      data: orderStatus
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching order status:', error);
    return Response.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// PUT - Update order status step
export async function PUT(request, { params }) {
  try {
    const admin = verifyAdminToken(request);
    if (!admin) {
      return Response.json({ 
        error: 'Unauthorized. Admin access required.' 
      }, { status: 401 });
    }

    const { orderId } = params;
    const { step, status, details } = await request.json();

    // Validate input
    if (!orderId || !step || !status) {
      return Response.json({ 
        error: 'Order ID, step, and status are required' 
      }, { status: 400 });
    }

    const stepNum = parseInt(step);
    if (stepNum < 1 || stepNum > 7) {
      return Response.json({ 
        error: 'Step must be between 1 and 7' 
      }, { status: 400 });
    }

    if (!['completed', 'pending', 'failed'].includes(status)) {
      return Response.json({ 
        error: 'Status must be completed, pending, or failed' 
      }, { status: 400 });
    }

    if (status === 'completed' && !details) {
      return Response.json({ 
        error: 'Details are required when marking step as completed' 
      }, { status: 400 });
    }
    
    if (status === 'failed' && !details) {
      return Response.json({ 
        error: 'Reason is required when marking order as failed' 
      }, { status: 400 });
    }

    let objectId;
    try {
      objectId = new ObjectId(orderId);
    } catch (error) {
      return Response.json({ 
        error: 'Invalid order ID format' 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');

    // Get current order status
    const currentOrderStatus = await db.collection('order_status').findOne({ _id: objectId });

    if (!currentOrderStatus) {
      return Response.json({ 
        error: 'Order status not found' 
      }, { status: 404 });
    }

    // Validate step progression (can't skip steps)
    if (status === 'completed' && stepNum > currentOrderStatus.currentStep + 1) {
      return Response.json({ 
        error: `Cannot skip steps. Current step is ${currentOrderStatus.currentStep}, you can only complete step ${currentOrderStatus.currentStep + 1}` 
      }, { status: 400 });
    }

    // Validate that previous steps are completed
    if (status === 'completed' && stepNum > 1) {
      for (let i = 1; i < stepNum; i++) {
        if (currentOrderStatus.steps[i]?.status !== 'completed') {
          return Response.json({ 
            error: `Step ${i} must be completed before step ${stepNum}` 
          }, { status: 400 });
        }
      }
    }

    // Update the specific step
    const updateData = {
      [`steps.${stepNum}.status`]: status,
      [`steps.${stepNum}.details`]: details || '',
      [`steps.${stepNum}.completedBy`]: new ObjectId(admin.adminId || admin.userId),
      updatedAt: new Date()
    };

    if (status === 'completed') {
      updateData[`steps.${stepNum}.completedAt`] = new Date();
      
      // Update current step to next step
      if (stepNum === currentOrderStatus.currentStep) {
        updateData.currentStep = Math.min(stepNum + 1, 7);
      }

      // Check if all steps are completed
      let allCompleted = true;
      for (let i = 1; i <= 7; i++) {
        const stepStatus = i === stepNum ? 'completed' : currentOrderStatus.steps[i]?.status;
        if (stepStatus !== 'completed') {
          allCompleted = false;
          break;
        }
      }

      if (allCompleted) {
        updateData.overallStatus = 'completed';
        updateData.completedAt = new Date();
      }

      // Handle specific step actions
      if (stepNum === 2) {
        // Step 2: Update listing status to sold
        try {
          await db.collection('listings').updateOne(
            { _id: (typeof currentOrderStatus.productId === 'string' ? new ObjectId(currentOrderStatus.productId) : currentOrderStatus.productId) },
            { 
              $set: { 
                status: 'sold',
                soldAt: new Date(),
                soldTo: (typeof currentOrderStatus.buyerId === 'string' ? new ObjectId(currentOrderStatus.buyerId) : currentOrderStatus.buyerId)
              }
            }
          );
        } catch (listingError) {
          console.error('Error updating listing status:', listingError);
        }
      }

      if (stepNum === 6) {
        // Step 6: Create seller payment record
        try {
          // Try to read commission from listing; fallback to global settings; fallback to 10
          let commissionPercent = 10;
          try {
            const listing = await db.collection('listings').findOne({ _id: (typeof currentOrderStatus.productId === 'string' ? new ObjectId(currentOrderStatus.productId) : currentOrderStatus.productId) }, { projection: { commission: 1 } });
            if (listing && typeof listing.commission === 'number') {
              commissionPercent = listing.commission;
            } else {
              const settingsDoc = await db.collection('settings').findOne({ _id: 'global_settings' });
              if (settingsDoc && typeof settingsDoc.commissionPercent === 'number') {
                commissionPercent = settingsDoc.commissionPercent;
              }
            }
          } catch (_) {}

          const adminFee = (currentOrderStatus.orderAmount * commissionPercent) / 100;
          const sellerAmount = currentOrderStatus.orderAmount - adminFee;

          await db.collection('seller_transactions').insertOne({
            _id: new ObjectId(),
            sellerId: currentOrderStatus.sellerId,
            orderId: currentOrderStatus.orderId,
            productId: currentOrderStatus.productId,
            amount: sellerAmount,
            commission: adminFee,
            commissionPercent,
            status: 'completed',
            paymentMethod: 'admin_release',
            transactionDetails: details,
            createdAt: new Date(),
            processedBy: new ObjectId(admin.adminId || admin.userId)
          });
        } catch (paymentError) {
          console.error('Error creating seller payment record:', paymentError);
        }
      }
    }
    
    if (status === 'failed') {
      // Only allow failing the current step to keep state consistent
      if (stepNum !== currentOrderStatus.currentStep) {
        return Response.json({
          error: `Only current step (${currentOrderStatus.currentStep}) can be marked as failed`
        }, { status: 400 });
      }
      updateData[`steps.${stepNum}.completedAt`] = new Date();
      updateData.overallStatus = 'failed';
      updateData.failedAt = new Date();
    }

    const result = await db.collection('order_status').updateOne(
      { _id: objectId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return Response.json({ 
        error: 'Order status not found' 
      }, { status: 404 });
    }

    // Log the action
    console.log(`✅ Order step ${stepNum} ${status} by admin:`, {
      orderId,
      step: stepNum,
      status,
      adminId: admin.adminId || admin.userId,
      adminName: admin.name,
      details: details?.substring(0, 100) + (details?.length > 100 ? '...' : '')
    });

    return Response.json({
      success: true,
      message: status === 'failed'
        ? `Order marked as failed at step ${stepNum} (${ORDER_STEPS[stepNum].name})`
        : `Step ${stepNum} (${ORDER_STEPS[stepNum].name}) marked as ${status}`,
      data: { 
        orderId, 
        step: stepNum,
        status,
        updatedAt: updateData.updatedAt
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating order status step:', error);
    return Response.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}