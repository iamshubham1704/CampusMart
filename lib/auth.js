// lib/auth.js
import jwt from 'jsonwebtoken';

export function verifyToken(token) {
  try {
    // If it's a request object, extract the token from headers
    if (token && typeof token === 'object' && token.headers) {
      const authHeader = token.headers.get('authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        ('No valid authorization header found');
        return null;
      }

      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    }
    
    if (!token) {
      ('No token provided');
      return null;
    }

    ('Token found, attempting to verify...');
    
    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    ('Token decoded successfully:', { userId: decoded.userId || decoded.id });
    
    // Make sure we return the userId in a consistent format
    return {
      userId: decoded.userId || decoded.id || decoded.sellerId, // Handle different token formats
      email: decoded.email,
      ...decoded
    };
    
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
}