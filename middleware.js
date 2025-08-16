// middleware.js (Fixed for Edge Runtime)
import { NextResponse } from 'next/server';
import { extractTokenFromRequest, validateTokenBasic } from './lib/authEdge';

export function middleware(request) {
  const pathname = request.nextUrl.pathname;
  
  // Check if the request is for admin routes
  const isAdminRoute = pathname.startsWith('/admin-dashboard') || 
                      pathname.startsWith('/admin-registration') ||
                      pathname.startsWith('/admin-login');
  
  // Check if the request is for a dashboard route
  const isSellerDashboard = pathname.includes('seller-dashboard') || 
                           pathname.includes('seller-complete-profile') ||
                           pathname.includes('registration-seller');
  
  const isBuyerDashboard = pathname.includes('buyer-dashboard') || 
                          pathname.includes('buyer-login') ||
                          pathname.includes('buyer-registration') ||
                          pathname.includes('complete-profile');

  // Handle Admin Routes
  if (isAdminRoute) {
    // Allow access to login and registration pages
    if (pathname === '/admin-login' || pathname === '/admin-registration') {
      return NextResponse.next();
    }

    // For admin dashboard routes, validate token
    if (pathname.startsWith('/admin-dashboard')) {
      const adminToken = request.cookies.get('admin-auth-token')?.value || 
                        extractTokenFromRequest(request);

      if (!adminToken) {
        return NextResponse.redirect(new URL('/admin-login', request.url));
      }

      // Validate token using edge-compatible function
      const validation = validateTokenBasic(adminToken);
      if (!validation.valid) {
        console.log('Admin token validation failed:', validation.error);
        return NextResponse.redirect(new URL('/admin-login', request.url));
      }

      // Check if user has admin role
      if (validation.payload.role !== 'admin') {
        return NextResponse.redirect(new URL('/admin-login', request.url));
      }
    }

    return NextResponse.next();
  }

  // Handle Seller and Buyer Routes (existing logic with basic validation)
  if (isSellerDashboard || isBuyerDashboard) {
    // Check for authentication token
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

    // Basic token validation
    const validation = validateTokenBasic(token);
    if (!validation.valid) {
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

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Existing protected routes
    '/buyer-dashboard/:path*',
    '/seller-dashboard/:path*',
    '/seller-complete-profile/:path*',
    '/complete-profile/:path*',
    
    // New admin protected routes
    '/admin-dashboard/:path*',
    '/admin-login',
    '/admin-registration',
    
    // Add other protected routes as needed
  ]
};