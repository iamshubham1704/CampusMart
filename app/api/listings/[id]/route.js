import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongo';
import { verifyToken } from '../../../../lib/auth';
import { ObjectId } from 'mongodb';

// GET single listing
export async function GET(request, { params }) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const client = await clientPromise;
    const db = client.db('campusmart');

    const listing = await db.collection('listings').findOne({
      _id: new ObjectId(id)
    });

    if (!listing) {
      return NextResponse.json({ success: false, message: 'Listing not found' }, { status: 404 });
    }

    // Transform data
    const transformedListing = {
      id: listing._id.toString(),
      title: listing.title,
      description: listing.description,
      price: listing.price * 1.1,
      originalPrice: listing.originalPrice,
      condition: listing.condition,
      category: listing.category,
      subcategory: listing.subcategory,
      location: listing.location,
      college: listing.college,
      images: listing.images || [],
      tags: listing.tags || [],
      status: listing.status,
      views: listing.views || 0,
      createdAt: listing.createdAt
    };

    return NextResponse.json({
      success: true,
      listing: transformedListing
    });

  } catch (error) {

    return NextResponse.json({ success: false, message: 'Failed to fetch listing' }, { status: 500 });
  }
}

// PUT update listing
export async function PUT(request, { params }) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const userId = decoded.sellerId || decoded.userId || decoded.id || decoded.sub;
    const { id } = await params; // Fixed: Added await
    const body = await request.json();

    const client = await clientPromise;
    const db = client.db('campusmart');

    // Check if listing belongs to user
    const existingListing = await db.collection('listings').findOne({
      _id: new ObjectId(id),
      sellerId: new ObjectId(userId)
    });

    if (!existingListing) {
      return NextResponse.json({ 
        success: false, 
        message: 'Listing not found or you do not have permission to edit it' 
      }, { status: 404 });
    }

    // Update the listing
    const updateData = {
      ...body,
      price: body.price ? Number(body.price) : existingListing.price,
      originalPrice: body.originalPrice ? Number(body.originalPrice) : existingListing.originalPrice,
      updatedAt: new Date()
    };

    const result = await db.collection('listings').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, message: 'Listing not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Listing updated successfully'
    });

  } catch (error) {

    return NextResponse.json({ success: false, message: 'Failed to update listing' }, { status: 500 });
  }
}

// DELETE listing
export async function DELETE(request, { params }) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const userId = decoded.sellerId || decoded.userId || decoded.id || decoded.sub;
    const { id } = await params;

    const client = await clientPromise;
    const db = client.db('campusmart');

    // First find the listing to check ownership
    const listing = await db.collection('listings').findOne({
      _id: new ObjectId(id)
    });

    if (!listing) {
      return NextResponse.json({ 
        success: false, 
        message: 'Listing not found' 
      }, { status: 404 });
    }

    // Check ownership - handle both string and ObjectId formats
    let isOwner = false;
    
    if (listing.sellerId instanceof ObjectId) {
      // If sellerId is stored as ObjectId, compare with ObjectId
      isOwner = listing.sellerId.equals(new ObjectId(userId));
    } else {
      // If sellerId is stored as string, compare as strings
      isOwner = listing.sellerId === userId;
    }

    if (!isOwner) {
      return NextResponse.json({ 
        success: false, 
        message: 'You do not have permission to delete this listing' 
      }, { status: 403 });
    }

    // Delete the listing
    const result = await db.collection('listings').deleteOne({
      _id: new ObjectId(id)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to delete listing' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Listing deleted successfully'
    });

  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to delete listing' }, { status: 500 });
  }
}