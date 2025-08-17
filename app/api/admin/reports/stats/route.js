// app/api/admin/reports/stats/route.js - Reports Statistics API
import clientPromise from '../../../../../lib/mongo';
import { NextResponse } from 'next/server';
import { verifyAdminToken } from '../../../../../lib/auth';

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
    const period = searchParams.get('period') || '30'; // days
    const detailed = searchParams.get('detailed') === 'true';

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('campusmart');
    const collection = db.collection('reports');

    // Calculate date range
    const periodDays = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Basic statistics
    const totalReports = await collection.countDocuments({});
    
    // Status distribution
    const statusStats = await collection.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    // Priority distribution
    const priorityStats = await collection.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    // Issue type distribution
    const issueTypeStats = await collection.aggregate([
      {
        $group: {
          _id: '$issueType',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    // Recent reports (last 7 days)
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 7);
    
    const recentReports = await collection.countDocuments({
      createdAt: { $gte: recentDate }
    });

    // Reports by period
    const periodReports = await collection.countDocuments({
      createdAt: { $gte: startDate }
    });

    // Resolution rate (resolved + closed vs total)
    const resolvedCount = await collection.countDocuments({
      status: { $in: ['resolved', 'closed'] }
    });
    
    const resolutionRate = totalReports > 0 ? ((resolvedCount / totalReports) * 100).toFixed(1) : 0;

    // Average resolution time (for resolved reports)
    const avgResolutionTime = await collection.aggregate([
      {
        $match: {
          status: { $in: ['resolved', 'closed'] },
          resolvedAt: { $exists: true },
          createdAt: { $exists: true }
        }
      },
      {
        $project: {
          resolutionTime: {
            $divide: [
              { $subtract: ['$resolvedAt', '$createdAt'] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgDays: { $avg: '$resolutionTime' }
        }
      }
    ]).toArray();

    // Format statistics
    const formattedStats = {
      overview: {
        total: totalReports,
        recent: recentReports,
        period: periodReports,
        resolutionRate: parseFloat(resolutionRate),
        avgResolutionDays: avgResolutionTime.length > 0 ? 
          Math.round(avgResolutionTime[0].avgDays * 10) / 10 : 0
      },
      status: statusStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {
        pending: 0,
        'in-progress': 0,
        resolved: 0,
        closed: 0
      }),
      priority: priorityStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      }),
      issueTypes: issueTypeStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    };

    // Add detailed statistics if requested
    let detailedStats = {};
    if (detailed) {
      // Daily reports for the last 30 days (for charts)
      const dailyStats = await collection.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            count: { $sum: 1 },
            pending: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            inProgress: {
              $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] }
            },
            resolved: {
              $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
            },
            closed: {
              $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] }
            }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]).toArray();

      // Top issue types
      const topIssueTypes = issueTypeStats
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Reports by admin activity
      const adminActivity = await collection.aggregate([
        {
          $match: {
            adminId: { $exists: true }
          }
        },
        {
          $group: {
            _id: '$adminName',
            handled: { $sum: 1 },
            resolved: {
              $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
            }
          }
        },
        {
          $sort: { handled: -1 }
        }
      ]).toArray();

      detailedStats = {
        dailyStats,
        topIssueTypes,
        adminActivity
      };
    }

    return NextResponse.json({
      success: true,
      statistics: formattedStats,
      detailed: detailedStats,
      period: `${periodDays} days`,
      generatedAt: new Date()
    });

  } catch (error) {
    console.error('🔴 Error fetching reports statistics:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to fetch reports statistics',
        success: false
      },
      { status: 500 }
    );
  }
}