import { NextResponse } from 'next/server';
import clientPromise from '../../../../../../lib/mongo';
import { ObjectId } from 'mongodb';

export async function POST(request, context) {
  try {
    // Await params before accessing properties
    const params = await context.params;
    
    const client = await clientPromise;
    const db = client.db('campusmart');
    
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid listing ID' },
        { status: 400 }
      );
    }
    
    // Increment view count
    await db.collection('listings').updateOne(
      { _id: new ObjectId(params.id) },
      { $inc: { views: 1 } }
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating view count:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update views' },
      { status: 500 }
    );
  }
}