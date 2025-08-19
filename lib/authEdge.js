
// This file contains auth utilities that work in both Node.js and Edge Runtime

export function extractTokenFromRequest(request) {
  try {
    // If it's a request object, extract the token from headers
    if (request && typeof request === 'object' && request.headers) {
      const authHeader = request.headers.get('authorization');
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7); // Remove 'Bearer ' prefix
      }
      
      // Also check cookies
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const cookies = Object.fromEntries(
          cookieHeader.split('; ').map(c => {
            const [key, ...rest] = c.split('=');
            return [key, rest.join('=')];
          })
        );
        
        return cookies['admin-auth-token'] || cookies['auth-token'];
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting token:', error);
    return null;
  }
}

export function isValidTokenFormat(token) {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // Basic JWT format check (should have 3 parts separated by dots)
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }
  
  // Each part should be base64url encoded
  try {
    parts.forEach(part => {
      if (part.length === 0) throw new Error('Empty part');
      // Basic base64url character check
      if (!/^[A-Za-z0-9_-]+$/.test(part)) throw new Error('Invalid characters');
    });
    return true;
  } catch {
    return false;
  }
}

export function decodeTokenPayload(token) {
  try {
    if (!isValidTokenFormat(token)) {
      return null;
    }
    
    const parts = token.split('.');
    const payload = parts[1];
    
    // Add padding if needed for base64url decoding
    const paddedPayload = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    
    // Convert base64url to base64
    const base64 = paddedPayload.replace(/-/g, '+').replace(/_/g, '/');
    
    // Decode base64
    const jsonStr = atob(base64);
    
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error decoding token payload:', error);
    return null;
  }
}

export function isTokenExpired(decodedPayload) {
  if (!decodedPayload || !decodedPayload.exp) {
    return true;
  }
  
  const currentTime = Math.floor(Date.now() / 1000);
  return decodedPayload.exp < currentTime;
}

// Simple token validation for edge runtime (without crypto verification)
export function validateTokenBasic(token) {
  try {
    if (!token) {
      return { valid: false, error: 'No token provided' };
    }
    
    if (!isValidTokenFormat(token)) {
      return { valid: false, error: 'Invalid token format' };
    }
    
    const payload = decodeTokenPayload(token);
    if (!payload) {
      return { valid: false, error: 'Invalid token payload' };
    }
    
    if (isTokenExpired(payload)) {
      return { valid: false, error: 'Token expired' };
    }
    
    return { 
      valid: true, 
      payload,
      error: null
    };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}