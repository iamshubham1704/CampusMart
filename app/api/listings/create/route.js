import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongo';
import { verifyToken } from '../../../../lib/auth';
import { uploadMultipleImages } from '../../../../lib/imagekit';
import { validateMultipleImages, generateSafeFileName } from '../../../../lib/imageValidation';
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
      images, // This will now be an array of base64 images
      tags
    } = body;

    // Basic validation
    if (!title || !description || !price || !condition || !category || !location) {
      return NextResponse.json({
        success: false,
        message: 'Required fields missing: title, description, price, condition, category, location'
      }, { status: 400 });
    }

    let uploadedImages = [];
    
    // Handle image uploads if images are provided
    if (images && images.length > 0) {
      console.log(`📤 Processing ${images.length} images for listing: ${title}`);
      
      // Validate images first
      const validationResult = await validateMultipleImages(images);
      
      if (!validationResult.valid) {
        return NextResponse.json({
          success: false,
          message: 'Image validation failed',
          errors: validationResult.invalidImages.map(img => img.error)
        }, { status: 400 });
      }

      // Prepare images for upload with safe filenames
      const imagesToUpload = validationResult.validImages.map((imageData, index) => ({
        base64Data: images[imageData.index],
        fileName: generateSafeFileName(`listing-image-${index + 1}.jpg`, userId)
      }));

      // Upload to ImageKit
      const uploadResult = await uploadMultipleImages(
        imagesToUpload, 
        `listings/${userId}` // Organize by user folder
      );

      if (uploadResult.success && uploadResult.successful.length > 0) {
        // Extract URLs from successful uploads
        uploadedImages = uploadResult.successful.map(result => ({
          url: result.data.url,
          thumbnailUrl: result.data.thumbnailUrl,
          fileId: result.data.fileId,
          fileName: result.data.fileName,
          width: result.data.width,
          height: result.data.height
        }));
        
        console.log(`✅ Successfully uploaded ${uploadedImages.length} images`);
      } else {
        console.error('❌ Image upload failed:', uploadResult.error);
        return NextResponse.json({
          success: false,
          message: 'Failed to upload images',
          error: uploadResult.error
        }, { status: 500 });
      }

      // Log any failed uploads
      if (uploadResult.failed && uploadResult.failed.length > 0) {
        console.warn(`⚠️ ${uploadResult.failed.length} images failed to upload:`, 
          uploadResult.failed.map(f => f.error));
      }
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('campusmart');

    // Get global commission percent (default 10)
    let commissionPercent = 10;
    try {
      const settingsDoc = await db.collection('settings').findOne({ _id: 'global_settings' });
      if (settingsDoc && typeof settingsDoc.commissionPercent === 'number') {
        commissionPercent = settingsDoc.commissionPercent;
      }
    } catch (_) {}

    // Create new listing document
    const newListing = {
      sellerId: new ObjectId(userId),
      title,
      description,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : null,
      commission: commissionPercent, // store commission snapshot on listing
      condition,
      category,
      subcategory: subcategory || null,
      location,
      college: college || null,
      images: uploadedImages, // Store ImageKit URLs and metadata
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
        commission: commissionPercent,
        condition,
        status: 'active',
        imagesUploaded: uploadedImages.length,
        createdAt: newListing.createdAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Create listing error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create listing'
    }, { status: 500 });
  }
}