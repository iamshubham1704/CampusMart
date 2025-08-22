// app/api/admin/debug/route.js - Debug endpoint for troubleshooting
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

export async function GET(request) {
  try {
    const admin = verifyAdminToken(request);
    if (!admin) {
      return Response.json({ 
        error: 'Unauthorized. Admin access required.' 
      }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');

    // Get comprehensive debug information
    const debugInfo = await getDebugInfo(db);

    return Response.json({
      success: true,
      message: 'Debug information retrieved',
      data: debugInfo
    }, { status: 200 });

  } catch (error) {
    console.error('Error getting debug info:', error);
    return Response.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

async function getDebugInfo(db) {
  try {
    console.log('🔍 Starting database debug...');

    // Check all relevant collections
    const [paymentScreenshots, orders, orderStatuses, buyers, sellers, listings] = await Promise.all([
      db.collection('payment_screenshots').find({}).toArray(),
      db.collection('orders').find({}).toArray(),
      db.collection('order_status').find({}).toArray(),
      db.collection('buyers').find({}).toArray(),
      db.collection('sellers').find({}).toArray(),
      db.collection('listings').find({}).toArray()
    ]);

    console.log('📊 Collections loaded:', {
      paymentScreenshots: paymentScreenshots.length,
      orders: orders.length,
      orderStatuses: orderStatuses.length,
      buyers: buyers.length,
      sellers: sellers.length,
      listings: listings.length
    });

    // Analyze payment screenshots
    const paymentAnalysis = analyzePaymentScreenshots(paymentScreenshots);
    
    // Analyze orders
    const orderAnalysis = analyzeOrders(orders, paymentScreenshots);
    
    // Analyze order statuses
    const orderStatusAnalysis = analyzeOrderStatuses(orderStatuses);

    return {
      collections: {
        payment_screenshots: {
          total: paymentScreenshots.length,
          byStatus: paymentAnalysis.byStatus,
          sampleIds: paymentScreenshots.slice(0, 5).map(p => p._id.toString())
        },
        orders: {
          total: orders.length,
          byStatus: orderAnalysis.byStatus,
          withPaymentScreenshot: orderAnalysis.withPaymentScreenshot,
          sampleIds: orders.slice(0, 5).map(o => o._id.toString())
        },
        order_status: {
          total: orderStatuses.length,
          byStatus: orderStatusAnalysis.byStatus,
          sampleIds: orderStatuses.slice(0, 5).map(os => os._id.toString())
        },
        buyers: { total: buyers.length },
        sellers: { total: sellers.length },
        listings: { total: listings.length }
      },
      analysis: {
        paymentScreenshots: paymentAnalysis,
        orders: orderAnalysis,
        orderStatuses: orderStatusAnalysis
      },
      issues: identifyIssues(paymentAnalysis, orderAnalysis, orderStatusAnalysis),
      recommendations: generateRecommendations(paymentAnalysis, orderAnalysis, orderStatusAnalysis)
    };

  } catch (error) {
    console.error('Error getting debug info:', error);
    return { error: error.message };
  }
}

function analyzePaymentScreenshots(screenshots) {
  const byStatus = screenshots.reduce((acc, screenshot) => {
    acc[screenshot.status] = (acc[screenshot.status] || 0) + 1;
    return acc;
  }, {});

  // Analyze ID formats
  const idFormats = screenshots.reduce((acc, screenshot) => {
    const id = screenshot._id.toString();
    if (/^[0-9a-f]{24}$/i.test(id)) {
      acc.objectId++;
    } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      acc.uuid++;
    } else {
      acc.other++;
    }
    return acc;
  }, { objectId: 0, uuid: 0, other: 0 });

  const sampleScreenshots = screenshots.slice(0, 3).map(s => ({
    id: s._id.toString(),
    idFormat: /^[0-9a-f]{24}$/i.test(s._id.toString()) ? 'ObjectId' : 
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s._id.toString()) ? 'UUID' : 'Other',
    status: s.status,
    productId: s.productId?.toString(),
    buyerId: s.buyerId?.toString(),
    sellerId: s.sellerId?.toString(),
    amount: s.amount,
    createdAt: s.createdAt
  }));

  return {
    byStatus,
    idFormats,
    sampleScreenshots,
    total: screenshots.length
  };
}

function analyzeOrders(orders, screenshots) {
  const byStatus = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  const withPaymentScreenshot = orders.filter(o => o.paymentScreenshotId).length;
  const withoutPaymentScreenshot = orders.length - withPaymentScreenshot;

  const sampleOrders = orders.slice(0, 3).map(o => ({
    id: o._id.toString(),
    status: o.status,
    paymentScreenshotId: o.paymentScreenshotId?.toString(),
    productId: o.productId?.toString(),
    buyerId: o.buyerId?.toString(),
    sellerId: o.sellerId?.toString()
  }));

  return {
    byStatus,
    withPaymentScreenshot,
    withoutPaymentScreenshot,
    sampleOrders,
    total: orders.length
  };
}

function analyzeOrderStatuses(orderStatuses) {
  const byStatus = orderStatuses.reduce((acc, os) => {
    acc[os.overallStatus] = (acc[os.overallStatus] || 0) + 1;
    return acc;
  }, {});

  const sampleOrderStatuses = orderStatuses.slice(0, 3).map(os => ({
    id: os._id.toString(),
    orderId: os.orderId?.toString(),
    overallStatus: os.overallStatus,
    currentStep: os.currentStep
  }));

  return {
    byStatus,
    sampleOrderStatuses,
    total: orderStatuses.length
  };
}

function identifyIssues(paymentAnalysis, orderAnalysis, orderStatusAnalysis) {
  const issues = [];

  // Check for verified payments without order statuses
  const verifiedPayments = paymentAnalysis.byStatus.verified || 0;
  const totalOrderStatuses = orderStatusAnalysis.total;
  
  if (verifiedPayments > 0 && totalOrderStatuses === 0) {
    issues.push({
      type: 'critical',
      message: 'Verified payments exist but no order statuses found',
      details: `This means the sync process is not working. Found ${verifiedPayments} verified payments but 0 order statuses.`
    });
  }

  // Check for orders without payment screenshots
  if (orderAnalysis.withoutPaymentScreenshot > 0) {
    issues.push({
      type: 'warning',
      message: 'Orders exist without payment screenshots',
      details: `Found ${orderAnalysis.withoutPaymentScreenshot} orders without payment screenshots.`
    });
  }

  // Check for payment screenshots without orders
  const totalPayments = paymentAnalysis.total;
  if (totalPayments > 0 && orderAnalysis.total === 0) {
    issues.push({
      type: 'warning',
      message: 'Payment screenshots exist but no orders found',
      details: `Found ${totalPayments} payment screenshots but 0 orders.`
    });
  }

  return issues;
}

function generateRecommendations(paymentAnalysis, orderAnalysis, orderStatusAnalysis) {
  const recommendations = [];

  if (paymentAnalysis.byStatus.pending_verification > 0) {
    recommendations.push({
      priority: 'high',
      action: 'Verify pending payments',
      details: `There are ${paymentAnalysis.byStatus.pending_verification} payments waiting for verification.`
    });
  }

  if (paymentAnalysis.byStatus.verified > 0 && orderStatusAnalysis.total === 0) {
    recommendations.push({
      priority: 'critical',
      action: 'Run sync process',
      details: `There are ${paymentAnalysis.byStatus.verified} verified payments that need to be synced to order statuses.`
    });
  }

  if (orderAnalysis.withPaymentScreenshot > 0 && orderStatusAnalysis.total === 0) {
    recommendations.push({
      priority: 'high',
      action: 'Check order relationships',
      details: `Found ${orderAnalysis.withPaymentScreenshot} orders with payment screenshots but no order statuses.`
    });
  }

  return recommendations;
}
