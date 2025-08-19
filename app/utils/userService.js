import { useState, useEffect, useCallback } from 'react';

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ||
  (typeof window !== 'undefined' ?
    (window.location.hostname === 'localhost' ?
      window.location.origin :
      `${window.location.protocol}//${window.location.host}`
    ) :
    'https://campusmart.store'
  );

// Mobile device detection utility
export const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
  // iOS detection
  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return true;
  }
  
  // Android detection
  if (/android/i.test(userAgent)) {
    return true;
  }
  
  // Mobile detection
  if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
    return true;
  }
  
  // Touch device detection
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    return true;
  }
  
  return false;
};

// iOS Safari specific detection
export const isIOSSafari = () => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
  
  return isIOS && isSafari;
};

// Enhanced token validation for mobile devices
export const validateTokenForMobile = (token) => {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'No token provided' };
  }

  try {
    // Enhanced validation for mobile devices
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return { valid: false, error: 'Invalid token format' };
    }

    // Check for empty parts
    if (tokenParts.some(part => !part || part.trim() === '')) {
      return { valid: false, error: 'Token contains empty parts' };
    }

    // Validate base64 format for each part
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!tokenParts.every(part => base64Regex.test(part))) {
      return { valid: false, error: 'Token contains invalid characters' };
    }

    // Decode and check expiration
    const payload = JSON.parse(atob(tokenParts[1]));
    const isExpired = payload.exp && payload.exp < Date.now() / 1000;

    if (isExpired) {
      // Clean up expired token
      clearExpiredTokens();
      return { valid: false, error: 'Token has expired' };
    }

    return { valid: true, payload };

  } catch (error) {
    console.error('Token validation error:', error);
    return { valid: false, error: 'Invalid token format' };
  }
};

// Clear expired tokens from all storage locations
const clearExpiredTokens = () => {
  if (typeof window === 'undefined') return;
  
  const storageKeys = [
    'authToken', 'token', 'accessToken', 'jwt',
    'auth-token', 'sellerToken', 'buyerToken', 'adminToken'
  ];
  
  storageKeys.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
};

// Enhanced mobile device error handling
export const handleMobileError = (error, context = '') => {
  const errorMessage = error.message || error.toString();
  
  // Check for specific mobile-related errors
  if (errorMessage.includes('pattern') || errorMessage.includes('string')) {
    return {
      userFriendly: 'Data validation error. Please check your input and try again. If the problem persists, try clearing your browser cache and cookies.',
      technical: errorMessage,
      isMobileSpecific: true,
      suggestedAction: 'clearCache'
    };
  }
  
  if (errorMessage.includes('Unauthorized') || errorMessage.includes('token')) {
    return {
      userFriendly: 'Authentication error. Please log in again.',
      technical: errorMessage,
      isMobileSpecific: false,
      suggestedAction: 'relogin'
    };
  }
  
  if (errorMessage.includes('upload') || errorMessage.includes('image')) {
    return {
      userFriendly: 'Image upload failed. Please check your internet connection and try again.',
      technical: errorMessage,
      isMobileSpecific: false,
      suggestedAction: 'retry'
    };
  }
  
  return {
    userFriendly: 'An unexpected error occurred. Please try again.',
    technical: errorMessage,
    isMobileSpecific: false,
    suggestedAction: 'retry'
  };
};

// Utility to help users clear cache and cookies
export const clearBrowserData = async () => {
  if (typeof window === 'undefined') return false;
  
  try {
    // Clear localStorage
    localStorage.clear();
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear cookies (if possible)
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    // Force reload to ensure clean state
    window.location.reload();
    
    return true;
  } catch (error) {
    console.error('Failed to clear browser data:', error);
    return false;
  }
};

// Get mobile device specific instructions
export const getMobileDeviceInstructions = () => {
  if (isIOSSafari()) {
    return {
      title: 'iPhone/iPad Safari Instructions',
      steps: [
        'Go to Settings > Safari > Advanced > Website Data',
        'Tap "Remove All Website Data"',
        'Go back to Safari and refresh the page',
        'Log in again with your credentials'
      ],
      additional: 'If the issue persists, try using a different browser like Chrome for iOS.'
    };
  } else if (isMobileDevice()) {
    return {
      title: 'Mobile Device Instructions',
      steps: [
        'Clear browser cache and cookies',
        'Close and reopen the browser',
        'Log in again with your credentials'
      ],
      additional: 'Try using a different browser if the issue continues.'
    };
  } else {
    return {
      title: 'Desktop Browser Instructions',
      steps: [
        'Press Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)',
        'Select "All time" for time range',
        'Check all boxes and click "Clear data"',
        'Refresh the page and log in again'
      ],
      additional: 'This will clear all browsing data for this site.'
    };
  }
};

