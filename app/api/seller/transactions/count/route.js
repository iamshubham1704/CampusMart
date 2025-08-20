import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import clientPromise from '@/lib/mongo';
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const sellerId = decoded.sellerId || decoded.userId || decoded.id;
    if (!sellerId) {
      return NextResponse.json({ message: 'Seller not found in token' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');

    const sellerIdCandidates = [sellerId];
    if (typeof sellerId === 'string' && ObjectId.isValid(sellerId)) {
      try { sellerIdCandidates.push(new ObjectId(sellerId)); } catch (_) {}
    }

    // Include both 'pending' and 'processing' as available requests for the seller
    const count = await db.collection('seller_transactions').countDocuments({
      sellerId: { $in: sellerIdCandidates },
      status: { $in: ['pending', 'processing'] }
    });

    return NextResponse.json({ success: true, count });
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


