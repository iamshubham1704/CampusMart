// lib/auth.js - ENHANCED VERSION WITH BETTER ERROR HANDLING
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Enhanced token extraction with better error handling and iOS Safari compatibility
export function extractToken(request) {
  try {
    if (!request) return null;

    // If it's already a string token
    if (typeof request === 'string') {
      return request;
    }

    // If it's a request object
    if (request.headers) {
      // Check Authorization header first (preferred method)
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        // Validate token format before returning
        if (isValidTokenFormat(token)) {
          return token;
        }
      }

      // Check cookies as fallback with enhanced iOS Safari handling
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        try {
          // Enhanced cookie parsing for iOS Safari compatibility
          const cookies = parseCookies(cookieHeader);
          const token = cookies['auth-token'] || cookies['admin-auth-token'];
          
          if (token && isValidTokenFormat(token)) {
            return token;
          }
        } catch (cookieError) {
          console.warn('🔴 Cookie parsing error (likely iOS Safari):', cookieError);
          // Try alternative parsing method for iOS Safari
          try {
            const token = extractTokenFromCookiesAlternative(cookieHeader);
            if (token && isValidTokenFormat(token)) {
              return token;
            }
          } catch (altError) {
            console.warn('🔴 Alternative cookie parsing also failed:', altError);
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error('🔴 Error extracting token:', error);
    return null;
  }
}

// Enhanced cookie parsing for iOS Safari compatibility
function parseCookies(cookieHeader) {
  if (!cookieHeader || typeof cookieHeader !== 'string') {
    return {};
  }

  try {
    // Standard cookie parsing
    const cookies = Object.fromEntries(
      cookieHeader.split('; ').map(c => {
        const [key, ...rest] = c.split('=');
        return [key, rest.join('=')];
      })
    );
    return cookies;
  } catch (error) {
    console.warn('Standard cookie parsing failed, trying alternative method');
    return parseCookiesAlternative(cookieHeader);
  }
}

// Alternative cookie parsing method for iOS Safari
function parseCookiesAlternative(cookieHeader) {
  const cookies = {};
  const cookiePairs = cookieHeader.split(';');
  
  for (const pair of cookiePairs) {
    const trimmedPair = pair.trim();
    if (trimmedPair) {
      const equalIndex = trimmedPair.indexOf('=');
      if (equalIndex > 0) {
        const key = trimmedPair.substring(0, equalIndex).trim();
        const value = trimmedPair.substring(equalIndex + 1).trim();
        cookies[key] = value;
      }
    }
  }
  
  return cookies;
}

// Extract token using alternative method for problematic cookie headers
function extractTokenFromCookiesAlternative(cookieHeader) {
  // Look for auth-token or admin-auth-token patterns
  const authTokenMatch = cookieHeader.match(/auth-token=([^;]+)/);
  const adminAuthTokenMatch = cookieHeader.match(/admin-auth-token=([^;]+)/);
  
  if (adminAuthTokenMatch) {
    return adminAuthTokenMatch[1];
  }
  
  if (authTokenMatch) {
    return authTokenMatch[1];
  }
  
  return null;
}

// Enhanced token format validation
function isValidTokenFormat(token) {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // Check if token is empty or just whitespace
  if (token.trim().length === 0) {
    return false;
  }
  
  // Basic JWT format validation (3 parts separated by dots)
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }
  
  // Check if each part is not empty
  if (parts.some(part => !part || part.trim().length === 0)) {
    return false;
  }
  
  // Check if parts contain only valid base64 characters (with padding)
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!parts.every(part => base64Regex.test(part))) {
    return false;
  }
  
  return true;
}