// Helper function to get auth token from various storage locations
const getAuthToken = () => {
  if (typeof window === 'undefined') return null;

  const tokenKeys = [
    'authToken', 'token', 'accessToken', 'jwt',
    'auth-token', 'sellerToken', 'buyerToken', 'adminToken'
  ];

  // Check localStorage first
  for (const key of tokenKeys) {
    const token = localStorage.getItem(key);
    if (token) {
      console.log(`Token found in localStorage.${key}`);
      return token;
    }
  }

  // Check sessionStorage as fallback
  for (const key of tokenKeys) {
    const token = sessionStorage.getItem(key);
    if (token) {
      console.log(`Token found in sessionStorage.${key}`);
      return token;
    }
  }

  console.log('No token found in storage');
  return null;
};

// Fetch user profile from API
export const fetchUserProfile = async () => {
  ('=== FETCH USER PROFILE START ===');
  ('API_BASE_URL:', API_BASE_URL);
  ('Current domain:', typeof window !== 'undefined' ? window.location.hostname : 'SSR');

  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }

    // Validate token before making request
    const validation = validateTokenForMobile(token);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const fullUrl = `${API_BASE_URL}/api/user/profile`;
    ('Making request to:', fullUrl);

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
    });

    ('Response status:', response.status);
    ('Response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    ('Response data success:', data.success);

    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 401) {
        // Clear invalid tokens
        clearExpiredTokens();
        throw new Error('Authentication failed. Please log in again.');
      }

      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch user profile');
    }

    ('Profile fetched successfully');
    return {
      success: true,
      data: data.data
    };

  } catch (error) {
    console.error('=== FETCH USER PROFILE ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);

    return {
      success: false,
      error: error.message
    };
  }
};

// Update user profile
export const updateUserProfile = async (profileData) => {
  ('=== UPDATE USER PROFILE START ===');
  ('Update data:', Object.keys(profileData));

  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }

    // Validate token
    const validation = validateTokenForMobile(token);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Validate and sanitize profile data
    const allowedFields = [
      'name', 'phone', 'location', 'bio',
      'college', 'year', 'profileImage'
    ];

    const sanitizedData = {};
    allowedFields.forEach(field => {
      if (profileData[field] !== undefined) {
        sanitizedData[field] = profileData[field];
      }
    });

    ('Sanitized update data:', Object.keys(sanitizedData));

    const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sanitizedData),
    });

    const data = await response.json();
    ('Update response status:', response.status);

    if (!response.ok) {
      if (response.status === 401) {
        clearExpiredTokens();
        throw new Error('Authentication failed. Please log in again.');
      }

      throw new Error(data.message || 'Failed to update user profile');
    }

    if (!data.success) {
      throw new Error(data.message || 'Update operation failed');
    }

    ('Profile updated successfully');
    return {
      success: true,
      data: data.data,
      message: data.message
    };

  } catch (error) {
    console.error('=== UPDATE USER PROFILE ERROR ===');
    console.error('Error:', error.message);

    return {
      success: false,
      error: error.message
    };
  }
};

// React hook for user profile management
export const useUserProfile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user profile with better error handling
  const loadUserProfile = useCallback(async () => {
    ('Loading user profile...');
    setLoading(true);
    setError(null);

    // Pre-check for token
    const token = getAuthToken();
    if (!token) {
      setError('Please log in to view your profile');
      setLoading(false);
      return;
    }

    const result = await fetchUserProfile();

    if (result.success) {
      ('Profile loaded successfully');
      setUserData(result.data);
    } else {
      console.error('Failed to load profile:', result.error);
      setError(result.error);
    }

    setLoading(false);
  }, []);

  // Update profile with optimistic updates
  const updateProfile = useCallback(async (profileData) => {
    ('Updating profile...');
    setError(null);

    const token = getAuthToken();
    if (!token) {
      const errorMsg = 'Please log in to update your profile';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    // Optimistic update
    const previousData = userData;
    if (userData) {
      setUserData({ ...userData, ...profileData });
    }

    const result = await updateUserProfile(profileData);

    if (result.success) {
      setUserData(result.data);
      return { success: true, message: result.message };
    } else {
      // Revert optimistic update on failure
      if (previousData) {
        setUserData(previousData);
      }
      setError(result.error);
      return { success: false, error: result.error };
    }
  }, [userData]);

  // Force refresh profile data
  const refreshProfile = useCallback(() => {
    return loadUserProfile();
  }, [loadUserProfile]);

  // Clear profile data (for logout)
  const clearProfile = useCallback(() => {
    setUserData(null);
    setError(null);
    setLoading(false);
  }, []);

  // Auto-load profile on mount
  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  return {
    userData,
    loading,
    error,
    refetch: loadUserProfile,
    refreshProfile,
    updateProfile,
    clearProfile,
    // Additional helper states
    isAuthenticated: !!userData,
    hasError: !!error,
    isEmpty: !loading && !userData && !error
  };
};