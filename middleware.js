// middleware.js (Fixed for Edge Runtime)
import { NextResponse } from 'next/server';

// Enhanced token extraction for mobile devices
function extractTokenFromRequest(request) {
  try {
    // Check Authorization header first
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (isValidTokenFormat(token)) {
        return token;
      }
    }

    // Check cookies with enhanced parsing for iOS Safari
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      try {
        // Standard cookie parsing
        const cookies = Object.fromEntries(
          cookieHeader.split('; ').map(c => {
            const [key, ...rest] = c.split('=');
            return [key, rest.join('=')];
          })
        );
        
        const token = cookies['auth-token'] || cookies['admin-auth-token'];
        if (token && isValidTokenFormat(token)) {
          return token;
        }
      } catch (cookieError) {
        // Alternative parsing for problematic cookie headers (iOS Safari)
        try {
          const authTokenMatch = cookieHeader.match(/auth-token=([^;]+)/);
          const adminAuthTokenMatch = cookieHeader.match(/admin-auth-token=([^;]+)/);
          
          if (adminAuthTokenMatch && isValidTokenFormat(adminAuthTokenMatch[1])) {
            return adminAuthTokenMatch[1];
          }
          
          if (authTokenMatch && isValidTokenFormat(authTokenMatch[1])) {
            return authTokenMatch[1];
          }
        } catch (altError) {
          console.warn('Alternative cookie parsing failed:', altError);
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Token extraction error:', error);
    return null;
  }
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
  
  // Check if parts contain only valid base64/base64url characters (with padding)
  const base64Regex = /^[A-Za-z0-9+/_-]*={0,2}$/;
  if (!parts.every(part => base64Regex.test(part))) {
    return false;
  }
  
  return true;
}

// Basic token validation
function validateTokenBasic(token) {
  if (!token) {
    return { valid: false, reason: 'no-token' };
  }

  if (!isValidTokenFormat(token)) {
    return { valid: false, reason: 'invalid-format' };
  }

  try {
    // Basic JWT structure validation without verification
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, reason: 'malformed-jwt' };
    }

    // Try to decode the payload (without verification)
    let payloadPart = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = payloadPart.length % 4;
    if (pad) {
      payloadPart += '='.repeat(4 - pad);
    }
    const payload = JSON.parse(atob(payloadPart));
    
    // Check if token is expired
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return { valid: false, reason: 'expired' };
    }

    return { valid: true, payload };
  } catch (error) {
    return { valid: false, reason: 'decode-error' };
  }
}

export function middleware(request) {
  const pathname = request.nextUrl.pathname;

  // Check if it's a dashboard route
  const isSellerDashboard = pathname.startsWith('/seller-dashboard');
  const isBuyerDashboard = pathname.startsWith('/buyer-dashboard');
  const isAdminDashboard = pathname.startsWith('/admin-dashboard');

  // Allow public routes
  if (!isSellerDashboard && !isBuyerDashboard && !isAdminDashboard) {
    return NextResponse.next();
  }

  // Handle Seller and Buyer Dashboard Routes
  if (isSellerDashboard || isBuyerDashboard) {
    // Check for authentication token with enhanced mobile device support
    const token = request.cookies.get('auth-token')?.value || 
                  extractTokenFromRequest(request);

    if (!token) {
      // Redirect to appropriate login based on dashboard type
      let loginUrl;
      
      if (isSellerDashboard) {
        loginUrl = new URL('/seller-login', request.url);
      } else if (isBuyerDashboard) {
        loginUrl = new URL('/buyer-login', request.url);
      }
      
      if (loginUrl) {
        return NextResponse.redirect(loginUrl);
      }
    }

    // Enhanced token validation for mobile devices
    const validation = validateTokenBasic(token);
    if (!validation.valid) {
      // Log validation failure reason for debugging
      console.log(`Token validation failed: ${validation.reason}`);
      
      // Token is invalid, redirect to login
      let loginUrl;
      
      if (isSellerDashboard) {
        loginUrl = new URL('/seller-login', request.url);
      } else if (isBuyerDashboard) {
        loginUrl = new URL('/buyer-login', request.url);
      }
      
      if (loginUrl) {
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  // Handle Admin Dashboard Routes
  if (isAdminDashboard) {
    const token = request.cookies.get('admin-auth-token')?.value || 
                  extractTokenFromRequest(request);

    if (!token) {
      return NextResponse.redirect(new URL('/admin-login', request.url));
    }

    const validation = validateTokenBasic(token);
    if (!validation.valid) {
      return NextResponse.redirect(new URL('/admin-login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protected dashboard routes
    '/buyer-dashboard/:path*',
    '/seller-dashboard/:path*',
    '/seller-complete-profile/:path*',
    '/complete-profile/:path*',
    
    // Admin protected routes
    '/admin-dashboard/:path*',
    '/admin-login',
    '/admin-registration',
    
    // Login and registration pages (for middleware processing)
    '/buyer-login',
    '/buyer-registration', 
    '/seller-login',
    '/seller-registration',
  ]
};