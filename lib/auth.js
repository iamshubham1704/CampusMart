// lib/auth.js
import jwt from 'jsonwebtoken';

export function verifyToken(request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid authorization header found');
      return null;
    }

    // Extract the token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      console.log('No token found in authorization header');
      return null;
    }

    console.log('Token found, attempting to verify...');
    
    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log('Token decoded successfully:', { userId: decoded.userId || decoded.id });
    
    // Make sure we return the userId in a consistent format
    return {
      userId: decoded.userId || decoded.id, // Handle different token formats
      email: decoded.email,
      ...decoded
    };
    
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
}