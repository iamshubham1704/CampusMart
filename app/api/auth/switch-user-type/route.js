import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { getServerSession } from 'next-auth';

export async function POST(request) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { newUserType } = await request.json();
    
    if (!newUserType || !['buyer', 'seller'].includes(newUserType)) {
      return NextResponse.json({ error: 'Invalid user type' }, { status: 400 });
    }

    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();

    // Get user data from current collection
    let userData;
    if (newUserType === 'seller') {
      userData = await db.collection('buyers').findOne({ email: session.user.email });
      if (userData) {
        // Move from buyers to sellers
        const sellerData = {
          name: userData.name,
          email: userData.email,
          image: userData.image,
          provider: userData.provider,
          googleId: userData.googleId,
          phone: userData.phone || '',
          userType: 'seller',
          createdAt: userData.createdAt,
          updatedAt: new Date(),
        };
        
        await db.collection('sellers').insertOne(sellerData);
        await db.collection('buyers').deleteOne({ email: session.user.email });
      }
    } else {
      userData = await db.collection('sellers').findOne({ email: session.user.email });
      if (userData) {
        // Move from sellers to buyers
        const buyerData = {
          name: userData.name,
          email: userData.email,
          image: userData.image,
          provider: userData.provider,
          googleId: userData.googleId,
          phone: userData.phone || '',
          college: '',
          userType: 'buyer',
          createdAt: userData.createdAt,
          updatedAt: new Date(),
        };
        
        await db.collection('buyers').insertOne(buyerData);
        await db.collection('sellers').deleteOne({ email: session.user.email });
      }
    }

    await client.close();
    
    return NextResponse.json({ message: 'User type updated successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}