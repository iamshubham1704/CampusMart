// lib/imagekit.js
import ImageKit from 'imagekit';

// Initialize ImageKit with proper error handling
let imagekit;

try {
  if (!process.env.IMAGEKIT_PUBLIC_KEY || !process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_URL_ENDPOINT) {
    console.warn('⚠️ ImageKit environment variables missing. ImageKit features will be disabled.');
    imagekit = null;
  } else {
    imagekit = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    });
  }
} catch (error) {
  console.error('❌ Failed to initialize ImageKit:', error);
  imagekit = null;
}

/**
 * Upload image to ImageKit from base64 data
 * @param {string} base64Data - Base64 image data (with or without data URL prefix)
 * @param {string} fileName - Name for the uploaded file
 * @param {string} folder - Folder path in ImageKit (optional)
 * @param {object} options - Additional ImageKit options
 * @returns {Promise<object>} - ImageKit upload response
 */
export async function uploadImageToImageKit(base64Data, fileName, folder = 'campusmart', options = {}) {
  if (!imagekit) {
    console.warn('⚠️ ImageKit not initialized. Falling back to base64 storage.');
    return {
      success: false,
      error: 'ImageKit not initialized. Please check environment variables.'
    };
  }

  try {
    // Remove data URL prefix if present
    let cleanBase64 = base64Data;
    if (base64Data.startsWith('data:')) {
      cleanBase64 = base64Data.split(',')[1];
    }

    // Prepare upload parameters
    const uploadParams = {
      file: cleanBase64,
      fileName: fileName,
      folder: folder,
      useUniqueFileName: true,
      ...options
    };

    console.log('📤 Uploading image to ImageKit:', { fileName, folder });

    // Upload to ImageKit
    const response = await imagekit.upload(uploadParams);

    console.log('✅ Image uploaded successfully:', {
      fileId: response.fileId,
      url: response.url,
      fileName: response.name
    });

    return {
      success: true,
      data: {
        fileId: response.fileId,
        fileName: response.name,
        url: response.url,
        thumbnailUrl: response.thumbnailUrl,
        size: response.size,
        filePath: response.filePath,
        width: response.width,
        height: response.height
      }
    };

  } catch (error) {
    console.error('❌ ImageKit upload failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload image'
    };
  }
}

/**
 * Upload multiple images to ImageKit
 * @param {Array} images - Array of {base64Data, fileName} objects
 * @param {string} folder - Folder path in ImageKit
 * @returns {Promise<object>} - Results of all uploads
 */
export async function uploadMultipleImages(images, folder = 'campusmart') {
  if (!imagekit) {
    return {
      success: false,
      error: 'ImageKit not initialized'
    };
  }

  try {
    console.log(`📤 Uploading ${images.length} images to ImageKit...`);

    const uploadPromises = images.map(async (image, index) => {
      try {
        const result = await uploadImageToImageKit(
          image.base64Data, 
          image.fileName || `image-${Date.now()}-${index}`,
          folder
        );
        return { index, ...result };
      } catch (error) {
        return { 
          index, 
          success: false, 
          error: error.message,
          fileName: image.fileName 
        };
      }
    });

    const results = await Promise.all(uploadPromises);
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`✅ Upload complete: ${successful.length} successful, ${failed.length} failed`);

    return {
      success: true,
      results,
      successful,
      failed,
      totalUploaded: successful.length,
      totalFailed: failed.length
    };

  } catch (error) {
    console.error('❌ Multiple image upload failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Delete image from ImageKit
 * @param {string} fileId - ImageKit file ID to delete
 * @returns {Promise<object>} - Delete operation result
 */
export async function deleteImageFromImageKit(fileId) {
  if (!imagekit) {
    return {
      success: false,
      error: 'ImageKit not initialized'
    };
  }

  try {
    console.log('🗑️ Deleting image from ImageKit:', fileId);

    const response = await imagekit.deleteFile(fileId);

    console.log('✅ Image deleted successfully:', fileId);

    return {
      success: true,
      message: 'Image deleted successfully'
    };

  } catch (error) {
    console.error('❌ ImageKit delete failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete image'
    };
  }
}

/**
 * Delete multiple images from ImageKit
 * @param {Array<string>} fileIds - Array of ImageKit file IDs
 * @returns {Promise<object>} - Results of all deletions
 */
export async function deleteMultipleImages(fileIds) {
  if (!imagekit) {
    return {
      success: false,
      error: 'ImageKit not initialized'
    };
  }

  try {
    console.log(`🗑️ Deleting ${fileIds.length} images from ImageKit...`);

    const deletePromises = fileIds.map(async (fileId) => {
      try {
        const result = await deleteImageFromImageKit(fileId);
        return { fileId, ...result };
      } catch (error) {
        return { 
          fileId, 
          success: false, 
          error: error.message 
        };
      }
    });

    const results = await Promise.all(deletePromises);
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`✅ Delete complete: ${successful.length} successful, ${failed.length} failed`);

    return {
      success: true,
      results,
      successful,
      failed,
      totalDeleted: successful.length,
      totalFailed: failed.length
    };

  } catch (error) {
    console.error('❌ Multiple image delete failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Generate optimized image URL with transformations
 * @param {string} imagePath - ImageKit image path
 * @param {object} transformations - ImageKit transformations
 * @returns {string} - Optimized image URL
 */
export function getOptimizedImageUrl(imagePath, transformations = {}) {
  if (!imagekit) {
    return imagePath; // Return original path as fallback
  }

  try {
    const defaultTransformations = {
      width: 800,
      quality: 80,
      format: 'webp',
      ...transformations
    };

    const url = imagekit.url({
      path: imagePath,
      transformation: [defaultTransformations]
    });

    return url;
  } catch (error) {
    console.error('❌ Failed to generate optimized URL:', error);
    return imagePath; // Return original path as fallback
  }
}

/**
 * Generate thumbnail URL
 * @param {string} imagePath - ImageKit image path
 * @param {number} size - Thumbnail size (default: 150px)
 * @returns {string} - Thumbnail URL
 */
export function getThumbnailUrl(imagePath, size = 150) {
  return getOptimizedImageUrl(imagePath, {
    width: size,
    height: size,
    crop: 'at_max',
    quality: 70
  });
}

export default imagekit;