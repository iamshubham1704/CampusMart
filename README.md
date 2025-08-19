# CampusMart

A comprehensive marketplace platform for college students to buy and sell items.

## Recent Updates

### iPhone/iOS Pattern Validation Fix (Latest)

**Issue Resolved**: Fixed the "The string did not match the expected pattern" error that occurred when users tried to create listings on iPhone devices.

**Root Cause**: The error was caused by:
1. iOS Safari cookie handling differences
2. Token format validation issues on mobile devices
3. Form data encoding problems specific to iOS

**Solutions Implemented**:

1. **Enhanced Cookie Handling**:
   - Improved cookie parsing for iOS Safari compatibility
   - Added fallback parsing methods for problematic cookie headers
   - Enhanced cookie configuration with mobile-specific optimizations

2. **Robust Token Validation**:
   - Added comprehensive JWT format validation
   - Implemented fallback token retrieval from multiple storage locations
   - Enhanced error handling for mobile device authentication issues

3. **Mobile Device Optimizations**:
   - Added mobile device detection utilities
   - Enhanced form validation with mobile-specific error messages
   - Improved API error handling for mobile devices

4. **Enhanced Error Handling**:
   - Better error messages for mobile users
   - Specific guidance for clearing cache and cookies
   - Fallback mechanisms for authentication failures

**For Users Experiencing Issues**:
- Clear browser cache and cookies
- Log out and log back in
- Ensure you're using the latest version of iOS Safari
- If problems persist, try using a different browser temporarily

## Features

- **User Management**: Separate buyer and seller accounts with role-based access
- **Product Listings**: Create, manage, and browse product listings
- **Messaging System**: Built-in chat functionality for buyers and sellers
- **Payment Integration**: Secure payment processing with commission handling
- **Admin Dashboard**: Comprehensive admin panel for platform management
- **Mobile Responsive**: Optimized for all device types including iOS and Android

## Technology Stack

- **Frontend**: Next.js 13+ with App Router
- **Backend**: Node.js with API Routes
- **Database**: MongoDB
- **Authentication**: JWT with enhanced mobile device support
- **Image Storage**: ImageKit integration
- **Styling**: CSS Modules with responsive design

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run the development server: `npm run dev`

## Environment Variables

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=your_imagekit_url_endpoint
COOKIE_DOMAIN=your_domain_for_cookies
```

## Mobile Device Compatibility

The platform is fully optimized for mobile devices including:
- iOS Safari (iPhone/iPad)
- Android Chrome
- Mobile web browsers
- Progressive Web App (PWA) support

## Support

For technical support or to report issues, please contact the development team or create an issue in the repository.

---

**Note**: This platform is specifically designed to handle mobile device authentication issues and provides robust fallback mechanisms for various browser environments.