// Enhanced token verification with detailed logging
export function verifyToken(request) {
  try {
    const token = extractToken(request);

    if (!token) {
      console.log('🔴 No token provided in request');
      return null;
    }

    // Enhanced token format validation
    if (!isValidTokenFormat(token)) {
      console.log('🔴 Invalid token format detected');
      return null;
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Log successful verification (but don't log sensitive data)
    console.log('✅ Token verified successfully for:', {
      userId: decoded.userId || decoded.id || decoded.adminId || 'unknown',
      role: decoded.role || 'no-role',
      email: decoded.email ? decoded.email.substring(0, 3) + '***' : 'no-email'
    });

    // Return the decoded token with consistent field names
    return {
      userId: decoded.userId || decoded.buyerId || decoded.id || decoded.sellerId || decoded.adminId,
      adminId: decoded.adminId,
      sellerId: decoded.sellerId,
      buyerId: decoded.buyerId || decoded.userId,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
      iat: decoded.iat,
      exp: decoded.exp,
      ...decoded // Include any other fields
    };

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      console.log('🔴 JWT verification failed: Invalid token format');
    } else if (error.name === 'TokenExpiredError') {
      console.log('🔴 JWT verification failed: Token expired');
    } else if (error.name === 'NotBeforeError') {
      console.log('🔴 JWT verification failed: Token not active yet');
    } else {
      console.error('🔴 JWT verification failed with unexpected error:', error.message);
    }
    return null;
  }
}

// Enhanced admin token verification
export function verifyAdminToken(request) {
  try {
    const decoded = verifyToken(request);

    if (!decoded) {
      console.log('🔴 Admin verification failed: No valid token');
      return null;
    }

    if (!decoded.role || decoded.role !== 'admin') {
      console.log('🔴 Admin verification failed: Insufficient permissions', {
        providedRole: decoded.role,
        requiredRole: 'admin',
        userId: decoded.userId
      });
      return null;
    }

    console.log('✅ Admin verification successful for:', decoded.adminId || decoded.userId);
    return decoded;
  } catch (error) {
    console.error('🔴 Admin token verification failed:', error.message);
    return null;
  }
}

// Generate admin JWT token with enhanced security
export function generateAdminToken(adminData) {
  try {
    if (!adminData) {
      throw new Error('Admin data is required');
    }

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      adminId: adminData._id || adminData.adminId || adminData.id,
      userId: adminData._id || adminData.adminId || adminData.id, // For backward compatibility
      email: adminData.email,
      name: adminData.name,
      role: 'admin',
      iat: now,
      exp: now + (7 * 24 * 60 * 60), // 7 days
      // Add some additional claims for security
      iss: 'campusmart-admin', // issuer
      aud: 'campusmart-api' // audience
    };

    // Validate required fields
    if (!payload.adminId || !payload.email) {
      throw new Error('Missing required admin data: adminId or email');
    }

    const token = jwt.sign(payload, JWT_SECRET);
    console.log('✅ Admin token generated successfully for:', payload.email);
    
    return token;
  } catch (error) {
    console.error('🔴 Error generating admin token:', error);
    throw new Error('Failed to generate admin token: ' + error.message);
  }
}

// Generate regular user token
export function generateUserToken(userData, userType = 'user') {
  try {
    if (!userData) {
      throw new Error('User data is required');
    }

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      userId: userData._id || userData.userId || userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role || userType,
      iat: now,
      exp: now + (30 * 24 * 60 * 60), // 30 days for regular users
      iss: 'campusmart',
      aud: 'campusmart-api'
    };

    // Add type-specific fields
    if (userData.sellerId) payload.sellerId = userData.sellerId;
    if (userData.buyerId) payload.buyerId = userData.buyerId;

    const token = jwt.sign(payload, JWT_SECRET);
    console.log('✅ User token generated successfully for:', payload.email);
    
    return token;
  } catch (error) {
    console.error('🔴 Error generating user token:', error);
    throw new Error('Failed to generate user token: ' + error.message);
  }
}

// Check if token is expired without full verification
export function isTokenExpired(token) {
  try {
    if (!token) return true;

    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return true;

    const currentTime = Math.floor(Date.now() / 1000);
    const isExpired = decoded.exp < currentTime;
    
    if (isExpired) {
      console.log('🔴 Token is expired');
    }
    
    return isExpired;
  } catch (error) {
    console.error('🔴 Error checking token expiration:', error);
    return true;
  }
}

// Refresh token functionality
export function refreshToken(oldToken) {
  try {
    if (!oldToken) {
      throw new Error('No token provided for refresh');
    }

    // Verify the old token (allow expired tokens for refresh)
    const decoded = jwt.verify(oldToken, JWT_SECRET, { ignoreExpiration: true });

    // Check if token is too old to refresh (more than 30 days)
    const now = Math.floor(Date.now() / 1000);
    const tokenAge = now - (decoded.iat || 0);
    const maxRefreshAge = 30 * 24 * 60 * 60; // 30 days

    if (tokenAge > maxRefreshAge) {
      throw new Error('Token is too old to refresh');
    }

    // Create new token with extended expiration
    const newPayload = {
      ...decoded,
      iat: now,
      exp: now + (decoded.role === 'admin' ? 7 * 24 * 60 * 60 : 30 * 24 * 60 * 60)
    };

    // Remove old timestamps to avoid conflicts
    delete newPayload.iat;
    delete newPayload.exp;

    const newToken = jwt.sign(newPayload, JWT_SECRET, { 
      expiresIn: decoded.role === 'admin' ? '7d' : '30d' 
    });

    console.log('✅ Token refreshed successfully for:', decoded.email);
    return newToken;
  } catch (error) {
    console.error('🔴 Error refreshing token:', error);
    throw new Error('Failed to refresh token: ' + error.message);
  }
}

// Decode token payload without verification (for debugging)
export function decodeTokenPayload(token) {
  try {
    if (!token) return null;
    return jwt.decode(token);
  } catch (error) {
    console.error('🔴 Error decoding token payload:', error);
    return null;
  }
}

