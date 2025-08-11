'use client'
import React, { useState, useRef, useEffect } from 'react';
import {
  User, Edit3, Camera, Mail, Phone, MapPin, Calendar,
  Save, X, Eye, EyeOff, Shield, Star, Package, MessageSquare,
  Heart, Award, TrendingUp, Clock, Loader2, AlertCircle
} from 'lucide-react';
import { useUserProfile } from '../../utils/userService'; // Adjust path as needed
import styles from './ProfileSection.module.css';

const ProfileSection = () => {
  const { userData, loading, error, updateProfile } = useUserProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    college: '',
    year: '',
    profileImage: null
  });
  
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const fileInputRef = useRef(null);

  // Update profileData when userData changes
  useEffect(() => {
    if (userData) {
      setProfileData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        location: userData.location || '',
        bio: userData.bio || '',
        college: userData.college || '',
        year: userData.year || '',
        profileImage: userData.profileImage || null
      });
    }
  }, [userData]);

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswords(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileData(prev => ({
          ...prev,
          profileImage: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setUpdating(true);
    
    try {
      const result = await updateProfile(profileData);
      
      if (result.success) {
        setIsEditing(false);
        // You could show a success message here
        console.log('Profile updated successfully');
      } else {
        console.error('Failed to update profile:', result.error);
        // You could show an error message here
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset to original userData
    if (userData) {
      setProfileData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        location: userData.location || '',
        bio: userData.bio || '',
        college: userData.college || '',
        year: userData.year || '',
        profileImage: userData.profileImage || null
      });
    }
    setIsEditing(false);
  };

  const handlePasswordUpdate = () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    
    // Here you would make an API call to update the password
    console.log('Updating password...');
    setPasswords({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswordChange(false);
  };

  const generateUserAvatar = (name, profileImage) => {
    if (profileImage) return profileImage;
    const initial = name ? name.charAt(0).toUpperCase() : 'U';
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' fill='%23667eea' rx='60'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='0.35em' fill='%23ffffff' font-size='48' font-family='Arial, sans-serif' font-weight='bold'%3E${initial}%3C/text%3E%3C/svg%3E`;
  };

  const StatCard = ({ icon: Icon, value, label, color }) => (
    <div className={styles.statCard}>
      <div className={styles.statIcon} style={{ backgroundColor: color }}>
        <Icon size={20} color="white" />
      </div>
      <div className={styles.statContent}>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statLabel}>{label}</div>
      </div>
    </div>
  );

  // Loading state
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={48} />
        <p>Loading your profile...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <AlertCircle size={48} className={styles.errorIcon} />
        <h2>Error Loading Profile</h2>
        <p>{error}</p>
        <button 
          className={styles.retryButton} 
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  // No data state
  if (!userData) {
    return (
      <div className={styles.noDataContainer}>
        <User size={48} className={styles.noDataIcon} />
        <h2>No Profile Data</h2>
        <p>Unable to load your profile information.</p>
      </div>
    );
  }

  return (
    <div className={styles.profileContainer}>
      {/* Profile Header */}
      <div className={styles.profileHeader}>
        <div className={styles.profileImageSection}>
          <div className={styles.profileImageContainer}>
            <img
              src={generateUserAvatar(profileData.name, profileData.profileImage)}
              alt="Profile"
              className={styles.profileImage}
            />
            {isEditing && (
              <button 
                className={styles.imageUploadButton}
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera size={16} />
              </button>
            )}
          </div>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            style={{ display: 'none' }}
          />
        </div>

        <div className={styles.profileInfo}>
          {isEditing ? (
            <div className={styles.editingHeader}>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={styles.nameInput}
                placeholder="Your name"
              />
              <div className={styles.editActions}>
                <button 
                  className={styles.saveButton}
                  onClick={handleSaveProfile}
                  disabled={updating}
                >
                  {updating ? <Loader2 size={16} className={styles.spinner} /> : <Save size={16} />}
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  className={styles.cancelButton}
                  onClick={handleCancelEdit}
                  disabled={updating}
                >
                  <X size={16} />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.displayHeader}>
              <h1 className={styles.profileName}>{profileData.name}</h1>
              <button 
                className={styles.editButton}
                onClick={() => setIsEditing(true)}
              >
                <Edit3 size={16} />
                Edit Profile
              </button>
            </div>
          )}
          
          <div className={styles.profileMeta}>
            <div className={styles.metaItem}>
              <Mail size={16} />
              <span>{profileData.email}</span>
            </div>
            <div className={styles.metaItem}>
              <Calendar size={16} />
              <span>Member since {userData?.memberSince || '2024'}</span>
            </div>
            <div className={styles.metaItem}>
              <Award size={16} />
              <span>{userData?.accountType || 'Standard'} Account</span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Stats */}
      <div className={styles.profileStats}>
        <StatCard
          icon={Package}
          value={userData?.totalSales || 0}
          label="Total Sales"
          color="#10b981"
        />
        <StatCard
          icon={TrendingUp}
          value={`₹${(userData?.totalEarnings || 0).toLocaleString()}`}
          label="Total Earnings"
          color="#3b82f6"
        />
        <StatCard
          icon={Star}
          value={`${userData?.rating || 0}/5`}
          label="Rating"
          color="#eab308"
        />
        <StatCard
          icon={MessageSquare}
          value={`${userData?.responseRate || 0}%`}
          label="Response Rate"
          color="#ec4899"
        />
      </div>

      <div className={styles.profileContent}>
        {/* Personal Information */}
        <div className={styles.profileSection}>
          <h2 className={styles.sectionTitle}>
            <User size={20} />
            Personal Information
          </h2>
          
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={styles.formInput}
                  placeholder="Enter your full name"
                />
              ) : (
                <div className={styles.formValue}>{profileData.name || 'Not provided'}</div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Email</label>
              <div className={styles.formValue}>{profileData.email}</div>
              <small className={styles.formHint}>Email cannot be changed</small>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Phone Number</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={styles.formInput}
                  placeholder="Enter your phone number"
                />
              ) : (
                <div className={styles.formValue}>{profileData.phone || 'Not provided'}</div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Location</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className={styles.formInput}
                  placeholder="Enter your location"
                />
              ) : (
                <div className={styles.formValue}>{profileData.location || 'Not provided'}</div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>College/University</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.college}
                  onChange={(e) => handleInputChange('college', e.target.value)}
                  className={styles.formInput}
                  placeholder="Enter your college"
                />
              ) : (
                <div className={styles.formValue}>{profileData.college || 'Not provided'}</div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Year of Study</label>
              {isEditing ? (
                <select
                  value={profileData.year}
                  onChange={(e) => handleInputChange('year', e.target.value)}
                  className={styles.formSelect}
                >
                  <option value="">Select year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Graduate">Graduate</option>
                  <option value="Postgraduate">Postgraduate</option>
                </select>
              ) : (
                <div className={styles.formValue}>{profileData.year || 'Not provided'}</div>
              )}
            </div>

            <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
              <label className={styles.formLabel}>Bio</label>
              {isEditing ? (
                <textarea
                  value={profileData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  className={styles.formTextarea}
                  placeholder="Tell others about yourself"
                  rows={4}
                />
              ) : (
                <div className={styles.formValue}>{profileData.bio || 'No bio provided'}</div>
              )}
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className={styles.profileSection}>
          <h2 className={styles.sectionTitle}>
            <Shield size={20} />
            Security Settings
          </h2>
          
          <div className={styles.securityContent}>
            <div className={styles.securityItem}>
              <div className={styles.securityInfo}>
                <h3>Password</h3>
                <p>Update your password to keep your account secure</p>
              </div>
              <button
                className={styles.securityButton}
                onClick={() => setShowPasswordChange(!showPasswordChange)}
              >
                Change Password
              </button>
            </div>

            {showPasswordChange && (
              <div className={styles.passwordChangeForm}>
                <div className={styles.passwordGrid}>
                  <div className={styles.passwordGroup}>
                    <label className={styles.formLabel}>Current Password</label>
                    <div className={styles.passwordInput}>
                      <input
                        type={showPasswords.current ? "text" : "password"}
                        value={passwords.currentPassword}
                        onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                        className={styles.formInput}
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('current')}
                        className={styles.passwordToggle}
                      >
                        {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className={styles.passwordGroup}>
                    <label className={styles.formLabel}>New Password</label>
                    <div className={styles.passwordInput}>
                      <input
                        type={showPasswords.new ? "text" : "password"}
                        value={passwords.newPassword}
                        onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                        className={styles.formInput}
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('new')}
                        className={styles.passwordToggle}
                      >
                        {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className={styles.passwordGroup}>
                    <label className={styles.formLabel}>Confirm New Password</label>
                    <div className={styles.passwordInput}>
                      <input
                        type={showPasswords.confirm ? "text" : "password"}
                        value={passwords.confirmPassword}
                        onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                        className={styles.formInput}
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirm')}
                        className={styles.passwordToggle}
                      >
                        {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className={styles.passwordActions}>
                  <button
                    className={styles.updatePasswordButton}
                    onClick={handlePasswordUpdate}
                  >
                    Update Password
                  </button>
                  <button
                    className={styles.cancelPasswordButton}
                    onClick={() => {
                      setShowPasswordChange(false);
                      setPasswords({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      });
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;