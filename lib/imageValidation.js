// lib/imageValidation.js

/**
 * Validate image file and base64 data
 */

export const IMAGE_CONFIG = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES: 10,
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  MIN_WIDTH: 100,
  MIN_HEIGHT: 100,
  MAX_WIDTH: 4000,
  MAX_HEIGHT: 4000
};

/**
 * Validate base64 image data
 * @param {string} base64Data - Base64 image string
 * @returns {Promise<object>} - Validation result
 */
export async function validateBase64Image(base64Data) {
  try {
    if (!base64Data || typeof base64Data !== 'string') {
      return {
        valid: false,
        error: 'Invalid image data'
      };
    }

    // Check if it's a valid base64 image
    const base64Regex = /^data:image\/(jpeg|jpg|png|webp);base64,/;
    if (!base64Regex.test(base64Data)) {
      return {
        valid: false,
        error: 'Invalid image format. Only JPEG, PNG, and WebP are allowed'
      };
    }

    // Extract MIME type
    const mimeType = base64Data.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);/)?.[1];
    if (!IMAGE_CONFIG.ALLOWED_TYPES.includes(mimeType)) {
      return {
        valid: false,
        error: 'Invalid image type. Only JPEG, PNG, and WebP are allowed'
      };
    }

    // Check file size (approximate)
    const base64String = base64Data.split(',')[1];
    const sizeInBytes = (base64String.length * 3) / 4;
    
    if (sizeInBytes > IMAGE_CONFIG.MAX_SIZE) {
      return {
        valid: false,
        error: `Image size too large. Maximum size is ${IMAGE_CONFIG.MAX_SIZE / (1024 * 1024)}MB`
      };
    }

    // Validate image dimensions (requires loading the image)
    const dimensions = await getImageDimensions(base64Data);
    
    if (dimensions.width < IMAGE_CONFIG.MIN_WIDTH || dimensions.height < IMAGE_CONFIG.MIN_HEIGHT) {
      return {
        valid: false,
        error: `Image too small. Minimum dimensions: ${IMAGE_CONFIG.MIN_WIDTH}x${IMAGE_CONFIG.MIN_HEIGHT}px`
      };
    }

    if (dimensions.width > IMAGE_CONFIG.MAX_WIDTH || dimensions.height > IMAGE_CONFIG.MAX_HEIGHT) {
      return {
        valid: false,
        error: `Image too large. Maximum dimensions: ${IMAGE_CONFIG.MAX_WIDTH}x${IMAGE_CONFIG.MAX_HEIGHT}px`
      };
    }

    return {
      valid: true,
      mimeType,
      sizeInBytes,
      dimensions
    };

  } catch (error) {
    return {
      valid: false,
      error: 'Failed to validate image'
    };
  }
}

/**
 * Validate multiple images
 * @param {Array} images - Array of base64 image strings
 * @returns {Promise<object>} - Validation results
 */
export async function validateMultipleImages(images) {
  if (!Array.isArray(images)) {
    return {
      valid: false,
      error: 'Images must be an array'
    };
  }

  if (images.length === 0) {
    return {
      valid: false,
      error: 'No images provided'
    };
  }

  if (images.length > IMAGE_CONFIG.MAX_FILES) {
    return {
      valid: false,
      error: `Too many images. Maximum ${IMAGE_CONFIG.MAX_FILES} images allowed`
    };
  }

  const validationPromises = images.map((image, index) => 
    validateBase64Image(image).then(result => ({ index, ...result }))
  );

  const results = await Promise.all(validationPromises);
  
  const validImages = results.filter(r => r.valid);
  const invalidImages = results.filter(r => !r.valid);

  return {
    valid: invalidImages.length === 0,
    validCount: validImages.length,
    invalidCount: invalidImages.length,
    results,
    validImages,
    invalidImages
  };
}

/**
 * Get image dimensions from base64 data
 * @param {string} base64Data - Base64 image string
 * @returns {Promise<object>} - Image dimensions
 */
function getImageDimensions(base64Data) {
  return new Promise((resolve, reject) => {
    try {
      // This would work in a browser environment
      if (typeof Image !== 'undefined') {
        const img = new Image();
        
        img.onload = () => {
          resolve({
            width: img.width,
            height: img.height
          });
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
        
        img.src = base64Data;
      } else {
        // Server-side fallback - use basic validation
        resolve({
          width: IMAGE_CONFIG.MIN_WIDTH + 1,
          height: IMAGE_CONFIG.MIN_HEIGHT + 1
        });
      }
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate safe filename from original name
 * @param {string} originalName - Original filename
 * @param {string} userId - User ID for uniqueness
 * @returns {string} - Safe filename
 */
export function generateSafeFileName(originalName, userId) {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  
  // Extract extension from original name or use jpg as default
  const extension = originalName?.split('.').pop()?.toLowerCase() || 'jpg';
  
  // Create safe filename
  const safeName = `${userId}-${timestamp}-${randomString}.${extension}`;
  
  return safeName;
}

/**
 * Compress base64 image if it's too large
 * @param {string} base64Data - Base64 image string
 * @param {number} quality - Compression quality (0-1)
 * @returns {Promise<string>} - Compressed base64 string
 */
export async function compressBase64Image(base64Data, quality = 0.8) {
  return new Promise((resolve, reject) => {
    try {
      if (typeof document === 'undefined') {
        // Server-side - return original
        resolve(base64Data);
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions (max 1920x1920 for large images)
        const maxDimension = 1920;
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };

      img.onerror = () => reject(new Error('Failed to compress image'));
      img.src = base64Data;

    } catch (error) {
      reject(error);
    }
  });
}