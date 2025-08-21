// app/api/admin/analytics/orders/route.js
import { verifyToken } from '@/lib/auth';
import clientPromise from '@/lib/mongo';

// Verify admin token helper
function verifyAdminToken(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') return null;
    return decoded;
  } catch (error) {
    console.error('Admin token verification failed:', error);
    return null;
  }
}

// Utility to coerce date input and clamp to valid range
function parseDate(value, fallback) {
  if (!value) return fallback;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return fallback;
  return d;
}

export async function GET(request) {
  try {
    const admin = verifyAdminToken(request);
    if (!admin) {
      return Response.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const groupBy = (searchParams.get('groupBy') || 'day').toLowerCase(); // 'day' | 'month'
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    // Default: last 30 days
    const now = new Date();
    const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const start = parseDate(fromParam, defaultFrom);
    const end = parseDate(toParam, now);

    // Normalize end to end-of-day to include that whole day
    const endInclusive = new Date(end);
    endInclusive.setHours(23, 59, 59, 999);

    const client = await clientPromise;
    const db = client.db('campusmart');

    // Fetch commission settings (global)
    const settingsDoc = await db.collection('settings').findOne({ _id: 'global_settings' });
    const commissionPercent = settingsDoc?.commissionPercent ?? 10;

    // Aggregate completed orders within range from order_status collection
    const dateField = 'completedAt';

    const matchStage = {
      overallStatus: 'completed',
      [dateField]: { $gte: start, $lte: endInclusive }
    };

    // Series by group (day/month)
    const dateFormat = groupBy === 'month' ? '%Y-%m' : '%Y-%m-%d';

    const [series, totals, completedOrdersCount] = await Promise.all([
      db.collection('order_status').aggregate([
        { $match: matchStage },
        // Join with listings to fetch fallback price/commission if missing on order_status
        { $lookup: { from: 'listings', localField: 'productId', foreignField: '_id', as: 'listing' } },
        {
          $addFields: {
            derivedListingPrice: { $ifNull: ['$listingPrice', { $arrayElemAt: ['$listing.price', 0] }] },
            derivedCommissionPercent: {
              $ifNull: [
                '$commissionPercent',
                { $ifNull: [ { $arrayElemAt: ['$listing.commission', 0] }, commissionPercent ] }
              ]
            }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: dateFormat, date: `$${dateField}` } },
            soldCount: { $sum: 1 },
            revenue: { $sum: { $ifNull: ['$orderAmount', 0] } },
            commission: {
              $sum: {
                $ifNull: [
                  '$commissionAmount',
                  {
                    $multiply: [
                      '$derivedListingPrice',
                      { $divide: ['$derivedCommissionPercent', 100] }
                    ]
                  }
                ]
              }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]).toArray(),

      db.collection('order_status').aggregate([
        { $match: matchStage },
        { $lookup: { from: 'listings', localField: 'productId', foreignField: '_id', as: 'listing' } },
        {
          $addFields: {
            derivedListingPrice: { $ifNull: ['$listingPrice', { $arrayElemAt: ['$listing.price', 0] }] },
            derivedCommissionPercent: {
              $ifNull: [
                '$commissionPercent',
                { $ifNull: [ { $arrayElemAt: ['$listing.commission', 0] }, commissionPercent ] }
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            soldCount: { $sum: 1 },
            revenue: { $sum: { $ifNull: ['$orderAmount', 0] } },
            commission: {
              $sum: {
                $ifNull: [
                  '$commissionAmount',
                  {
                    $multiply: [
                      '$derivedListingPrice',
                      { $divide: ['$derivedCommissionPercent', 100] }
                    ]
                  }
                ]
              }
            }
          }
        }
      ]).toArray(),

      // Count of completed orders in the same range
      db.collection('order_status').countDocuments({ 
        overallStatus: 'completed', 
        completedAt: { $gte: start, $lte: endInclusive } 
      })
    ]);

    const totalsDoc = totals?.[0] || { soldCount: 0, revenue: 0, commission: 0 };
    const totalRevenue = totalsDoc.revenue || 0;
    const totalCommission = totalsDoc.commission || 0;

    // Prepare series with commission calculated based on completed orders
    const seriesWithCommission = (series || []).map(item => ({
      period: item._id,
      soldCount: item.soldCount || 0,
      revenue: item.revenue || 0,
      commission: item.commission || 0
    }));

    return Response.json({
      success: true,
      data: {
        range: { from: start, to: endInclusive },
        groupBy,
        totals: {
          soldProducts: totalsDoc.soldCount || 0,
          totalRevenue,
          totalCommission,
          commissionPercent,
          completedOrders: completedOrdersCount || 0
        },
        series: seriesWithCommission
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error computing admin order analytics:', error);
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}


