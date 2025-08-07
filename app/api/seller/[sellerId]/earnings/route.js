import { connectToDatabase } from '../../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    const { sellerId } = req.query;
    
    // Connect to database
    const { db } = await connectToDatabase();
    
    // Get earnings from orders/transactions collection
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday.getTime() - (now.getDay() * 24 * 60 * 60 * 1000));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Aggregate earnings data
    const earningsAggregation = [
      {
        $match: {
          sellerId: sellerId, // or new ObjectId(sellerId) if stored as ObjectId
          status: { $in: ['completed', 'delivered', 'paid'] }
        }
      },
      {
        $group: {
          _id: null,
          allTime: { $sum: { $toDouble: "$amount" } },
          today: {
            $sum: {
              $cond: [
                { $gte: ["$createdAt", startOfToday] },
                { $toDouble: "$amount" },
                0
              ]
            }
          },
          thisWeek: {
            $sum: {
              $cond: [
                { $gte: ["$createdAt", startOfWeek] },
                { $toDouble: "$amount" },
                0
              ]
            }
          },
          thisMonth: {
            $sum: {
              $cond: [
                { $gte: ["$createdAt", startOfMonth] },
                { $toDouble: "$amount" },
                0
              ]
            }
          },
          totalTransactions: { $sum: 1 },
          averageTransaction: { $avg: { $toDouble: "$amount" } }
        }
      }
    ];

    const earningsResult = await db.collection('orders').aggregate(earningsAggregation).toArray();
    const earnings = earningsResult[0] || {
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      allTime: 0,
      totalTransactions: 0,
      averageTransaction: 0
    };

    // Get pending earnings
    const pendingEarnings = await db.collection('orders').aggregate([
      {
        $match: {
          sellerId: sellerId,
          status: { $in: ['pending', 'processing', 'shipped'] }
        }
      },
      {
        $group: {
          _id: null,
          pending: { $sum: { $toDouble: "$amount" } }
        }
      }
    ]).toArray();

    earnings.pending = pendingEarnings[0]?.pending || 0;

    // Get top selling items
    const topItems = await db.collection('orders').aggregate([
      {
        $match: {
          sellerId: sellerId,
          status: { $in: ['completed', 'delivered', 'paid'] }
        }
      },
      {
        $group: {
          _id: "$itemId",
          title: { $first: "$itemTitle" },
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: { $toDouble: "$amount" } }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 }
    ]).toArray();

    earnings.topSellingItems = topItems.map(item => ({
      title: item.title,
      price: (item.totalRevenue / item.totalSales).toFixed(2),
      sales: item.totalSales
    }));

    res.status(200).json(earnings);
  } catch (error) {
    console.error('Error fetching earnings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}