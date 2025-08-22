"use client";
import React, { useState, useEffect } from 'react';
import { X, Trash2, Save, Loader2 } from 'lucide-react';
import { listingsAPI } from '../app/utils/api';
import styles from './EditListingModal.module.css';

const EditListingModal = ({ listing, isOpen, onClose, onUpdate, onDelete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    originalPrice: '',
    condition: '',
    location: '',
    status: 'active'
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const conditions = ['Like New', 'Excellent', 'Good', 'Fair'];
  const statuses = ['active', 'inactive', 'sold'];

  useEffect(() => {
    if (listing) {
      setFormData({
        title: listing.title || '',
        description: listing.description || '',
        price: listing.price || '',
        originalPrice: listing.originalPrice || '',
        condition: listing.condition || '',
        location: listing.location || '',
        status: listing.status || 'active'
      });
    }
  }, [listing]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!formData.title || !formData.price || !formData.condition) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create update data without price fields to prevent price changes
      const updateData = {
        title: formData.title,
        description: formData.description,
        condition: formData.condition,
        location: formData.location,
        status: formData.status
        // Note: price and originalPrice are intentionally excluded
      };

      const result = await listingsAPI.updateListing(listing.id, updateData);
      
      if (result.success) {
        onUpdate(); // Refresh the listings
        onClose(); // Close modal
      } else {
        setError(result.message || 'Failed to update listing');
      }
    } catch (err) {
      setError(err.message || 'Failed to update listing');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await listingsAPI.deleteListing(listing.id);
      
      if (result.success) {
        onDelete(); // Refresh the listings
        onClose(); // Close modal
        setShowDeleteConfirm(false);
      } else {
        setError(result.message || 'Failed to delete listing');
      }
    } catch (err) {
      setError(err.message || 'Failed to delete listing');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !listing) return null;

  return (
    <>
      {/* Overlay */}
      <div className={styles.overlay} onClick={onClose}></div>
      
      {/* Modal */}
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Edit Listing</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        {/* Price Change Notice */}
        <div className={styles.priceNotice}>
          <div className={styles.priceNoticeIcon}>ℹ️</div>
          <div className={styles.priceNoticeText}>
            <strong>Note:</strong> Product prices cannot be changed once a listing is created. 
            If you need to adjust pricing, please create a new listing.
          </div>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

        <div className={styles.content}>
          {/* Title */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Enter item title"
            />
          </div>

          {/* Description */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={styles.textarea}
              rows="3"
              placeholder="Item description"
            />
          </div>

          {/* Price Row */}
          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Price (₹) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className={`${styles.input} ${styles.disabledInput}`}
                placeholder="0"
                min="0"
                disabled
                title="Price cannot be changed once the product is listed"
              />
              <small className={styles.helperText}>
                Price cannot be changed after listing is created
              </small>
            </div>
            
            <div className={styles.inputGroup}>
              <label className={styles.label}>Original Price (₹)</label>
              <input
                type="number"
                name="originalPrice"
                value={formData.originalPrice}
                onChange={handleInputChange}
                className={`${styles.input} ${styles.disabledInput}`}
                placeholder="Optional"
                min="0"
                disabled
                title="Original price cannot be changed once the product is listed"
              />
              <small className={styles.helperText}>
                Original price cannot be changed after listing is created
              </small>
            </div>
          </div>

          {/* Condition & Status */}
          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Condition *</label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Select Condition</option>
                {conditions.map(condition => (
                  <option key={condition} value={condition}>{condition}</option>
                ))}
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className={styles.select}
              >
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Item location"
            />
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className={styles.deleteButton}
            disabled={loading}
          >
            <Trash2 size={16} />
            Delete
          </button>
          
          <div className={styles.actionButtons}>
            <button
              onClick={onClose}
              className={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </button>
            
            <button
              onClick={handleSave}
              className={styles.saveButton}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className={styles.spinner} />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className={styles.deleteConfirmOverlay}>
            <div className={styles.deleteConfirm}>
              <h3>Delete Listing?</h3>
              <p>Are you sure you want to delete "{listing.title}"? This action cannot be undone.</p>
              
              <div className={styles.deleteConfirmActions}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className={styles.cancelButton}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className={styles.confirmDeleteButton}
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default EditListingModal;