// Token validation with detailed error reporting
export function validateTokenDetailed(token) {
  if (!token) {
    return { valid: false, error: 'NO_TOKEN', message: 'No token provided' };
  }

  if (typeof token !== 'string' || token.trim().length === 0) {
    return { valid: false, error: 'INVALID_FORMAT', message: 'Token must be a non-empty string' };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { 
      valid: true, 
      payload: decoded, 
      error: null, 
      message: 'Token is valid' 
    };
  } catch (error) {
    let errorCode = 'UNKNOWN_ERROR';
    let message = error.message;

    if (error.name === 'JsonWebTokenError') {
      errorCode = 'INVALID_TOKEN';
      message = 'Token is malformed or invalid';
    } else if (error.name === 'TokenExpiredError') {
      errorCode = 'EXPIRED_TOKEN';
      message = 'Token has expired';
    } else if (error.name === 'NotBeforeError') {
      errorCode = 'TOKEN_NOT_ACTIVE';
      message = 'Token is not active yet';
    }

    return { 
      valid: false, 
      error: errorCode, 
      message,
      payload: null 
    };
  }
}

// Helper function for middleware
export function createAuthMiddleware(requiredRole = null) {
  return (request) => {
    const authResult = requiredRole === 'admin' 
      ? verifyAdminToken(request)
      : verifyToken(request);

    if (!authResult) {
      return {
        success: false,
        status: 401,
        error: 'Authentication required',
        user: null
      };
    }

    if (requiredRole && authResult.role !== requiredRole) {
      return {
        success: false,
        status: 403,
        error: `${requiredRole} role required`,
        user: authResult
      };
    }

    return {
      success: true,
      status: 200,
      error: null,
      user: authResult
    };
  };
}

// Utility functions for consistent token management
export const getStoredToken = (userType = null) => {
  if (typeof window === 'undefined') return null;
  
  let token = null;
  
  if (userType === 'buyer') {
    token = localStorage.getItem('buyerToken') || localStorage.getItem('auth-token');
    console.log('Getting buyer token:', token ? 'found' : 'not found');
  } else if (userType === 'seller') {
    token = localStorage.getItem('token') || localStorage.getItem('sellerToken') || localStorage.getItem('auth-token');
    console.log('Getting seller token:', token ? 'found' : 'not found');
  } else if (userType === 'admin') {
    token = localStorage.getItem('adminToken') || localStorage.getItem('admin-auth-token');
    console.log('Getting admin token:', token ? 'found' : 'not found');
  } else {
    // Return any available token
    token = localStorage.getItem('auth-token') || 
           localStorage.getItem('buyerToken') || 
           localStorage.getItem('token') || 
           localStorage.getItem('sellerToken') || 
           localStorage.getItem('adminToken');
    console.log('Getting any token:', token ? 'found' : 'not found');
  }
  
  return token;
};

export const getStoredUserType = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('userType');
};

export const clearAllTokens = () => {
  if (typeof window === 'undefined') return;
  
  // Clear all possible token variations
  localStorage.removeItem('auth-token');
  localStorage.removeItem('buyerToken');
  localStorage.removeItem('token');
  localStorage.removeItem('sellerToken');
  localStorage.removeItem('adminToken');
  localStorage.removeItem('admin-auth-token');
  localStorage.removeItem('userType');
  localStorage.removeItem('buyerData');
  localStorage.removeItem('sellerId');
  localStorage.removeItem('adminData');
};

export const isAuthenticated = (userType = null) => {
  const token = getStoredToken(userType);
  console.log('isAuthenticated check - userType:', userType, 'token exists:', !!token);
  
  if (!token) {
    console.log('No token found for userType:', userType);
    return false;
  }
  
  try {
    const decoded = jwt.decode(token);
    console.log('Token decoded:', decoded);
    
    if (!decoded) {
      console.log('Failed to decode token');
      return false;
    }
    
    // Check if token is expired
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      console.log('Token expired, clearing tokens');
      clearAllTokens();
      return false;
    }
    
    // If userType is specified, check if it matches
    if (userType && decoded.role && decoded.role !== userType) {
      console.log('Role mismatch - expected:', userType, 'got:', decoded.role);
      return false;
    }
    
    console.log('Authentication successful for userType:', userType);
    return true;
  } catch (error) {
    console.error('Token validation error:', error);
    clearAllTokens();
    return false;
  }
};

export const redirectToLogin = (userType = 'buyer') => {
  if (typeof window === 'undefined') return;
  
  clearAllTokens();
  
  if (userType === 'seller') {
    window.location.href = '/seller-login';
  } else if (userType === 'admin') {
    window.location.href = '/admin-login';
  } else {
    window.location.href = '/buyer-login';
  }
};