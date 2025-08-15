'use client'
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  User, Edit3, Camera, Mail, Phone, MapPin, Calendar,
  Save, X, Eye, EyeOff, Shield, Star, Package, MessageSquare,
  Heart, Award, TrendingUp, Clock, Loader2, AlertCircle,
  RefreshCw, LogIn, Home
} from 'lucide-react';
import { useUserProfile } from '../../utils/userService'; // Adjust path as needed
import styles from './ProfileSection.module.css';

const ProfileSection = () => {
  const { 
    userData, 
    loading, 
    error, 
    updateProfile, 
    refreshProfile, 
    clearProfile,
    isAuthenticated,
    hasError 
  } = useUserProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  
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

  // Show notification helper
  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 5000);
  }, []);

  // Debug authentication state
  useEffect(() => {
    ('=== PROFILE SECTION DEBUG ===');
    ('User data:', userData ? 'Present' : 'None');
    ('Loading:', loading);
    ('Error:', error);
    ('Is authenticated:', isAuthenticated);
    ('Has error:', hasError);
    
    // Check token in storage
    const token = localStorage.getItem('token') || 
                  localStorage.getItem('authToken') ||
                  sessionStorage.getItem('token') ||
                  sessionStorage.getItem('authToken');
    ('Token in storage:', token ? 'Present' : 'None');
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        ('Token expiry:', new Date(payload.exp * 1000));
        ('Token expired:', payload.exp < Date.now() / 1000);
      } catch (e) {
        ('Invalid token format');
      }
    }
  }, [userData, loading, error, isAuthenticated, hasError]);

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
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showNotification('Image size should be less than 5MB', 'error');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        showNotification('Please select a valid image file', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileData(prev => ({
          ...prev,
          profileImage: e.target.result
        }));
      };
      reader.onerror = () => {
        showNotification('Error reading image file', 'error');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setUpdating(true);
    
    try {
      // Validate required fields
      if (!profileData.name.trim()) {
        showNotification('Name is required', 'error');
        setUpdating(false);
        return;
      }

      const result = await updateProfile(profileData);
      
      if (result.success) {
        setIsEditing(false);
        showNotification(result.message || 'Profile updated successfully!', 'success');
        ('Profile updated successfully');
      } else {
        showNotification(result.error || 'Failed to update profile', 'error');
        console.error('Failed to update profile:', result.error);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showNotification('An unexpected error occurred', 'error');
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

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
      showNotification('Profile refreshed successfully', 'success');
    } catch (error) {
      showNotification('Failed to refresh profile', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handlePasswordUpdate = () => {
    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      showNotification('All password fields are required', 'error');
      return;
    }

    if (passwords.newPassword.length < 6) {
      showNotification('New password must be at least 6 characters long', 'error');
      return;
    }
    
    if (passwords.newPassword !== passwords.confirmPassword) {
      showNotification('New passwords do not match', 'error');
      return;
    }
    
    // Here you would make an API call to update the password
    ('Updating password...');
    showNotification('Password updated successfully!', 'success');
    setPasswords({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswordChange(false);
  };

  const handleLogin = () => {
    // Redirect to login page or show login modal
    window.location.href = '/login';
  };

  const handleLogout = () => {
    clearProfile();
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
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

  // Notification Component
  const Notification = ({ show, message, type }) => {
    if (!show) return null;
    
    const getNotificationColor = (type) => {
      switch (type) {
        case 'success': return '#10b981';
        case 'error': return '#ef4444';
        case 'warning': return '#f59e0b';
        default: return '#3b82f6';
      }
    };

    return (
      <div 
        className={styles.notification}
        style={{ backgroundColor: getNotificationColor(type) }}
      >
        {message}
      </div>
    );
  };

  // Loading state
  if (loading && !refreshing) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={48} />
        <p>Loading your profile...</p>
      </div>
    );
  }

if (error && (error.includes('Authentication failed') || error.includes('Please log in')))  {
    return (
      <div className={styles.errorContainer}>
        <AlertCircle size={48} className={styles.errorIcon} />
        <h2>Authentication Required</h2>
        <p>You need to be logged in to view your profile.</p>
        <div className={styles.errorActions}>
          <button className={styles.primaryButton} onClick={handleLogin}>
            <LogIn size={16} />
            Log In
          </button>
          <button className={styles.secondaryButton} onClick={() => window.location.href = '/'}>
            <Home size={16} />
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // General error state
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <AlertCircle size={48} className={styles.errorIcon} />
        <h2>Error Loading Profile</h2>
        <p>{error}</p>
        <div className={styles.errorActions}>
          <button className={styles.primaryButton} onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? <Loader2 className={styles.spinner} size={16} /> : <RefreshCw size={16} />}
            {refreshing ? 'Refreshing...' : 'Try Again'}
          </button>
          <button className={styles.secondaryButton} onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!userData && !loading) {
    return (
      <div className={styles.noDataContainer}>
        <User size={48} className={styles.noDataIcon} />
        <h2>No Profile Data</h2>
        <p>Unable to load your profile information.</p>
        <div className={styles.errorActions}>
          <button className={styles.primaryButton} onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? <Loader2 className={styles.spinner} size={16} /> : <RefreshCw size={16} />}
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button className={styles.secondaryButton} onClick={handleLogin}>
            <LogIn size={16} />
            Log In Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.profileContainer}>
      <Notification {...notification} />
      
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
                title="Upload new profile picture"
              >
                <Camera size={16} />
              </button>
            )}
          </div>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/jpeg,image/png,image/webp,image/gif"
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
                required
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
              <div className={styles.nameSection}>
                <h1 className={styles.profileName}>{profileData.name}</h1>
                <button 
                  className={styles.refreshButton}
                  onClick={handleRefresh}
                  disabled={refreshing}
                  title="Refresh profile data"
                >
                  {refreshing ? <Loader2 size={16} className={styles.spinner} /> : <RefreshCw size={16} />}
                </button>
              </div>
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
              <label className={styles.formLabel}>Full Name *</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={styles.formInput}
                  placeholder="Enter your full name"
                  required
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
                  maxLength={500}
                />
              ) : (
                <div className={styles.formValue}>{profileData.bio || 'No bio provided'}</div>
              )}
              {isEditing && (
                <small className={styles.formHint}>
                  {profileData.bio.length}/500 characters
                </small>
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
                    <label className={styles.formLabel}>Current Password *</label>
                    <div className={styles.passwordInput}>
                      <input
                        type={showPasswords.current ? "text" : "password"}
                        value={passwords.currentPassword}
                        onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                        className={styles.formInput}
                        placeholder="Enter current password"
                        required
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
                    <label className={styles.formLabel}>New Password *</label>
                    <div className={styles.passwordInput}>
                      <input
                        type={showPasswords.new ? "text" : "password"}
                        value={passwords.newPassword}
                        onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                        className={styles.formInput}
                        placeholder="Enter new password"
                        minLength={6}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('new')}
                        className={styles.passwordToggle}
                      >
                        {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <small className={styles.formHint}>Minimum 6 characters</small>
                  </div>

                  <div className={styles.passwordGroup}>
                    <label className={styles.formLabel}>Confirm New Password *</label>
                    <div className={styles.passwordInput}>
                      <input
                        type={showPasswords.confirm ? "text" : "password"}
                        value={passwords.confirmPassword}
                        onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                        className={styles.formInput}
                        placeholder="Confirm new password"
                        required
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

            <div className={styles.securityItem}>
              <div className={styles.securityInfo}>
                <h3>Account Actions</h3>
                <p>Manage your account</p>
              </div>
              <button
                className={styles.logoutButton}
                onClick={handleLogout}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;