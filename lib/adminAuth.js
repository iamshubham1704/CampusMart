// lib/adminAuth.js (Create this new file)
// Utility functions for admin authentication

export const adminAuth = {
  // Check if admin is logged in
  isLoggedIn: () => {
    if (typeof window === 'undefined') return false;
    
    const token = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('adminData');
    
    return !!(token && adminData);
  },

  // Get admin data
  getAdminData: () => {
    if (typeof window === 'undefined') return null;
    
    try {
      const adminData = localStorage.getItem('adminData');
      return adminData ? JSON.parse(adminData) : null;
    } catch {
      return null;
    }
  },

  // Get admin token
  getToken: () => {
    if (typeof window === 'undefined') return null;
    
    return localStorage.getItem('adminToken');
  },

  // Logout admin
  logout: () => {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
  },

  // Store admin session
  login: (token, adminData) => {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminData', JSON.stringify(adminData));
  }
};