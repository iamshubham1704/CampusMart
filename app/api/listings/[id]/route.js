import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongo';
import { verifyToken } from '../../../../lib/auth';
import { uploadMultipleImages, deleteMultipleImages } from '../../../../lib/imagekit';
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

    // Transform data - handle both old base64 format and new ImageKit format
    const transformedListing = {
      id: listing._id.toString(),
      title: listing.title,
      description: listing.description,
      price: listing.price,
      originalPrice: listing.originalPrice,
      condition: listing.condition,
      category: listing.category,
      subcategory: listing.subcategory,
      location: listing.location,
      college: listing.college,
      images: listing.images || [], // Now contains ImageKit URLs with metadata
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
    console.error('❌ Get listing error:', error);
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
    const { id } = await params;
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

    let uploadedImages = existingListing.images || [];
    
    // Handle image updates
    if (body.images && Array.isArray(body.images)) {
      const newImages = body.images.filter(img => 
        typeof img === 'string' && img.startsWith('data:')
      );

      if (newImages.length > 0) {
        console.log(`📤 Processing ${newImages.length} new images for listing update`);
        
        // Prepare new images for upload
        const imagesToUpload = newImages.map((base64Data, index) => ({
          base64Data,
          fileName: `listing-${id}-update-${Date.now()}-${index + 1}.jpg`
        }));

        // Upload new images to ImageKit
        const uploadResult = await uploadMultipleImages(
          imagesToUpload, 
          `listings/${userId}`
        );

        if (uploadResult.success && uploadResult.successful.length > 0) {
          const newUploadedImages = uploadResult.successful.map(result => ({
            url: result.data.url,
            thumbnailUrl: result.data.thumbnailUrl,
            fileId: result.data.fileId,
            fileName: result.data.fileName,
            width: result.data.width,
            height: result.data.height
          }));
          
          // Add new images to existing ones
          uploadedImages = [...uploadedImages, ...newUploadedImages];
          console.log(`✅ Successfully uploaded ${newUploadedImages.length} new images`);
        }
      }

      // Handle image deletions (if frontend sends image removal requests)
      if (body.imagesToDelete && body.imagesToDelete.length > 0) {
        const fileIdsToDelete = body.imagesToDelete
          .filter(img => img.fileId)
          .map(img => img.fileId);

        if (fileIdsToDelete.length > 0) {
          console.log(`🗑️ Deleting ${fileIdsToDelete.length} images`);
          const deleteResult = await deleteMultipleImages(fileIdsToDelete);
          
          if (deleteResult.success) {
            // Remove deleted images from the uploadedImages array
            uploadedImages = uploadedImages.filter(img => 
              !fileIdsToDelete.includes(img.fileId)
            );
            console.log(`✅ Successfully deleted ${deleteResult.totalDeleted} images`);
          }
        }
      }
    }

    // Prepare update data
    const updateData = {
      ...body,
      price: body.price ? Number(body.price) : existingListing.price,
      originalPrice: body.originalPrice ? Number(body.originalPrice) : existingListing.originalPrice,
      images: uploadedImages, // Use processed images
      updatedAt: new Date()
    };

    // Remove image processing fields from update data
    delete updateData.imagesToDelete;

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
    console.error('❌ Update listing error:', error);
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

    // First find the listing to check ownership and get image data
    const listing = await db.collection('listings').findOne({
      _id: new ObjectId(id)
    });

    if (!listing) {
      return NextResponse.json({ 
        success: false, 
        message: 'Listing not found' 
      }, { status: 404 });
    }

    // Check ownership
    let isOwner = false;
    if (listing.sellerId instanceof ObjectId) {
      isOwner = listing.sellerId.equals(new ObjectId(userId));
    } else {
      isOwner = listing.sellerId === userId;
    }

    if (!isOwner) {
      return NextResponse.json({ 
        success: false, 
        message: 'You do not have permission to delete this listing' 
      }, { status: 403 });
    }

    // Delete associated images from ImageKit
    if (listing.images && listing.images.length > 0) {
      const fileIdsToDelete = listing.images
        .filter(img => img.fileId)
        .map(img => img.fileId);

      if (fileIdsToDelete.length > 0) {
        console.log(`🗑️ Deleting ${fileIdsToDelete.length} images from ImageKit`);
        const deleteResult = await deleteMultipleImages(fileIdsToDelete);
        
        if (deleteResult.success) {
          console.log(`✅ Successfully deleted ${deleteResult.totalDeleted} images from ImageKit`);
        } else {
          console.warn(`⚠️ Some images failed to delete from ImageKit`);
        }
      }
    }

    // Delete the listing from database
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
    console.error('❌ Delete listing error:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete listing' }, { status: 500 });
  }
}