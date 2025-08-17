// lib/auth.js (Updated version)
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Extract token from headers or cookies
export function extractToken(request) {
  try {
    if (!request) return null;

    // If it's already a string token
    if (typeof request === 'string') {
      return request;
    }

    // If it's a request object
    if (request.headers) {
      // Check Authorization header
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
      }

      // Check cookies
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const cookies = Object.fromEntries(
          cookieHeader.split('; ').map(c => {
            const [key, ...rest] = c.split('=');
            return [key, rest.join('=')];
          })
        );
        return cookies['auth-token'] || cookies['admin-auth-token'];
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting token:', error);
    return null;
  }
}

// Helper function to verify a regular user token
export function verifyToken(request) {
  try {
    const token = extractToken(request);

    if (!token) {
      console.log('No token provided');
      return null;
    }

    console.log('Token found, attempting to verify...');

    // Verify the JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    console.log('Token decoded successfully:', { 
      userId: decoded.userId || decoded.id || decoded.adminId,
      role: decoded.role 
    });

    // Return the decoded token with consistent field names
    return {
      userId: decoded.userId || decoded.id || decoded.sellerId || decoded.adminId,
      adminId: decoded.adminId,
      sellerId: decoded.sellerId,
      buyerId: decoded.buyerId,
      email: decoded.email,
      role: decoded.role,
      ...decoded
    };

  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
}

// Helper function to verify admin-specific tokens
export function verifyAdminToken(request) {
  try {
    const decoded = verifyToken(request);

    if (!decoded || decoded.role !== 'admin') {
      console.log('Invalid admin token or insufficient permissions');
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('Admin token verification failed:', error.message);
    return null;
  }
}

// NEW: Generate admin JWT token
export function generateAdminToken(adminData) {
  try {
    const payload = {
      adminId: adminData._id || adminData.adminId,
      email: adminData.email,
      name: adminData.name,
      role: 'admin',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    };

    return jwt.sign(payload, JWT_SECRET);
  } catch (error) {
    console.error('Error generating admin token:', error);
    throw new Error('Failed to generate admin token');
  }
}

// NEW: Check if token is expired
export function isTokenExpired(token) {
  try {
    if (!token) return true;

    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return true;

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
}

// NEW: Refresh token (if needed)
export function refreshToken(oldToken) {
  try {
    const decoded = jwt.verify(oldToken, JWT_SECRET, { ignoreExpiration: true });

    // Create new token with extended expiration
    const newPayload = {
      ...decoded,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    };

    delete newPayload.iat; // Remove old iat
    delete newPayload.exp; // Remove old exp

    return jwt.sign(newPayload, JWT_SECRET, { expiresIn: '7d' });
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw new Error('Failed to refresh token');
  }
}
