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

// Helper function to get auth token from various storage locations
const getAuthToken = () => {
  if (typeof window === 'undefined') return null;

  const tokenKeys = [
    'authToken', 'token', 'accessToken', 'jwt'
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

// Validate JWT token format and expiration
const validateToken = (token) => {
  if (!token) return { valid: false, error: 'No token provided' };

  try {
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return { valid: false, error: 'Invalid token format' };
    }

    // Decode and check expiration
    const payload = JSON.parse(atob(tokenParts[1]));
    const isExpired = payload.exp && payload.exp < Date.now() / 1000;

    if (isExpired) {
      // Clean up expired token
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('authToken');
      return { valid: false, error: 'Token has expired' };
    }

    console.log('Token validation successful');
    console.log('Token expires:', new Date(payload.exp * 1000));

    return { valid: true, payload };

  } catch (error) {
    console.error('Token validation error:', error);
    return { valid: false, error: 'Invalid token format' };
  }
};

// Fetch user profile from API
export const fetchUserProfile = async () => {
  console.log('=== FETCH USER PROFILE START ===');
  console.log('API_BASE_URL:', API_BASE_URL);
  console.log('Current domain:', typeof window !== 'undefined' ? window.location.hostname : 'SSR');

  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }

    // Validate token before making request
    const validation = validateToken(token);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const fullUrl = `${API_BASE_URL}/api/user/profile`;
    console.log('Making request to:', fullUrl);

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('Response data success:', data.success);

    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 401) {
        // Clear invalid tokens
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('authToken');
        throw new Error('Authentication failed. Please log in again.');
      }

      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch user profile');
    }

    console.log('Profile fetched successfully');
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
  console.log('=== UPDATE USER PROFILE START ===');
  console.log('Update data:', Object.keys(profileData));

  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }

    // Validate token
    const validation = validateToken(token);
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

    console.log('Sanitized update data:', Object.keys(sanitizedData));

    const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sanitizedData),
    });

    const data = await response.json();
    console.log('Update response status:', response.status);

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        throw new Error('Authentication failed. Please log in again.');
      }

      throw new Error(data.message || 'Failed to update user profile');
    }

    if (!data.success) {
      throw new Error(data.message || 'Update operation failed');
    }

    console.log('Profile updated successfully');
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
    console.log('Loading user profile...');
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
      console.log('Profile loaded successfully');
      setUserData(result.data);
    } else {
      console.error('Failed to load profile:', result.error);
      setError(result.error);
    }

    setLoading(false);
  }, []);

  // Update profile with optimistic updates
  const updateProfile = useCallback(async (profileData) => {
    console.log('Updating profile...');
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