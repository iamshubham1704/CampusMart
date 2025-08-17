// app/api/upload/images/route.js
import { NextResponse } from 'next/server';
import { verifyToken } from '../../../../lib/auth';
import { uploadMultipleImages, deleteImageFromImageKit } from '../../../../lib/imagekit';

// Upload single or multiple images
export async function POST(request) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const userId = decoded.sellerId || decoded.userId || decoded.id || decoded.sub;
    const body = await request.json();
    const { images, folder = 'general' } = body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No images provided'
      }, { status: 400 });
    }

    console.log(`📤 Processing ${images.length} images for user: ${userId}`);

    // Prepare images for upload
    const imagesToUpload = images.map((imageData, index) => {
      // Handle both base64 string and object with base64Data
      const base64Data = typeof imageData === 'string' ? imageData : imageData.base64Data;
      const fileName = imageData.fileName || `image-${Date.now()}-${index + 1}.jpg`;
      
      return {
        base64Data,
        fileName
      };
    });

    // Upload to ImageKit
    const uploadResult = await uploadMultipleImages(
      imagesToUpload,
      `${folder}/${userId}` // Organize by folder and user
    );

    if (!uploadResult.success) {
      return NextResponse.json({
        success: false,
        message: 'Failed to upload images',
        error: uploadResult.error
      }, { status: 500 });
    }

    // Prepare response data
    const uploadedImages = uploadResult.successful.map(result => ({
      url: result.data.url,
      thumbnailUrl: result.data.thumbnailUrl,
      fileId: result.data.fileId,
      fileName: result.data.fileName,
      width: result.data.width,
      height: result.data.height,
      size: result.data.size
    }));

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${uploadResult.totalUploaded} images`,
      images: uploadedImages,
      totalUploaded: uploadResult.totalUploaded,
      totalFailed: uploadResult.totalFailed,
      failed: uploadResult.failed
    });

  } catch (error) {
    console.error('❌ Image upload error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to upload images'
    }, { status: 500 });
  }
}

// Delete image by fileId
export async function DELETE(request) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fileId } = body;

    if (!fileId) {
      return NextResponse.json({
        success: false,
        message: 'No fileId provided'
      }, { status: 400 });
    }

    console.log(`🗑️ Deleting image: ${fileId}`);

    const deleteResult = await deleteImageFromImageKit(fileId);

    if (!deleteResult.success) {
      return NextResponse.json({
        success: false,
        message: 'Failed to delete image',
        error: deleteResult.error
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
      fileId
    });

  } catch (error) {
    console.error('❌ Image delete error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to delete image'
    }, { status: 500 });
  }
}