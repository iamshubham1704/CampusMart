import { NextResponse } from 'next/server'

export function middleware(request) {
  const pathname = request.nextUrl.pathname
  
  // Check if the request is for a dashboard route
  const isSellerDashboard = pathname.includes('seller-dashboard') || 
                           pathname.includes('seller-complete-profile') ||
                           pathname.includes('registration-seller')
  
  const isBuyerDashboard = pathname.includes('buyer-dashboard') || 
                          pathname.includes('buyer-login') ||
                          pathname.includes('buyer-registration') ||
                          pathname.includes('complete-profile')

  if (isSellerDashboard || isBuyerDashboard) {
    // Check for authentication token (adjust based on your auth method)
    const token = request.cookies.get('auth-token')?.value || 
                  request.headers.get('authorization')

    if (!token) {
      // Redirect to appropriate login based on dashboard type
      let loginUrl
      
      if (isSellerDashboard) {
        loginUrl = new URL('/seller-login', request.url)
      } else if (isBuyerDashboard) {
        loginUrl = new URL('/buyer-login', request.url)
      }
      
      // Add redirect parameter to return user to original destination after login
      if (loginUrl) {
        loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
        return NextResponse.redirect(loginUrl)
      }
    }

    // Optional: Validate token here if needed
    // You might want to verify the token with your auth service
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/buyer-dashboard/:path*',
    '/seller-dashboard/:path*',
    '/seller-complete-profile/:path*',
    '/complete-profile/:path*',
    // Add other protected routes as needed
  ]
}