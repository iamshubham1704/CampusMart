"use client";
import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, X, Plus } from 'lucide-react';
import { listingsAPI } from '../../utils/api';
import styles from './CreateListing.module.css'; 

const CreateListing = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: value
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

    // Validate file sizes (e.g., max 5MB each)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = files.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      setError('Each image must be smaller than 5MB');
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
    
    // Basic validation - check for empty or whitespace-only strings
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

    if (formData.images.length === 0) {
      setError('Please add at least one image of your item');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check if API expects FormData or JSON
      // For now, let's try both approaches
      
      // Approach 1: FormData (for APIs that handle multipart/form-data)
      const submitData = new FormData();
      
      // Add text fields with explicit values
      submitData.append('title', formData.title.trim());
      submitData.append('description', formData.description.trim());
      submitData.append('price', formData.price);
      submitData.append('originalPrice', formData.originalPrice || '');
      submitData.append('condition', formData.condition);
      submitData.append('category', formData.category);
      submitData.append('subcategory', formData.subcategory || '');
      submitData.append('location', formData.location.trim());
      submitData.append('college', formData.college || '');
      
      // Add tags as JSON string
      submitData.append('tags', JSON.stringify(formData.tags));
      
      // Add image files
      formData.images.forEach((imageData, index) => {
        submitData.append('images', imageData.file);
      });

      // Debug: Log what we're sending
      ('Submitting form data:');
      for (let [key, value] of submitData.entries()) {
        (key, value);
      }

      let result;
      try {
        result = await listingsAPI.createListing(submitData);
      } catch (formDataError) {
        ('FormData failed, trying JSON approach:', formDataError);
        
        // Approach 2: JSON (if your API expects JSON)
        const jsonData = {
          title: formData.title.trim(),
          description: formData.description.trim(),
          price: parseFloat(formData.price),
          originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
          condition: formData.condition,
          category: formData.category,
          subcategory: formData.subcategory || '',
          location: formData.location.trim(),
          college: formData.college || '',
          tags: formData.tags,
          // For JSON approach, you might need to convert images to base64 or handle separately
          images: formData.images.map(img => img.preview) // temporary - you'll need proper image handling
        };
        
        ('Submitting JSON data:', jsonData);
        result = await listingsAPI.createListing(jsonData);
      }
      
      if (result.success) {
        // Redirect back to dashboard
        router.push('/seller-dashboard');
      } else {
        setError(result.message || 'Failed to create listing');
      }
    } catch (err) {
      setError(err.message || 'Failed to create listing');
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
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
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
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="0"
                className={styles.input}
                required
                min="0"
                step="0.01"
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Original Price (₹) [Market Price]</label>
              <input
                type="number"
                name="originalPrice"
                value={formData.originalPrice}
                onChange={handleInputChange}
                placeholder="Optional"
                className={styles.input}
                min="0"
                step="0.01"
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
              <input
                type="text"
                name="college"
                value={formData.college}
                onChange={handleInputChange}
                placeholder="College name (optional)"
                className={styles.input}
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Images *</h2>
          <p className={styles.sectionSubtitle}>
            Add up to 5 photos of your item (JPEG, JPG, PNG, WebP - Max 5MB each)
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
                <span>Add Photo</span>
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