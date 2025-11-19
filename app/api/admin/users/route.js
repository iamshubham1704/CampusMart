// app/api/admin/users/route.js
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongo';
import { verifyAdminToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// GET - Fetch available users for team assignment
export async function GET(request) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'seller' or 'buyer'
    const search = searchParams.get('search'); // Search text
    const limitParam = parseInt(searchParams.get('limit') || '200', 10);

    const client = await clientPromise;
    const db = client.db('campusmart');

    // Build filters for buyers and sellers separately
    const buildFilter = () => {
      const f = {};
    if (search) {
        f.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
          { college: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ];
      }
      return f;
    };

    const projection = { _id: 1, name: 1, email: 1, phone: 1, college: 1, isActive: 1, createdAt: 1 };

    const shouldFetchBuyers = !type || type === 'buyer';
    const shouldFetchSellers = !type || type === 'seller';

    // Optimize queries by adding indexes and limiting fields
    const optimizedProjection = {
      _id: 1,
      name: 1,
      email: 1,
      phone: 1,
      college: 1,
      isActive: 1,
      createdAt: 1
    };
    
    const [buyers, sellers] = await Promise.all([
      shouldFetchBuyers
        ? db.collection('buyers').find(buildFilter(), { projection: optimizedProjection }).sort({ createdAt: -1 }).limit(limitParam).toArray()
        : Promise.resolve([]),
      shouldFetchSellers
        ? db.collection('sellers').find(buildFilter(), { projection: optimizedProjection }).sort({ createdAt: -1 }).limit(limitParam).toArray()
        : Promise.resolve([])
    ]);

    // Normalize into a single list
    const normalized = [
      ...buyers.map(b => ({ ...b, role: 'buyer', userType: 'buyer' })),
      ...sellers.map(s => ({ ...s, role: 'seller', userType: 'seller' }))
    ]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, limitParam);

    return NextResponse.json({ 
      success: true, 
      data: normalized,
      total: normalized.length
    }, { status: 200 });
  } catch (error) {
    console.error('GET /api/admin/users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update user status (ban/unban)
export async function PUT(request) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized. Admin access required.' 
      }, { status: 401 });
    }

    const { userId, userType, isActive } = await request.json();

    if (!userId || !userType || typeof isActive !== 'boolean') {
      return NextResponse.json({ 
        success: false,
        error: 'Missing required fields: userId, userType, isActive' 
      }, { status: 400 });
    }

    if (!['buyer', 'seller'].includes(userType)) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid userType. Must be buyer or seller' 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');

    let objectId;
    try {
      objectId = new ObjectId(userId);
    } catch (error) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid userId format' 
      }, { status: 400 });
    }

    const collection = userType === 'buyer' ? 'buyers' : 'sellers';
    
    // Update user status
    const result = await db.collection(collection).updateOne(
      { _id: objectId },
      { 
        $set: { 
          isActive: isActive,
          updatedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'User not found' 
      }, { status: 404 });
    }

    // Get updated user data
    const updatedUser = await db.collection(collection).findOne(
      { _id: objectId },
      { projection: { password: 0 } }
    );

    return NextResponse.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'banned'} successfully`,
      data: {
        ...updatedUser,
        userType
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating user status:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}