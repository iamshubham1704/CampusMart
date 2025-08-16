"use client";
import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, User, Lock, Bell, Shield, Smartphone, Trash2,
  Camera, Save, Eye, EyeOff, Check, X, AlertTriangle,
  Loader2, Upload, Download, LogOut, Monitor, Globe,
  Mail, Phone, MapPin, Calendar, Building2, ChevronRight,
  Settings, Palette, Moon, Sun, Zap, Crown, Star,
  Activity, BarChart3, TrendingUp, Award, Sparkles
} from 'lucide-react';

const SettingsPage = () => {
  const fileInputRef = useRef(null);
  
  // State management
  const [activeSection, setActiveSection] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  // Initialize user data from memory or defaults
  // Replace the existing userData useState initialization
const [userData, setUserData] = useState(() => {
  // Try to get saved data from memory, fallback to defaults
  const savedData = window.localStorage?.getItem('campusmart_user_data');
  if (savedData) {
    try {
      return JSON.parse(savedData);
    } catch (e) {
      console.error('Failed to parse saved user data:', e);
    }
  }
  
  return {
    name: 'John Doe',
    email: 'john.doe@university.edu',
    phone: '+1 (555) 123-4567',
    location: 'New York, NY',
    college: 'University of Technology',
    year: '3rd Year',
    bio: 'Computer Science student passionate about technology and innovation. Love to build things and help fellow students.',
    profileImage: null,
    isPremium: true,
    memberSince: '2023',
    totalSales: 45,
    rating: 4.8
  };
});

  // Profile form should sync with userData
  const [profileForm, setProfileForm] = useState({
    name: userData.name,
    email: userData.email,
    phone: userData.phone,
    location: userData.location,
    college: userData.college,
    year: userData.year,
    bio: userData.bio
  });

  // Update profileForm when userData changes
  useEffect(() => {
    setProfileForm({
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      location: userData.location,
      college: userData.college,
      year: userData.year,
      bio: userData.bio
    });
  }, [userData]);
  // Add this useEffect after your existing useEffects
useEffect(() => {
  // Save userData to localStorage whenever it changes
  try {
    window.localStorage?.setItem('campusmart_user_data', JSON.stringify(userData));
  } catch (e) {
    console.error('Failed to save user data:', e);
  }
}, [userData]);
  
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    messageNotifications: true,
    listingNotifications: true,
    marketingEmails: false,
    weeklyDigest: true,
    instantMessages: true,
    priceAlerts: true,
    soundEnabled: true,
    vibrationEnabled: true
  });
  
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false,
    showLastSeen: true,
    allowSearchEngines: true,
    dataCollection: true,
    showOnlineStatus: true,
    allowDirectMessages: true
  });
  
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    loginAlerts: true,
    sessionTimeout: '24h',
    deviceTrust: true,
    biometricAuth: false
  });
  
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'dark',
    accentColor: 'blue',
    compactMode: false,
    animations: true,
    fontSize: 'medium'
  });
  
  const [loginSessions, setLoginSessions] = useState([
    {
      id: 1,
      device: 'Chrome on Windows',
      location: 'New York, NY',
      lastActive: 'Just now',
      ip: '192.168.1.1',
      isCurrent: true
    },
    {
      id: 2,
      device: 'Safari on iPhone',
      location: 'New York, NY',
      lastActive: '2 hours ago',
      ip: '192.168.1.2',
      isCurrent: false
    }
  ]);
  
  // Success and error messages
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Generate user avatar with premium indicator
  const generateUserAvatar = (name, profileImage) => {
    if (profileImage) return profileImage;
    if (imagePreview) return imagePreview;
    
    const initial = name ? name.charAt(0).toUpperCase() : 'U';
    const colors = ['667eea', '764ba2', 'f093fb', '4facfe', 'fa709a'];
    const colorIndex = name ? name.length % colors.length : 0;
    const color = colors[colorIndex];
    
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23${color};stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23${color}88;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='120' height='120' fill='url(%23grad)' rx='60'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='0.35em' fill='%23ffffff' font-size='48' font-family='Arial, sans-serif' font-weight='bold'%3E${initial}%3C/text%3E%3C/svg%3E`;
  };
  
  // Show message helper
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };
  
  // Handle profile image upload
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showMessage('error', 'Image size must be less than 5MB');
        return;
      }
      
      setProfileImage(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle profile form submission - FIXED
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update userData with the form data
      // In handleProfileSubmit function, replace the setUserData call with:
setUserData(prev => ({
  ...prev,
  name: profileForm.name,
  email: profileForm.email,
  phone: profileForm.phone,
  location: profileForm.location,
  college: profileForm.college,
  year: profileForm.year,
  bio: profileForm.bio,
  profileImage: imagePreview || prev.profileImage
}));

// Clear temporary image states
setProfileImage(null);
setImagePreview(null);
      
      showMessage('success', 'Profile updated successfully');
      
    } catch (error) {
      showMessage('error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };
  
  // Handle password change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      showMessage('error', 'New password must be at least 6 characters');
      return;
    }
    
    try {
      setSaving(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      showMessage('success', 'Password changed successfully');
      
    } catch (error) {
      showMessage('error', 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };
  
  // Handle notification settings update
  const handleNotificationUpdate = async (key, value) => {
    const newSettings = { ...notificationSettings, [key]: value };
    setNotificationSettings(newSettings);
    showMessage('success', 'Notification preferences updated');
  };
  
  // Handle privacy settings update
  const handlePrivacyUpdate = async (key, value) => {
    const newSettings = { ...privacySettings, [key]: value };
    setPrivacySettings(newSettings);
    showMessage('success', 'Privacy settings updated');
  };
  
  // Handle appearance settings update
  const handleAppearanceUpdate = async (key, value) => {
    const newSettings = { ...appearanceSettings, [key]: value };
    setAppearanceSettings(newSettings);
    showMessage('success', 'Appearance settings updated');
  };
  
  // Handle account deletion
  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );
    
    if (!confirmDelete) return;
    
    const password = prompt('Please enter your password to confirm account deletion:');
    if (!password) return;
    
    try {
      setSaving(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      showMessage('success', 'Account deleted successfully');
      
    } catch (error) {
      showMessage('error', 'Failed to delete account');
    } finally {
      setSaving(false);
    }
  };
  
  // Settings sections configuration with premium features
  const settingsSections = [
    { id: 'profile', title: 'Profile', icon: User, premium: false },
    { id: 'security', title: 'Security', icon: Lock, premium: false },
    { id: 'notifications', title: 'Notifications', icon: Bell, premium: false },
    { id: 'privacy', title: 'Privacy', icon: Shield, premium: true },
    { id: 'danger', title: 'Danger Zone', icon: AlertTriangle, premium: false }
  ];
  
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#e2e8f0'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          padding: '48px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}>
          <Loader2 size={48} style={{ animation: 'spin 1s linear infinite', color: '#3b82f6' }} />
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600' }}>Loading Settings...</h3>
            <p style={{ margin: '0', color: '#94a3b8', fontSize: '14px' }}>Please wait while we fetch your preferences</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      position: 'relative',
      overflowX: 'hidden',
      padding: '20px'
    }}>
      {/* Animated Background */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0
      }}>
        <div style={{
          position: 'absolute',
          borderRadius: '50%',
          opacity: 0.1,
          filter: 'blur(1px)',
          width: '300px',
          height: '300px',
          background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
          top: '10%',
          left: '10%'
        }}></div>
        <div style={{
          position: 'absolute',
          borderRadius: '50%',
          opacity: 0.1,
          filter: 'blur(1px)',
          width: '200px',
          height: '200px',
          background: 'linear-gradient(45deg, #8b5cf6, #ec4899)',
          top: '60%',
          right: '10%'
        }}></div>
        <div style={{
          position: 'absolute',
          borderRadius: '50%',
          opacity: 0.1,
          filter: 'blur(1px)',
          width: '150px',
          height: '150px',
          background: 'linear-gradient(45deg, #ec4899, #f59e0b)',
          bottom: '20%',
          left: '20%'
        }}></div>
      </div>
      
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        marginBottom: '32px',
        position: 'relative',
        zIndex: 1
      }}>
        <button 
          onClick={() => window.history.back()} 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            color: '#e2e8f0',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #ffffff, #94a3b8)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 4px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            Settings
            <Sparkles size={24} style={{ color: '#3b82f6' }} />
          </h1>
          <p style={{
            color: '#94a3b8',
            margin: '0',
            fontSize: '16px',
            fontWeight: '500'
          }}>Customize your CampusMart experience</p>
        </div>
      </div>
      
      {/* Message Display */}
      {message.text && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 20px',
          borderRadius: '12px',
          marginBottom: '24px',
          fontWeight: '500',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          position: 'relative',
          zIndex: 1,
          background: message.type === 'success' 
            ? 'rgba(16, 185, 129, 0.1)' 
            : 'rgba(239, 68, 68, 0.1)',
          color: message.type === 'success' ? '#10b981' : '#ef4444',
          borderColor: message.type === 'success' 
            ? 'rgba(16, 185, 129, 0.2)' 
            : 'rgba(239, 68, 68, 0.2)'
        }}>
          <div style={{ flexShrink: 0 }}>
            {message.type === 'success' ? <Check size={20} /> : <X size={20} />}
          </div>
          <span>{message.text}</span>
          <button 
            onClick={() => setMessage({ type: '', text: '' })}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              marginLeft: 'auto'
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: '320px 1fr',
        gap: '32px',
        maxWidth: '1400px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Sidebar */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '0',
          height: 'fit-content',
          position: 'sticky',
          top: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.05))'
          }}>
            <img
              src={generateUserAvatar(userData.name, userData.profileImage)}
              alt="Profile"
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                marginBottom: '12px'
              }}
            />
            <div>
              <h3 style={{
                color: '#ffffff',
                fontSize: '18px',
                fontWeight: '600',
                margin: '0 0 4px 0'
              }}>{userData.name}</h3>
              <p style={{
                color: '#94a3b8',
                fontSize: '14px',
                margin: '0 0 12px 0'
              }}>{userData.email}</p>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#3b82f6',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  <Star size={14} />
                  <span>{userData.rating}</span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#3b82f6',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  <TrendingUp size={14} />
                  <span>{userData.totalSales}</span>
                </div>
              </div>
            </div>
          </div>
          
          <nav style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '8px 0'
          }}>
            {settingsSections.map(section => {
              const IconComponent = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 24px',
                    background: activeSection === section.id 
                      ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.1), transparent)' 
                      : 'none',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    color: activeSection === section.id ? '#3b82f6' : '#cbd5e1',
                    fontWeight: '500',
                    borderLeft: `3px solid ${activeSection === section.id ? '#3b82f6' : 'transparent'}`
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <IconComponent size={20} />
                    <span>{section.title}</span>
                  </div>
                  <ChevronRight size={16} style={{ opacity: 0.5 }} />
                </button>
              );
            })}
          </nav>
        </div>
        
        {/* Main Content */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}>
          
          {/* Profile Section */}
          {activeSection === 'profile' && (
            <div style={{ padding: '40px' }}>
              <div style={{
                marginBottom: '32px',
                paddingBottom: '20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h2 style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  background: 'linear-gradient(135deg, #ffffff, #94a3b8)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: '0 0 8px 0'
                }}>Profile Information</h2>
                <p style={{
                  color: '#94a3b8',
                  margin: '0',
                  lineHeight: '1.6',
                  fontSize: '16px'
                }}>
                  Update your profile information and manage your public presence.
                </p>
              </div>
              
              <form onSubmit={handleProfileSubmit} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '32px'
              }}>
                {/* Profile Image */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '32px',
                  padding: '32px',
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.05))',
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(20px)'
                }}>
                  <div style={{ position: 'relative' }}>
                    <img
                      src={generateUserAvatar(userData.name, userData.profileImage)}
                      alt="Profile"
                      style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '4px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.3)'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        width: '36px',
                        height: '36px',
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        border: 'none',
                        borderRadius: '50%',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <Camera size={16} />
                    </button>
                  </div>
                  <div>
                    <h4 style={{
                      fontWeight: '600',
                      color: '#ffffff',
                      margin: '0 0 4px 0',
                      fontSize: '16px'
                    }}>Profile Picture</h4>
                    <p style={{
                      fontWeight: '500',
                      color: '#cbd5e1',
                      margin: '0 0 4px 0'
                    }}>Click to upload a new profile picture</p>
                    <small style={{
                      color: '#64748b',
                      fontSize: '12px'
                    }}>JPG, PNG up to 5MB</small>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                </div>
                
                {/* Form Fields */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '24px'
                }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <label htmlFor="name" style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: '600',
                      color: '#e2e8f0',
                      fontSize: '14px',
                      marginBottom: '4px'
                    }}>
                      <User size={16} />
                      Full Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                      style={{
                        padding: '14px 16px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        fontSize: '14px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        color: '#ffffff'
                      }}
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <label htmlFor="email" style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: '600',
                      color: '#e2e8f0',
                      fontSize: '14px',
                      marginBottom: '4px'
                    }}>
                      <Mail size={16} />
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                      style={{
                        padding: '14px 16px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        fontSize: '14px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        color: '#ffffff'
                      }}
                      placeholder="Enter your email"
                    />
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <label htmlFor="phone" style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: '600',
                      color: '#e2e8f0',
                      fontSize: '14px',
                      marginBottom: '4px'
                    }}>
                      <Phone size={16} />
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                      style={{
                        padding: '14px 16px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        fontSize: '14px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        color: '#ffffff'
                      }}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <label htmlFor="location" style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: '600',
                      color: '#e2e8f0',
                      fontSize: '14px',
                      marginBottom: '4px'
                    }}>
                      <MapPin size={16} />
                      Location
                    </label>
                    <input
                      id="location"
                      type="text"
                      value={profileForm.location}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, location: e.target.value }))}
                      style={{
                        padding: '14px 16px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        fontSize: '14px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        color: '#ffffff'
                      }}
                      placeholder="Enter your location"
                    />
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <label htmlFor="college" style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: '600',
                      color: '#e2e8f0',
                      fontSize: '14px',
                      marginBottom: '4px'
                    }}>
                      <Building2 size={16} />
                      College
                    </label>
                    <input
                      id="college"
                      type="text"
                      value={profileForm.college}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, college: e.target.value }))}
                      style={{
                        padding: '14px 16px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        fontSize: '14px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        color: '#ffffff'
                      }}
                      placeholder="Enter your college name"
                    />
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <label htmlFor="year" style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: '600',
                      color: '#e2e8f0',
                      fontSize: '14px',
                      marginBottom: '4px'
                    }}>
                      <Calendar size={16} />
                      Academic Year
                    </label>
                    <select
                      id="year"
                      value={profileForm.year}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, year: e.target.value }))}
                      style={{
                        padding: '14px 16px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        fontSize: '14px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        color: '#f8f5f5ff'
                      }}
                    >
                      <option value="" style={{background: '#1e293b', color: '#ffffff'}}>Select year</option>
  <option value="1st Year" style={{background: '#1e293b', color: '#ffffff'}}>1st Year</option>
  <option value="2nd Year" style={{background: '#1e293b', color: '#ffffff'}}>2nd Year</option>
  <option value="3rd Year" style={{background: '#1e293b', color: '#ffffff'}}>3rd Year</option>
  <option value="4th Year" style={{background: '#1e293b', color: '#ffffff'}}>4th Year</option>
  <option value="Graduate" style={{background: '#1e293b', color: '#ffffff'}}>Graduate</option>
  <option value="Faculty" style={{background: '#1e293b', color: '#ffffff'}}>Faculty</option>

                    </select>
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <label htmlFor="bio" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: '600',
                    color: '#e2e8f0',
                    fontSize: '14px',
                    marginBottom: '4px'
                  }}>
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                    style={{
                      padding: '14px 16px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      fontSize: '14px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      color: '#ffffff',
                      resize: 'vertical',
                      minHeight: '120px',
                      fontFamily: 'inherit'
                    }}
                    placeholder="Tell others about yourself..."
                    rows={4}
                    maxLength={500}
                  />
                  <div style={{
                    textAlign: 'right',
                    fontSize: '12px',
                    color: profileForm.bio.length > 450 ? '#f59e0b' : '#94a3b8'
                  }}>
                    {profileForm.bio.length}/500 characters
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '14px 28px',
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: '600',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    alignSelf: 'flex-start',
                    boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)',
                    opacity: saving ? 0.6 : 1
                  }}
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Changes
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
          
          {/* Security Section */}
          {activeSection === 'security' && (
            <div style={{ padding: '40px' }}>
              <div style={{
                marginBottom: '32px',
                paddingBottom: '20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h2 style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  background: 'linear-gradient(135deg, #ffffff, #94a3b8)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: '0 0 8px 0'
                }}>Security Settings</h2>
                <p style={{
                  color: '#94a3b8',
                  margin: '0',
                  lineHeight: '1.6',
                  fontSize: '16px'
                }}>
                  Manage your account security and authentication methods.
                </p>
              </div>
              
              {/* Change Password */}
              <div style={{
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '32px',
                marginBottom: '24px',
                background: 'rgba(255, 255, 255, 0.02)',
                backdropFilter: 'blur(10px)'
              }}>
                <h3 style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#ffffff',
                  margin: '0 0 8px 0'
                }}>
                  <Lock size={20} />
                  Change Password
                </h3>
                <form onSubmit={handlePasswordSubmit} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '24px'
                }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <label htmlFor="currentPassword" style={{
                      fontWeight: '600',
                      color: '#e2e8f0',
                      fontSize: '14px'
                    }}>
                      Current Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="currentPassword"
                        type={showPassword.current ? 'text' : 'password'}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        style={{
                          padding: '14px 16px',
                          paddingRight: '50px',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '12px',
                          fontSize: '14px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          backdropFilter: 'blur(10px)',
                          color: '#ffffff',
                          width: '100%'
                        }}
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                        style={{
                          position: 'absolute',
                          right: '14px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          padding: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '6px'
                        }}
                      >
                        {showPassword.current ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <label htmlFor="newPassword" style={{
                      fontWeight: '600',
                      color: '#e2e8f0',
                      fontSize: '14px'
                    }}>
                      New Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="newPassword"
                        type={showPassword.new ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        style={{
                          padding: '14px 16px',
                          paddingRight: '50px',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '12px',
                          fontSize: '14px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          backdropFilter: 'blur(10px)',
                          color: '#ffffff',
                          width: '100%'
                        }}
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                        style={{
                          position: 'absolute',
                          right: '14px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          padding: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '6px'
                        }}
                      >
                        {showPassword.new ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <label htmlFor="confirmPassword" style={{
                      fontWeight: '600',
                      color: '#e2e8f0',
                      fontSize: '14px'
                    }}>
                      Confirm New Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="confirmPassword"
                        type={showPassword.confirm ? 'text' : 'password'}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        style={{
                          padding: '14px 16px',
                          paddingRight: '50px',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '12px',
                          fontSize: '14px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          backdropFilter: 'blur(10px)',
                          color: '#ffffff',
                          width: '100%'
                        }}
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                        style={{
                          position: 'absolute',
                          right: '14px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          padding: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '6px'
                        }}
                      >
                        {showPassword.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '14px 28px',
                      background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontWeight: '600',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      alignSelf: 'flex-start',
                      boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)',
                      opacity: saving ? 0.6 : 1
                    }}
                  >
                    {saving ? (
                      <>
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Update Password
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
          
          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <div style={{ padding: '40px' }}>
              <div style={{
                marginBottom: '32px',
                paddingBottom: '20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h2 style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  background: 'linear-gradient(135deg, #ffffff, #94a3b8)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: '0 0 8px 0'
                }}>Notification Preferences</h2>
                <p style={{
                  color: '#94a3b8',
                  margin: '0',
                  lineHeight: '1.6',
                  fontSize: '16px'
                }}>
                  Choose how and when you want to receive notifications.
                </p>
              </div>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '32px'
              }}>
                <div style={{
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: '32px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#ffffff',
                    margin: '0 0 24px 0',
                    paddingBottom: '12px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Bell size={18} />
                    Communication
                  </h3>
                  
                  {[
                    { key: 'emailNotifications', title: 'Email Notifications', desc: 'Receive notifications via email' },
                    { key: 'pushNotifications', title: 'Push Notifications', desc: 'Receive browser push notifications' },
                    { key: 'messageNotifications', title: 'Message Notifications', desc: 'Get notified about new messages' },
                    { key: 'soundEnabled', title: 'Sound Effects', desc: 'Play sounds for notifications' }
                  ].map(item => (
                    <div key={item.key} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '20px 0',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      <div>
                        <strong style={{
                          display: 'block',
                          color: '#ffffff',
                          fontWeight: '500',
                          marginBottom: '4px'
                        }}>{item.title}</strong>
                        <p style={{
                          color: '#94a3b8',
                          fontSize: '14px',
                          margin: '0'
                        }}>{item.desc}</p>
                      </div>
                      <label style={{
                        position: 'relative',
                        display: 'inline-block',
                        width: '52px',
                        height: '28px'
                      }}>
                        <input
                          type="checkbox"
                          checked={notificationSettings[item.key]}
                          onChange={(e) => handleNotificationUpdate(item.key, e.target.checked)}
                          style={{
                            opacity: 0,
                            width: 0,
                            height: 0
                          }}
                        />
                        <span style={{
                          position: 'absolute',
                          cursor: 'pointer',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: notificationSettings[item.key] 
                            ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' 
                            : 'rgba(100, 116, 139, 0.3)',
                          transition: '.3s',
                          borderRadius: '28px',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                          <span style={{
                            position: 'absolute',
                            content: '""',
                            height: '20px',
                            width: '20px',
                            left: notificationSettings[item.key] ? '27px' : '3px',
                            bottom: '3px',
                            background: '#ffffff',
                            transition: '.3s',
                            borderRadius: '50%',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                          }}></span>
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Privacy Section */}
          {activeSection === 'privacy' && (
            <div style={{ padding: '40px' }}>
              <div style={{
                marginBottom: '32px',
                paddingBottom: '20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h2 style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  background: 'linear-gradient(135deg, #ffffff, #94a3b8)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: '0 0 8px 0'
                }}>Privacy Settings</h2>
                <p style={{
                  color: '#94a3b8',
                  margin: '0',
                  lineHeight: '1.6',
                  fontSize: '16px'
                }}>
                  Control your privacy and data sharing preferences.
                </p>
              </div>
              
              <div style={{
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '32px',
                background: 'rgba(255, 255, 255, 0.02)',
                backdropFilter: 'blur(10px)'
              }}>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#ffffff',
                  margin: '0 0 24px 0',
                  paddingBottom: '12px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }}>Profile Visibility</h3>
                
                {[
                  { key: 'showEmail', title: 'Show Email Address', desc: 'Display email on your profile', type: 'toggle' },
                  { key: 'showPhone', title: 'Show Phone Number', desc: 'Display phone on your profile', type: 'toggle' },
                  { key: 'showOnlineStatus', title: 'Online Status', desc: 'Show when you\'re online', type: 'toggle' },
                  { key: 'allowDirectMessages', title: 'Direct Messages', desc: 'Allow other users to message you directly', type: 'toggle' }
                ].map(item => (
                  <div key={item.key} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '20px 0',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    <div>
                      <strong style={{
                        display: 'block',
                        color: '#ffffff',
                        fontWeight: '500',
                        marginBottom: '4px'
                      }}>{item.title}</strong>
                      <p style={{
                        color: '#94a3b8',
                        fontSize: '14px',
                        margin: '0'
                      }}>{item.desc}</p>
                    </div>
                    <label style={{
                      position: 'relative',
                      display: 'inline-block',
                      width: '52px',
                      height: '28px'
                    }}>
                      <input
                        type="checkbox"
                        checked={privacySettings[item.key]}
                        onChange={(e) => handlePrivacyUpdate(item.key, e.target.checked)}
                        style={{
                          opacity: 0,
                          width: 0,
                          height: 0
                        }}
                      />
                      <span style={{
                        position: 'absolute',
                        cursor: 'pointer',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: privacySettings[item.key] 
                          ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' 
                          : 'rgba(100, 116, 139, 0.3)',
                        transition: '.3s',
                        borderRadius: '28px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <span style={{
                          position: 'absolute',
                          content: '""',
                          height: '20px',
                          width: '20px',
                          left: privacySettings[item.key] ? '27px' : '3px',
                          bottom: '3px',
                          background: '#ffffff',
                          transition: '.3s',
                          borderRadius: '50%',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                        }}></span>
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Danger Zone Section */}
          {activeSection === 'danger' && (
            <div style={{ padding: '40px' }}>
              <div style={{
                marginBottom: '32px',
                paddingBottom: '20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h2 style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  background: 'linear-gradient(135deg, #ffffff, #94a3b8)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: '0 0 8px 0'
                }}>Danger Zone</h2>
                <p style={{
                  color: '#94a3b8',
                  margin: '0',
                  lineHeight: '1.6',
                  fontSize: '16px'
                }}>
                  Irreversible and destructive actions.
                </p>
              </div>
              
              <div style={{
                border: '2px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '16px',
                padding: '32px',
                background: 'rgba(239, 68, 68, 0.05)',
                backdropFilter: 'blur(20px)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '32px'
                }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      color: '#ef4444',
                      fontWeight: '600',
                      margin: '0 0 16px 0',
                      fontSize: '20px'
                    }}>
                      <AlertTriangle size={20} />
                      Delete Account
                    </h3>
                    <p style={{
                      color: '#cbd5e1',
                      margin: '0 0 16px 0',
                      lineHeight: '1.6'
                    }}>
                      Permanently delete your account and all associated data. 
                      This action cannot be undone and you will lose:
                    </p>
                    <ul style={{
                      margin: '0',
                      paddingLeft: '20px',
                      color: '#94a3b8'
                    }}>
                      <li style={{ marginBottom: '8px', lineHeight: '1.4' }}>All your listings and products</li>
                      <li style={{ marginBottom: '8px', lineHeight: '1.4' }}>Message history and conversations</li>
                      <li style={{ marginBottom: '8px', lineHeight: '1.4' }}>Transaction history and reviews</li>
                      
                    </ul>
                  </div>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={saving}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '14px 24px',
                      background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: '600',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 14px rgba(220, 38, 38, 0.3)',
                      opacity: saving ? 0.6 : 1
                    }}
                  >
                    {saving ? (
                      <>
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 size={16} />
                        Delete Account
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;