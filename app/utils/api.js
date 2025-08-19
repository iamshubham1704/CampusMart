// utils/api.js - Enhanced version with settings APIs

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

export const listingsAPI = {
  // Get current user's listings
  getMyListings: async () => {
    try {
      const response = await fetch('/api/listings/my-listings', {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching listings:', error);
      throw error;
    }
  },

  // Create new listing
  createListing: async (listingData) => {
    try {
      const isFormData = (typeof FormData !== 'undefined') && (listingData instanceof FormData);

      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
      const headers = isFormData
        ? {
            ...(token && { Authorization: `Bearer ${token}` })
          }
        : getAuthHeaders();

      const response = await fetch('/api/listings/create', {
        method: 'POST',
        headers,
        body: isFormData ? listingData : JSON.stringify(listingData)
      });

      if (!response.ok) {
        // Try to parse JSON error first; if it fails, fall back to text
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        } catch (_) {
          const text = await response.text();
          throw new Error(text || `HTTP error! status: ${response.status}`);
        }
      }

      // Parse success JSON
      return await response.json();
    } catch (error) {
      console.error('Error creating listing:', error);
      throw error;
    }
  },

  // Get single listing by ID
  getListing: async (id) => {
    try {
      const response = await fetch(`/api/listings/${id}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching listing:', error);
      throw error;
    }
  },

  // Update listing
  updateListing: async (id, listingData) => {
    try {
      const response = await fetch(`/api/listings/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(listingData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update listing');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating listing:', error);
      throw error;
    }
  },

  // Delete listing
  deleteListing: async (id) => {
    try {
      const response = await fetch(`/api/listings/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete listing');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting listing:', error);
      throw error;
    }
  },

  // Mark listing as sold
  markAsSold: async (id) => {
    try {
      const response = await fetch(`/api/listings/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: 'sold' })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mark as sold');
      }

      return await response.json();
    } catch (error) {
      console.error('Error marking as sold:', error);
      throw error;
    }
  },

  // Update listing status (active/inactive)
  updateListingStatus: async (id, status) => {
    try {
      const response = await fetch(`/api/listings/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  }
};

// Dashboard API functions
export const dashboardAPI = {
  // Get dashboard statistics for the seller
  getSellerStats: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch('/api/seller/stats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch stats');
      }

      return {
        success: true,
        stats: data.stats
      };
    } catch (error) {
      console.error('Error fetching seller stats:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch stats'
      };
    }
  },

  // Get recent activity for the seller
  getRecentActivity: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch('/api/seller/activity', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch activity');
      }

      return {
        success: true,
        activities: data.activities
      };
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch activity'
      };
    }
  },

  // Get saved items count
  getSavedItemsCount: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch('/api/seller/saved-items/count', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch saved items count');
      }

      return {
        success: true,
        count: data.count
      };
    } catch (error) {
      console.error('Error fetching saved items count:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch saved items count'
      };
    }
  },

  // Get active chats count
  getActiveChatsCount: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch('/api/seller/chats/count', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch chats count');
      }

      return {
        success: true,
        count: data.count
      };
    } catch (error) {
      console.error('Error fetching chats count:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch chats count'
      };
    }
  },

  // Get reviews count
  getReviewsCount: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch('/api/seller/reviews/count', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch reviews count');
      }

      return {
        success: true,
        count: data.count,
        averageRating: data.averageRating || 0
      };
    } catch (error) {
      console.error('Error fetching reviews count:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch reviews count'
      };
    }
  }
};

// User/Profile API functions
export const userAPI = {
  // Get user profile
  getProfile: async () => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }
};

// Settings API functions
export const settingsAPI = {
  // Get user settings
  getSettings: async () => {
    try {
      const response = await fetch('/api/user/settings', {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }
  },

  // Update notification preferences
  updateNotificationPreferences: async (preferences) => {
    try {
      const response = await fetch('/api/user/settings/notifications', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(preferences)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update notification preferences');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  },

  // Update privacy settings
  updatePrivacySettings: async (privacySettings) => {
    try {
      const response = await fetch('/api/user/settings/privacy', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(privacySettings)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update privacy settings');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      throw error;
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      const response = await fetch('/api/user/settings/change-password', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(passwordData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to change password');
      }

      return await response.json();
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
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

      return await response.json();
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },

  // Delete account
  deleteAccount: async (confirmationData) => {
    try {
      const response = await fetch('/api/user/settings/delete-account', {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify(confirmationData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete account');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  },

  // Get login sessions
  getLoginSessions: async () => {
    try {
      const response = await fetch('/api/user/settings/sessions', {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching login sessions:', error);
      throw error;
    }
  },

  // Revoke login session
  revokeSession: async (sessionId) => {
    try {
      const response = await fetch(`/api/user/settings/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to revoke session');
      }

      return await response.json();
    } catch (error) {
      console.error('Error revoking session:', error);
      throw error;
    }
  },

  // Setup 2FA
  setup2FA: async () => {
    try {
      const response = await fetch('/api/user/settings/2fa/setup', {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to setup 2FA');
      }

      return await response.json();
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      throw error;
    }
  },

  // Verify 2FA setup
  verify2FA: async (verificationData) => {
    try {
      const response = await fetch('/api/user/settings/2fa/verify', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(verificationData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to verify 2FA');
      }

      return await response.json();
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      throw error;
    }
  },

  // Disable 2FA
  disable2FA: async (verificationData) => {
    try {
      const response = await fetch('/api/user/settings/2fa/disable', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(verificationData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to disable 2FA');
      }

      return await response.json();
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      throw error;
    }
  }
};

// Messages/Chat API functions
export const messagesAPI = {
  // Get user's chats
  getChats: async () => {
    try {
      const response = await fetch('/api/messages/chats', {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching chats:', error);
      throw error;
    }
  },

  // Get messages for a specific chat
  getMessages: async (chatId) => {
    try {
      const response = await fetch(`/api/messages/${chatId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  // Send a message
  sendMessage: async (chatId, messageData) => {
    try {
      const response = await fetch(`/api/messages/${chatId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(messageData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send message');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error during registration:', error);
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: getAuthHeaders()
      });

      // Remove token regardless of response
      localStorage.removeItem('token');

      if (!response.ok) {
        console.warn('Logout request failed, but token removed locally');
      }

      return { success: true };
    } catch (error) {
      // Remove token even if request fails
      localStorage.removeItem('token');
      console.error('Error during logout:', error);
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send reset email');
      }

      return await response.json();
    } catch (error) {
      console.error('Error during forgot password:', error);
      throw error;
    }
  }
};

// Utility function to check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;

  try {
    // Check if token is expired (basic check)
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp > Date.now() / 1000;
  } catch (error) {
    console.error('Error checking token:', error);
    localStorage.removeItem('token');
    return false;
  }
};

// Utility function to get current user info from token
export const getCurrentUser = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));

    // Check if token is expired
    if (payload.exp && payload.exp < Date.now() / 1000) {
      localStorage.removeItem('token');
      return null;
    }

    return {
      id: payload.sellerId || payload.userId || payload.id || payload.sub,
      name: payload.name || payload.given_name || 'User',
      email: payload.email || '',
      picture: payload.picture || null
    };
  } catch (error) {
    console.error('Error decoding token:', error);
    localStorage.removeItem('token');
    return null;
  }
};
// Notifications API functions
export const notificationsAPI = {
  // Get notifications for current user
  getNotifications: async (page = 1, limit = 20) => {
    try {
      const response = await fetch(`/api/notifications?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { success: false, notifications: [], error: error.message };
    }
  },

  // Get notification stats (unread count, etc.)
  getNotificationStats: async () => {
    try {
      const response = await fetch('/api/notifications/stats', {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        // Return default stats instead of throwing
        return { 
          success: true, 
          stats: { 
            unreadNotifications: 0, 
            totalNotifications: 0 
          } 
        };
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      return { 
        success: true, 
        stats: { 
          unreadNotifications: 0, 
          totalNotifications: 0 
        } 
      };
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mark as read');
      }

      return await response.json();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mark all as read');
      }

      return await response.json();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete notification');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  // Clear all notifications
  clearAllNotifications: async () => {
    try {
      const response = await fetch('/api/notifications/clear-all', {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to clear all notifications');
      }

      return await response.json();
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      throw error;
    }
  }
};