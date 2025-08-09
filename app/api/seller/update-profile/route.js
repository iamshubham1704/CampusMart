import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    const sellers = db.collection('sellers');

    const result = await sellers.updateOne(
      { email: session.user.email },
      { 
        $set: { 
          phone: phone,
          updatedAt: new Date()
        }
      }
    );

    await client.close();

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
