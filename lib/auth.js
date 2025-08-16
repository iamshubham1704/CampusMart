// lib/auth.js (Updated version)
import jwt from 'jsonwebtoken';

export function verifyToken(token) {
  try {
    // If it's a request object, extract the token from headers
    if (token && typeof token === 'object' && token.headers) {
      const authHeader = token.headers.get('authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('No valid authorization header found');
        return null;
      }

      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    }
    
    if (!token) {
      console.log('No token provided');
      return null;
    }

    console.log('Token found, attempting to verify...');
    
    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
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
export function verifyAdminToken(token) {
  try {
    const decoded = verifyToken(token);
    
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