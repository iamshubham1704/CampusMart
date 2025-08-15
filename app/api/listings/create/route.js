import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongo';
import { verifyToken } from '../../../../lib/auth';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const userId = decoded.sellerId || decoded.userId || decoded.id || decoded.sub;
    const body = await request.json();
    
    const {
      title,
      description,
      price,
      originalPrice,
      condition,
      category,
      subcategory,
      location,
      college,
      images,
      tags
    } = body;

    // Basic validation
    if (!title || !description || !price || !condition || !category || !location) {
      return NextResponse.json({
        success: false,
        message: 'Required fields missing: title, description, price, condition, category, location'
      }, { status: 400 });
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('campusmart'); // replace with your database name

    // Create new listing document
    const newListing = {
      sellerId: new ObjectId(userId),
      title,
      description,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : null,
      condition,
      category,
      subcategory: subcategory || null,
      location,
      college: college || null,
      images: images || [],
      tags: tags || [],
      status: 'active',
      views: 0,
      favorites: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert into listings collection
    const result = await db.collection('listings').insertOne(newListing);

    return NextResponse.json({
      success: true,
      message: 'Listing created successfully',
      listing: {
        id: result.insertedId.toString(),
        title,
        price: Number(price),
        condition,
        status: 'active',
        createdAt: newListing.createdAt
      }
    }, { status: 201 });

  } catch (error) {

    return NextResponse.json({
      success: false,
      message: 'Failed to create listing'
    }, { status: 500 });
  }
}