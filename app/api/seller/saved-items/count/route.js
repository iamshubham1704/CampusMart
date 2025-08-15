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

    // Count items saved by other users for this seller's listings
    const count = await db.collection('savedItems').aggregate([
      {
        $lookup: {
          from: 'listings',
          localField: 'listingId',
          foreignField: '_id',
          as: 'listing'
        }
      },
      {
        $match: {
          'listing.sellerId': sellerId
        }
      },
      {
        $count: 'total'
      }
    ]).toArray();

    return NextResponse.json({
      success: true,
      count: count[0]?.total || 0
    });
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}