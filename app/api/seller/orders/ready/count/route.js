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

    // Build seller id candidates to handle mixed storage types
    const sellerIdCandidates = [sellerId];
    if (typeof sellerId === 'string' && ObjectId.isValid(sellerId)) {
      try { sellerIdCandidates.push(new ObjectId(sellerId)); } catch (_) {}
    }

    // Fetch all verified orders for the seller
    const verifiedOrders = await db.collection('orders')
      .find({ sellerId: { $in: sellerIdCandidates }, status: 'payment_verified' })
      .project({ _id: 1 })
      .toArray();

    if (verifiedOrders.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    const orderIdObjects = verifiedOrders.map(o => o._id).filter(Boolean);
    const orderIdStrings = orderIdObjects.map(id => String(id));

    // Find transactions for these orders for this seller (handle string/ObjectId orderId variants)
    const existingTx = await db.collection('seller_transactions')
      .find({
        sellerId: { $in: sellerIdCandidates },
        $or: [
          { orderId: { $in: orderIdObjects } },
          { orderId: { $in: orderIdStrings } }
        ]
      })
      .project({ orderId: 1 })
      .toArray();

    const existingOrderIdSet = new Set(
      existingTx.map(t => (typeof t.orderId === 'string' ? t.orderId : String(t.orderId)))
    );

    const readyCount = verifiedOrders.reduce((count, o) => {
      const idStr = String(o._id);
      return existingOrderIdSet.has(idStr) ? count : count + 1;
    }, 0);

    return NextResponse.json({ success: true, count: readyCount });
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


