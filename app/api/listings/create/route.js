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
    
    // Enhanced request body parsing with better error handling for mobile devices
    let body;
    const contentType = request.headers.get('content-type') || '';
    
    try {
      if (contentType.includes('multipart/form-data')) {
        const form = await request.formData();
        body = Object.fromEntries(form.entries());
        
        // Handle tags array parsing for mobile devices
        if (typeof body.tags === 'string') {
          try { 
            body.tags = JSON.parse(body.tags); 
          } catch (parseError) {
            console.warn('Failed to parse tags JSON, treating as empty array:', parseError);
            body.tags = [];
          }
        }
        
        // Ensure all string fields are properly trimmed and validated
        if (body.title) body.title = body.title.toString().trim();
        if (body.description) body.description = body.description.toString().trim();
        if (body.location) body.location = body.location.toString().trim();
        if (body.college) body.college = body.college.toString().trim();
        
      } else {
        body = await request.json();
        
        // Ensure all string fields are properly trimmed and validated
        if (body.title) body.title = body.title.toString().trim();
        if (body.description) body.description = body.description.toString().trim();
        if (body.location) body.location = body.location.toString().trim();
        if (body.college) body.college = body.college.toString().trim();
      }
    } catch (parseError) {
      console.error('❌ Request body parsing error:', parseError);
      return NextResponse.json({
        success: false,
        message: 'Invalid request format. Please try again or clear your browser cache.'
      }, { status: 400 });
    }
    
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

    // Enhanced validation with specific error messages for mobile devices
    const validationErrors = [];
    
    if (!title || title.length === 0) {
      validationErrors.push('Title is required');
    } else if (title.length < 5) {
      validationErrors.push('Title must be at least 5 characters long');
    } else if (title.length > 100) {
      validationErrors.push('Title must be less than 100 characters');
    }
    
    if (!description || description.length === 0) {
      validationErrors.push('Description is required');
    } else if (description.length < 20) {
      validationErrors.push('Description must be at least 20 characters long');
    } else if (description.length > 1000) {
      validationErrors.push('Description must be less than 1000 characters');
    }
    
    if (!price || price === '') {
      validationErrors.push('Price is required');
    } else if (isNaN(parseFloat(price))) {
      validationErrors.push('Price must be a valid number');
    } else if (parseFloat(price) <= 0) {
      validationErrors.push('Price must be greater than 0');
    }
    
    if (!condition || condition === '') {
      validationErrors.push('Condition is required');
    }
    
    if (!category || category === '') {
      validationErrors.push('Category is required');
    }
    
    if (!location || location.length === 0) {
      validationErrors.push('Location is required');
    }
    
    if (originalPrice && originalPrice !== '') {
      if (isNaN(parseFloat(originalPrice))) {
        validationErrors.push('Original price must be a valid number');
      } else if (parseFloat(originalPrice) <= 0) {
        validationErrors.push('Original price must be greater than 0');
      } else if (parseFloat(originalPrice) <= parseFloat(price)) {
        validationErrors.push('Original price should be higher than selling price');
      }
    }
    
    if (validationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        message: `Validation failed: ${validationErrors.join(', ')}`,
        errors: validationErrors
      }, { status: 400 });
    }

    let uploadedImages = [];
    
    // Handle images: either pre-uploaded metadata objects or base64 strings
    if (images && images.length > 0) {
      if (typeof images[0] === 'object' && images[0] !== null && (images[0].url || images[0].fileId)) {
        // Already uploaded via /api/upload/images
        uploadedImages = images.map((img) => ({
          url: img.url,
          thumbnailUrl: img.thumbnailUrl,
          fileId: img.fileId,
          fileName: img.fileName,
          width: img.width,
          height: img.height,
          size: img.size
        })).filter(img => img.url);
      } else {
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
          `listings/${userId}`
        );

        if (uploadResult.success && uploadResult.successful.length > 0) {
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