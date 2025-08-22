import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongo';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// Verify buyer token and return decoded payload or null
function verifyBuyer(request) {
  const decoded = verifyToken(request);
  if (!decoded) return null;
  if (decoded.role === 'buyer' || decoded.buyerId || decoded.userId || decoded.id) {
    return decoded;
  }
  return null;
}

// GET - Fetch pickups visible to the buyer (optionally filter by deliveryId)
export async function GET(request) {
  try {
    const buyer = verifyBuyer(request);
    if (!buyer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const deliveryId = searchParams.get('deliveryId');

    const client = await clientPromise;
    const db = client.db('campusmart');

    const filter = {
      buyerId: new ObjectId(buyer.buyerId || buyer.userId || buyer.id)
    };

    if (deliveryId) {
      try {
        filter.deliveryId = new ObjectId(deliveryId);
      } catch (e) {
        return NextResponse.json({ error: 'Invalid delivery ID' }, { status: 400 });
      }
    }

    const pickups = await db.collection('pickups').aggregate([
      { $match: filter },
      { $lookup: { from: 'listings', localField: 'productId', foreignField: '_id', as: 'product' } },
      { $lookup: { from: 'admin_schedules', localField: 'adminScheduleId', foreignField: '_id', as: 'adminSchedule' } },
      { $lookup: { from: 'deliveries', localField: 'deliveryId', foreignField: '_id', as: 'delivery' } },
      { $addFields: {
        product: { $arrayElemAt: ['$product', 0] },
        adminSchedule: { $arrayElemAt: ['$adminSchedule', 0] },
        delivery: { $arrayElemAt: ['$delivery', 0] }
      } }
    ]).toArray();

    return NextResponse.json({ success: true, data: pickups }, { status: 200 });
  } catch (error) {
    console.error('GET /api/buyer/pickups error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


