// hooks/useImageUpload.js
import { useState, useCallback } from 'react';

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  /**
   * Convert file to base64
   */
  const fileToBase64 = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }, []);

  /**
   * Validate image file before upload
   */
  const validateImageFile = useCallback((file) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
    }

    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum size is 10MB.');
    }

    return true;
  }, []);

  /**
   * Process multiple files and convert to base64
   */
  const processFiles = useCallback(async (files) => {
    const processedFiles = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        validateImageFile(file);
        const base64 = await fileToBase64(file);
        
        processedFiles.push({
          base64Data: base64,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        });
        
        // Update progress
        setUploadProgress(Math.round((i + 1) / files.length * 50)); // 50% for processing
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error.message);
        throw new Error(`Error processing ${file.name}: ${error.message}`);
      }
    }

    return processedFiles;
  }, [validateImageFile, fileToBase64]);

  /**
   * Upload images to server
   */
  const uploadImages = useCallback(async (files, folder = 'general') => {
    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Process files to base64
      const processedFiles = await processFiles(files);
      setUploadProgress(60); // 60% after processing

      // Upload to server
      const response = await fetch('/api/upload/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: processedFiles.map(f => f.base64Data),
          folder
        })
      });

      setUploadProgress(90); // 90% after server upload

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Upload failed');
      }

      setUploadProgress(100); // 100% complete
      
      // Clear progress after a short delay
      setTimeout(() => {
        setUploadProgress(0);
        setUploading(false);
      }, 1000);

      return {
        success: true,
        images: result.images,
        totalUploaded: result.totalUploaded,
        totalFailed: result.totalFailed
      };

    } catch (error) {
      setError(error.message);
      setUploading(false);
      setUploadProgress(0);
      
      return {
        success: false,
        error: error.message
      };
    }
  }, [processFiles]);

  /**
   * Upload single image
   */
  const uploadSingleImage = useCallback(async (file, folder = 'general') => {
    const result = await uploadImages([file], folder);
    
    if (result.success && result.images.length > 0) {
      return {
        success: true,
        image: result.images[0]
      };
    }
    
    return result;
  }, [uploadImages]);

  /**
   * Delete image from ImageKit
   */
  const deleteImage = useCallback(async (fileId) => {
    try {
      const response = await fetch('/api/upload/images', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Delete failed');
      }

      return { success: true };

    } catch (error) {
      setError(error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }, []);

  /**
   * Reset hook state
   */
  const reset = useCallback(() => {
    setUploading(false);
    setUploadProgress(0);
    setError(null);
  }, []);

  return {
    uploading,
    uploadProgress,
    error,
    uploadImages,
    uploadSingleImage,
    deleteImage,
    processFiles,
    reset
  };
};