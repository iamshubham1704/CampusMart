import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import clientPromise from '@/lib/mongo';

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const sellerId = decoded.sellerId || decoded.userId || decoded.id;
    
    const client = await clientPromise;
    const db = client.db();

    const reviewsData = await db.collection('reviews').aggregate([
      { $match: { sellerId } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          averageRating: { $avg: '$rating' }
        }
      }
    ]).toArray();

    const result = reviewsData[0] || { count: 0, averageRating: 0 };

    return NextResponse.json({
      success: true,
      count: result.count,
      averageRating: Math.round(result.averageRating * 10) / 10
    });
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}