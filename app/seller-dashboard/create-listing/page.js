"use client";
import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, X, Plus } from 'lucide-react';
import { listingsAPI } from '../../utils/api';
import { useImageUpload } from '../../../hooks/useImageUpload';
import colleges from '../../utils/colleges';
import styles from './CreateListing.module.css'; 

const CreateListing = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    originalPrice: '',
    condition: '',
    category: '',
    subcategory: '',
    location: '',
    college: '',
    images: [], // Will store File objects and preview URLs
    tags: []
  });

  const [tagInput, setTagInput] = useState('');
  const { uploadSingleImage } = useImageUpload();

  // Categories for dropdown
  const categories = [
    'Electronics',
    'Books',
    'Furniture',
    'Clothing',
    'Sports',
    'Vehicles',
    'Stationery',
    'Other'
  ];

  const conditions = [
    'Like New',
    'Excellent', 
    'Good',
    'Fair'
  ];

  // Add validation helper function
  const validateField = (name, value) => {
    switch (name) {
      case 'title':
        if (!value.trim()) return 'Title is required';
        if (value.trim().length < 5) return 'Title must be at least 5 characters';
        if (value.trim().length > 100) return 'Title must be less than 100 characters';
        return null;
      
      case 'description':
        if (!value.trim()) return 'Description is required';
        if (value.trim().length < 20) return 'Description must be at least 20 characters';
        if (value.trim().length > 1000) return 'Description must be less than 1000 characters';
        return null;
      
      case 'price':
        if (!value) return 'Price is required';
        if (isNaN(parseFloat(value))) return 'Please enter a valid price';
        if (parseFloat(value) <= 0) return 'Price must be greater than 0';
        return null;
      
      case 'originalPrice':
        if (value && isNaN(parseFloat(value))) return 'Please enter a valid original price';
        if (value && parseFloat(value) <= 0) return 'Original price must be greater than 0';
        if (value && parseFloat(value) <= parseFloat(formData.price)) {
          return 'Original price should be higher than selling price';
        }
        return null;
      
      default:
        return null;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Clear any existing errors or success messages when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
    
    // Special handling for price fields to ensure valid numbers
    let processedValue = value;
    if (name === 'price' || name === 'originalPrice') {
      // Remove any non-numeric characters except decimal point
      processedValue = value.replace(/[^0-9.]/g, '');
      // Ensure only one decimal point
      const parts = processedValue.split('.');
      if (parts.length > 2) {
        processedValue = parts[0] + '.' + parts.slice(1).join('');
      }
      // Limit to 2 decimal places
      if (parts.length === 2 && parts[1].length > 2) {
        processedValue = parts[0] + '.' + parts[1].substring(0, 2);
      }
    }
    
    const newFormData = {
      ...formData,
      [name]: processedValue
    };
    
    setFormData(newFormData);
    
    // Check if all required fields are now filled and clear error
    const requiredFieldsFilled = 
      newFormData.title?.trim() &&
      newFormData.description?.trim() &&
      newFormData.price &&
      newFormData.condition &&
      newFormData.category &&
      newFormData.location?.trim();
    
    if (requiredFieldsFilled && error) {
      setError('');
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleImageAdd = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    if (!files.length) return;

    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      setError('Please select only image files (JPEG, JPG, PNG, WebP)');
      return;
    }

    // Check if adding these files would exceed the limit
    const totalImages = formData.images.length + files.length;
    if (totalImages > 5) {
      setError(`You can only add ${5 - formData.images.length} more image(s). Maximum 5 images allowed.`);
      return;
    }

    // Validate file sizes (max 10MB each)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = files.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      setError('Each image must be smaller than 10MB');
      return;
    }

    setError(''); // Clear any previous errors

    // Create preview URLs and add files to state
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = {
          file: file,
          preview: e.target.result,
          name: file.name
        };
        
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, imageData]
        }));
      };
      reader.readAsDataURL(file);
    });

    // Reset file input
    e.target.value = '';
  };

  const handleImageRemove = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear any previous errors
    setError('');
    
    // Enhanced validation - check for empty or whitespace-only strings
    const requiredFields = {
      title: formData.title?.trim(),
      description: formData.description?.trim(),
      price: formData.price,
      condition: formData.condition,
      category: formData.category,
      location: formData.location?.trim()
    };
    
    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value || value === '')
      .map(([key]) => key);
    
    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    // Enhanced price validation for mobile devices
    if (formData.price && (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0)) {
      setError('Please enter a valid price greater than 0');
      return;
    }

    if (formData.originalPrice && formData.originalPrice !== '') {
      if (isNaN(parseFloat(formData.originalPrice)) || parseFloat(formData.originalPrice) <= 0) {
        setError('Please enter a valid original price greater than 0');
        return;
      }
      if (parseFloat(formData.originalPrice) <= parseFloat(formData.price)) {
        setError('Original price should be higher than selling price');
        return;
      }
    }

    if (formData.images.length === 0) {
      setError('Please add at least one image of your item');
      return;
    }

    setLoading(true);

    try {
      // Enhanced mobile device handling - ensure all data is properly formatted
      const processedFormData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        condition: formData.condition,
        category: formData.category,
        subcategory: formData.subcategory || '',
        location: formData.location.trim(),
        college: formData.college || '',
        tags: formData.tags || [],
        images: []
      };

      // 1) Upload images one-by-one to keep each request small
      const uploadedImages = [];
      for (const imageData of formData.images) {
        try {
          const uploadRes = await uploadSingleImage(imageData.file, 'listings');
          if (!uploadRes.success) {
            throw new Error(uploadRes.error || 'Image upload failed');
          }
          uploadedImages.push(uploadRes.image);
        } catch (imageError) {
          console.error('Image upload error:', imageError);
          throw new Error(`Failed to upload image: ${imageError.message}`);
        }
      }

      // 2) Submit listing with processed data
      const jsonData = {
        ...processedFormData,
        images: uploadedImages
      };

      const result = await listingsAPI.createListing(jsonData);

      if (result.success) {
        setSuccess('Listing created successfully! Redirecting to dashboard...');
        setTimeout(() => {
          router.push('/seller-dashboard');
        }, 1500);
      } else {
        setError(result.message || 'Failed to create listing');
      }
    } catch (err) {
      console.error('Create listing error:', err);
      
      // Enhanced error handling for mobile devices
      let errorMessage = err.message || 'Failed to create listing';
      
      // Check for specific mobile-related errors
      if (errorMessage.includes('pattern') || errorMessage.includes('string')) {
        errorMessage = 'Data validation error. Please check your input and try again. If the problem persists, try clearing your browser cache and cookies.';
      } else if (errorMessage.includes('Unauthorized') || errorMessage.includes('token')) {
        errorMessage = 'Authentication error. Please log in again.';
      } else if (errorMessage.includes('upload')) {
        errorMessage = 'Image upload failed. Please check your internet connection and try again.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button 
          onClick={() => router.back()}
          className={styles.backButton}
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <h1 className={styles.title}>Create New Listing</h1>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          <strong>⚠️ Error:</strong> {error}
        </div>
      )}

      {success && (
        <div className={styles.successMessage}>
          <strong>✅ Success:</strong> {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        {/* Basic Info */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Basic Information</h2>
          
          <div className={styles.inputGroup}>
            <label className={styles.label}>Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter item title"
              className={styles.input}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your item in detail, give all details about your item. Providing more detials will make chances higher of selling your item."
              className={styles.textarea}
              rows="4"
              required
            />
          </div>

          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Price (₹) *</label>
              <input
                type="text"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="0"
                className={styles.input}
                required
                inputMode="decimal"
                pattern="[0-9]*[.]?[0-9]{0,2}"
                title="Please enter a valid price (e.g., 100 or 99.99)"
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Original Price (₹) [Market Price]</label>
              <input
                type="text"
                name="originalPrice"
                value={formData.originalPrice}
                onChange={handleInputChange}
                placeholder="Optional"
                className={styles.input}
                inputMode="decimal"
                pattern="[0-9]*[.]?[0-9]{0,2}"
                title="Please enter a valid price (e.g., 100 or 99.99)"
              />
            </div>
          </div>
        </div>

        {/* Category & Condition */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Category & Condition</h2>
          
          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={styles.select}
                required
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Condition *</label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleInputChange}
                className={styles.select}
                required
              >
                <option value="">Select Condition</option>
                {conditions.map(condition => (
                  <option key={condition} value={condition}>{condition}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Location</h2>
          
          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Location *</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., Campus, Hostel Block A"
                className={styles.input}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>College</label>
              <select
                name="college"
                value={formData.college}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Select College</option>
                {colleges.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Images *</h2>
          <p className={`${styles.sectionSubtitle} ${styles.imagesInfo}`}>
            Add up to 5 photos of your item (JPEG, JPG, PNG, WebP - Max 10MB each)
          </p>
          <p className={`${styles.sectionSubtitle} ${styles.imagesRecommendation}`}>
            Recommended: upload at least 3 images for better visibility (not compulsory).
          </p>
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          
          <div className={styles.imageGrid}>
            {formData.images.map((imageData, index) => (
              <div key={index} className={styles.imageContainer}>
                <img 
                  src={imageData.preview} 
                  alt={`Item ${index + 1}`} 
                  className={styles.image} 
                />
                <button
                  type="button"
                  onClick={() => handleImageRemove(index)}
                  className={styles.removeImageButton}
                >
                  <X size={16} />
                </button>
                <div className={styles.imageName}>
                  {imageData.name}
                </div>
              </div>
            ))}
            
            {formData.images.length < 5 && (
              <button
                type="button"
                onClick={handleImageAdd}
                className={styles.addImageButton}
              >
                <Upload size={24} />
                <span className={styles.addImageButtonText}>Add Photo</span>
              </button>
            )}
          </div>
          
          {formData.images.length === 0 && (
            <p className={styles.noImagesText}>
              📷 No images added yet. Click "Add Photo" to select images from your device.
            </p>
          )}
        </div>

        {/* Tags */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Tags</h2>
          <p className={styles.sectionSubtitle}>Add keywords to help buyers find your item</p>
          
          <div className={styles.tagInputContainer}>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              placeholder="Add a tag"
              className={styles.tagInput}
            />
            <button
              type="button"
              onClick={handleAddTag}
              className={styles.addTagButton}
            >
              <Plus size={16} />
            </button>
          </div>

          <div className={styles.tagList}>
            {formData.tags.map((tag, index) => (
              <span key={index} className={styles.tag}>
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className={styles.removeTagButton}
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className={styles.submitSection}>
          <button
            type="submit"
            disabled={loading}
            className={styles.submitButton}
          >
            {loading ? 'Creating Listing...' : 'Create Listing'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateListing;