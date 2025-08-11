const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || '';

// Function to get auth token from localStorage or wherever you store it
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    // Try different possible token key names
    const token = localStorage.getItem('authToken') || 
                  localStorage.getItem('token') || 
                  localStorage.getItem('accessToken') ||
                  localStorage.getItem('jwt') ||
                  sessionStorage.getItem('authToken') || 
                  sessionStorage.getItem('token') ||
                  sessionStorage.getItem('accessToken') ||
                  sessionStorage.getItem('jwt');
    
    console.log('Retrieved token:', token ? 'Token found' : 'No token found');
    
    // Debug: Log the first few characters of the token
    if (token) {
      console.log('Token preview:', token.substring(0, 20) + '...');
    }
    
    return token;
  }
  return null;
};

// Fetch user profile data
export const fetchUserProfile = async () => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('Making API request to fetch profile...');

    const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);

    const data = await response.json();
    console.log('Response data:', data);

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return {
      success: true,
      data: data.data
    };

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Update user profile data
export const updateUserProfile = async (profileData) => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update user profile');
    }

    return {
      success: true,
      data: data.data,
      message: data.message
    };

  } catch (error) {
    console.error('Error updating user profile:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Custom hook for user profile management
import { useState, useEffect } from 'react';

export const useUserProfile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadUserProfile = async () => {
    setLoading(true);
    setError(null);
    
    // Check if token exists before making the request
    const token = getAuthToken();
    if (!token) {
      setError('Please log in to view your profile');
      setLoading(false);
      return;
    }
    
    console.log('Loading user profile...');
    const result = await fetchUserProfile();
    
    if (result.success) {
      console.log('Profile loaded successfully:', result.data);
      setUserData(result.data);
    } else {
      console.error('Failed to load profile:', result.error);
      setError(result.error);
    }
    
    setLoading(false);
  };

  const updateProfile = async (profileData) => {
    setError(null);
    
    const token = getAuthToken();
    if (!token) {
      setError('Please log in to update your profile');
      return { success: false, error: 'No authentication token' };
    }
    
    const result = await updateUserProfile(profileData);
    
    if (result.success) {
      setUserData(result.data);
      return { success: true, message: result.message };
    } else {
      setError(result.error);
      return { success: false, error: result.error };
    }
  };

  useEffect(() => {
    loadUserProfile();
  }, []);

  return {
    userData,
    loading,
    error,
    refetch: loadUserProfile,
    updateProfile
  };
};