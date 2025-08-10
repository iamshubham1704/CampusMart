// utils/api.js

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
      const response = await fetch('/api/listings/create', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(listingData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create listing');
      }

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
  // Get dashboard statistics
  getStats: async () => {
    try {
      const response = await fetch('/api/dashboard/stats', {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  // Get recent activity
  getRecentActivity: async () => {
    try {
      const response = await fetch('/api/dashboard/recent-activity', {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      throw error;
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