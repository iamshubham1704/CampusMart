"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, X, Plus } from 'lucide-react';
import { listingsAPI } from '../../utils/api';
import styles from './CreateListing.module.css'; 

const CreateListing = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
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
    images: [],
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
    // For now, we'll add placeholder images
    // Later you can implement actual image upload
    const placeholderImages = [
      'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop'
    ];
    
    const randomImage = placeholderImages[Math.floor(Math.random() * placeholderImages.length)];
    
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, randomImage]
    }));
  };

  const handleImageRemove = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.title || !formData.description || !formData.price || 
        !formData.condition || !formData.category || !formData.location) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await listingsAPI.createListing(formData);
      
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
              placeholder="Describe your item in detail"
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
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Original Price (₹)</label>
              <input
                type="number"
                name="originalPrice"
                value={formData.originalPrice}
                onChange={handleInputChange}
                placeholder="Optional"
                className={styles.input}
                min="0"
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
          <h2 className={styles.sectionTitle}>Images</h2>
          <p className={styles.sectionSubtitle}>Add up to 5 photos of your item</p>
          
          <div className={styles.imageGrid}>
            {formData.images.map((image, index) => (
              <div key={index} className={styles.imageContainer}>
                <img src={image} alt={`Item ${index + 1}`} className={styles.image} />
                <button
                  type="button"
                  onClick={() => handleImageRemove(index)}
                  className={styles.removeImageButton}
                >
                  <X size={16} />
                </button>
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