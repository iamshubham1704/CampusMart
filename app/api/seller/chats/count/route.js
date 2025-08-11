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

    const count = await db.collection('chats').countDocuments({
      $or: [
        { sellerId },
        { buyerId: sellerId }
      ],
      status: 'active'
    });

    return NextResponse.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error fetching chats count:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
