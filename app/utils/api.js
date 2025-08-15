// utils/api.js - Complete clean version with proper token validation

// Enhanced auth headers with token validation
const getAuthHeaders = () => {
  if (typeof window === 'undefined') {
    return { 'Content-Type': 'application/json' };
  }

  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('No token found in localStorage');
    return { 'Content-Type': 'application/json' };
  }

  // Validate token format
  const parts = token.split('.');
  if (parts.length !== 3) {
    console.error('Invalid token format - removing from localStorage');
    localStorage.removeItem('token');
    return { 'Content-Type': 'application/json' };
  }

  try {
    // Check if token is expired
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && payload.exp < Date.now() / 1000) {
      console.error('Token has expired - removing from localStorage');
      localStorage.removeItem('token');
      return { 'Content-Type': 'application/json' };
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  } catch (error) {
    console.error('Error validating token:', error);
    localStorage.removeItem('token');
    return { 'Content-Type': 'application/json' };
  }
};

// Generic API request handler with better error handling
const makeApiRequest = async (url, options = {}) => {
  try {
    console.log(`Making API request to: ${url}`);
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers
      }
    });

    console.log(`API Response status for ${url}: ${response.status}`);

    const data = await response.json();

    if (!response.ok) {
      console.error(`API Error for ${url}:`, data);
      
      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        console.error('Authentication error - removing token');
        localStorage.removeItem('token');
        throw new Error(data.message || 'Authentication failed');
      }
      
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    console.log(`API Success for ${url}:`, data);
    return data;
  } catch (error) {
    console.error(`API request failed for ${url}:`, error);
    throw error;
  }
};

export const listingsAPI = {
  // Get current user's listings
  getMyListings: async () => {
    try {
      const data = await makeApiRequest('/api/listings/my-listings');
      return {
        success: true,
        listings: data.listings || data.data || data || []
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        listings: []
      };
    }
  },

  // Create new listing
  createListing: async (listingData) => {
    try {
      const data = await makeApiRequest('/api/listings/create', {
        method: 'POST',
        body: JSON.stringify(listingData)
      });
      return {
        success: true,
        listing: data.listing || data.data || data
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Get single listing by ID
  getListing: async (id) => {
    try {
      const data = await makeApiRequest(`/api/listings/${id}`);
      return {
        success: true,
        listing: data.listing || data.data || data
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Update listing
  updateListing: async (id, listingData) => {
    try {
      const data = await makeApiRequest(`/api/listings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(listingData)
      });
      return {
        success: true,
        listing: data.listing || data.data || data
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Delete listing
  deleteListing: async (id) => {
    try {
      const data = await makeApiRequest(`/api/listings/${id}`, {
        method: 'DELETE'
      });
      return {
        success: true,
        message: data.message || 'Listing deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Mark listing as sold
  markAsSold: async (id) => {
    try {
      const data = await makeApiRequest(`/api/listings/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'sold' })
      });
      return {
        success: true,
        listing: data.listing || data.data || data
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Update listing status (active/inactive)
  updateListingStatus: async (id, status) => {
    try {
      const data = await makeApiRequest(`/api/listings/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      return {
        success: true,
        listing: data.listing || data.data || data
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
};

// Dashboard API functions with better error handling
export const dashboardAPI = {
  // Get dashboard statistics for the seller
  getSellerStats: async () => {
    try {
      // Check if token exists before making request
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Validate token format
      const parts = token.split('.');
      if (parts.length !== 3) {
        localStorage.removeItem('token');
        throw new Error('Invalid token format');
      }

      // Check if token is expired
      try {
        const payload = JSON.parse(atob(parts[1]));
        if (payload.exp && payload.exp < Date.now() / 1000) {
          localStorage.removeItem('token');
          throw new Error('Token has expired');
        }
      } catch (e) {
        localStorage.removeItem('token');
        throw new Error('Invalid token payload');
      }

      console.log('Making stats API request with valid token');
      const data = await makeApiRequest('/api/seller/stats');
      
      return {
        success: true,
        stats: data.stats || data.data || data
      };
    } catch (error) {
      console.error('Error in getSellerStats:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Get recent activity for the seller
  getRecentActivity: async () => {
    try {
      // Check if token exists before making request
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Validate token format
      const parts = token.split('.');
      if (parts.length !== 3) {
        localStorage.removeItem('token');
        throw new Error('Invalid token format');
      }

      // Check if token is expired
      try {
        const payload = JSON.parse(atob(parts[1]));
        if (payload.exp && payload.exp < Date.now() / 1000) {
          localStorage.removeItem('token');
          throw new Error('Token has expired');
        }
      } catch (e) {
        localStorage.removeItem('token');
        throw new Error('Invalid token payload');
      }

      console.log('Making activity API request with valid token');
      const data = await makeApiRequest('/api/seller/activity');
      
      return {
        success: true,
        activities: data.activities || data.data || data || []
      };
    } catch (error) {
      console.error('Error in getRecentActivity:', error);
      return {
        success: false,
        message: error.message,
        activities: []
      };
    }
  },

  // Get saved items count
  getSavedItemsCount: async () => {
    try {
      const data = await makeApiRequest('/api/seller/saved-items/count');
      return {
        success: true,
        count: data.count || 0
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        count: 0
      };
    }
  },

  // Get active chats count
  getActiveChatsCount: async () => {
    try {
      const data = await makeApiRequest('/api/seller/chats/count');
      return {
        success: true,
        count: data.count || 0
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        count: 0
      };
    }
  },

  // Get reviews count
  getReviewsCount: async () => {
    try {
      const data = await makeApiRequest('/api/seller/reviews/count');
      return {
        success: true,
        count: data.count || 0,
        averageRating: data.averageRating || 0
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        count: 0,
        averageRating: 0
      };
    }
  }
};

// User/Profile API functions
export const userAPI = {
  // Get user profile
  getProfile: async () => {
    try {
      const data = await makeApiRequest('/api/user/profile');
      return {
        success: true,
        user: data.user || data.data || data
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const data = await makeApiRequest('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
      });
      return {
        success: true,
        user: data.user || data.data || data
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
};

// Settings API functions
export const settingsAPI = {
  // Get user settings
  getSettings: async () => {
    try {
      const data = await makeApiRequest('/api/user/settings');
      return {
        success: true,
        settings: data.settings || data.data || data
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Update notification preferences
  updateNotificationPreferences: async (preferences) => {
    try {
      const data = await makeApiRequest('/api/user/settings/notifications', {
        method: 'PUT',
        body: JSON.stringify(preferences)
      });
      return {
        success: true,
        settings: data.settings || data.data || data
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Update privacy settings
  updatePrivacySettings: async (privacySettings) => {
    try {
      const data = await makeApiRequest('/api/user/settings/privacy', {
        method: 'PUT',
        body: JSON.stringify(privacySettings)
      });
      return {
        success: true,
        settings: data.settings || data.data || data
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      const data = await makeApiRequest('/api/user/settings/change-password', {
        method: 'PUT',
        body: JSON.stringify(passwordData)
      });
      return {
        success: true,
        message: data.message || 'Password changed successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Upload profile image
  uploadProfileImage: async (file) => {
    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/settings/upload-image', {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload image');
      }

      const data = await response.json();
      return {
        success: true,
        imageUrl: data.imageUrl || data.data || data
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Delete account
  deleteAccount: async (confirmationData) => {
    try {
      const data = await makeApiRequest('/api/user/settings/delete-account', {
        method: 'DELETE',
        body: JSON.stringify(confirmationData)
      });
      return {
        success: true,
        message: data.message || 'Account deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Get login sessions
  getLoginSessions: async () => {
    try {
      const data = await makeApiRequest('/api/user/settings/sessions');
      return {
        success: true,
        sessions: data.sessions || data.data || data || []
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        sessions: []
      };
    }
  },

  // Revoke login session
  revokeSession: async (sessionId) => {
    try {
      const data = await makeApiRequest(`/api/user/settings/sessions/${sessionId}`, {
        method: 'DELETE'
      });
      return {
        success: true,
        message: data.message || 'Session revoked successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Setup 2FA
  setup2FA: async () => {
    try {
      const data = await makeApiRequest('/api/user/settings/2fa/setup', {
        method: 'POST'
      });
      return {
        success: true,
        qrCode: data.qrCode,
        secret: data.secret
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Verify 2FA setup
  verify2FA: async (verificationData) => {
    try {
      const data = await makeApiRequest('/api/user/settings/2fa/verify', {
        method: 'POST',
        body: JSON.stringify(verificationData)
      });
      return {
        success: true,
        message: data.message || '2FA setup completed'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Disable 2FA
  disable2FA: async (verificationData) => {
    try {
      const data = await makeApiRequest('/api/user/settings/2fa/disable', {
        method: 'POST',
        body: JSON.stringify(verificationData)
      });
      return {
        success: true,
        message: data.message || '2FA disabled successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
};

// Messages/Chat API functions
export const messagesAPI = {
  // Get user's chats
  getChats: async () => {
    try {
      const data = await makeApiRequest('/api/messages/chats');
      return {
        success: true,
        chats: data.chats || data.data || data || []
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        chats: []
      };
    }
  },

  // Get messages for a specific chat
  getMessages: async (chatId) => {
    try {
      const data = await makeApiRequest(`/api/messages/${chatId}`);
      return {
        success: true,
        messages: data.messages || data.data || data || []
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        messages: []
      };
    }
  },

  // Send a message
  sendMessage: async (chatId, messageData) => {
    try {
      const data = await makeApiRequest(`/api/messages/${chatId}`, {
        method: 'POST',
        body: JSON.stringify(messageData)
      });
      return {
        success: true,
        message: data.message || data.data || data
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
};

// Auth API functions
export const authAPI = {
  // Login
  login: async (credentials) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store token if provided
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      return {
        success: true,
        user: data.user || data.data,
        token: data.token
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Register
  register: async (userData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Store token if provided
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      return {
        success: true,
        user: data.user || data.data,
        token: data.token
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Logout
  logout: async () => {
    try {
      await makeApiRequest('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('token');
      return { success: true };
    } catch (error) {
      // Remove token even if request fails
      localStorage.removeItem('token');
      return { success: true }; // Still return success since token is removed
    }
  },

  // Forgot password
  forgotPassword: async (email) => {
    try {
      const response = await fetch('/api/seller/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to send reset email');
      }

      return {
        success: true,
        message: data.message || 'Reset email sent successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
};

// Utility function to check if user is authenticated
export const isAuthenticated = () => {
  if (typeof window === 'undefined') return false;
  
  const token = localStorage.getItem('token');
  if (!token) return false;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      localStorage.removeItem('token');
      return false;
    }

    // Check if token is expired (basic check)
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && payload.exp < Date.now() / 1000) {
      localStorage.removeItem('token');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking token:', error);
    localStorage.removeItem('token');
    return false;
  }
};

// Utility function to get current user info from token
export const getCurrentUser = () => {
  if (typeof window === 'undefined') return null;
  
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      localStorage.removeItem('token');
      return null;
    }

    const payload = JSON.parse(atob(parts[1]));

    // Check if token is expired
    if (payload.exp && payload.exp < Date.now() / 1000) {
      localStorage.removeItem('token');
      return null;
    }

    return {
      id: payload.sellerId || payload.userId || payload.id || payload.sub,
      name: payload.name || payload.given_name || 'User',
      email: payload.email || '',
      picture: payload.picture || null,
      token
    };
  } catch (error) {
    console.error('Error decoding token:', error);
    localStorage.removeItem('token');
    return null;
  }
};