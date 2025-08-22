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

# CampusMart Delivery & Pickup Schedule System

## Overview
A comprehensive delivery and pickup scheduling system for CampusMart, allowing admins to manage delivery schedules, sellers to book delivery slots, and buyers to book pickup slots.

## Collections

### 1. admin_schedules
Stores free delivery and pickup time slots created by admins.
```javascript
{
  _id: ObjectId,
  adminId: ObjectId,        // Admin who created the schedule
  date: Date,               // Date of the schedule
  startTime: String,        // Start time (e.g., "8:00 AM")
  endTime: String,          // End time (e.g., "1:00 PM")
  type: String,             // "delivery" or "pickup"
  location: String,         // Location for pickup/delivery
  maxSlots: Number,         // Maximum number of slots available
  currentSlots: Number,     // Current number of booked slots
  status: String,           // "active", "inactive", "cancelled"
  createdAt: Date,
  updatedAt: Date
}
```

### 2. deliveries
Stores delivery bookings made by sellers.
```javascript
{
  _id: ObjectId,
  productId: ObjectId,      // Reference to the product/listing
  sellerId: ObjectId,       // Reference to the seller
  adminScheduleId: ObjectId, // Reference to admin_schedules
  preferredTime: String,    // Seller's preferred time within the slot
  notes: String,            // Additional notes from seller
  status: String,           // "pending", "confirmed", "completed", "cancelled"
  createdAt: Date,
  updatedAt: Date
}
```

### 3. pickups
Stores pickup bookings made by buyers.
```javascript
{
  _id: ObjectId,
  productId: ObjectId,      // Reference to the product/listing
  buyerId: ObjectId,        // Reference to the buyer
  sellerId: ObjectId,       // Reference to the seller
  adminScheduleId: ObjectId, // Reference to admin_schedules
  deliveryId: ObjectId,     // Reference to deliveries
  preferredTime: String,    // Buyer's preferred time within the slot
  notes: String,            // Additional notes from buyer
  status: String,           // "pending", "confirmed", "completed", "cancelled"
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Admin Schedule Management
- `GET /api/admin/schedule` - Fetch admin schedules with filters
- `POST /api/admin/schedule` - Create new schedule
- `PUT /api/admin/schedule` - Update existing schedule
- `DELETE /api/admin/schedule` - Delete schedule

### Seller Delivery Bookings
- `GET /api/admin/deliveries` - Fetch delivery bookings
- `POST /api/admin/deliveries` - Create delivery booking
- `PUT /api/admin/deliveries` - Update delivery status

### Buyer Pickup Bookings
- `GET /api/admin/pickups` - Fetch pickup bookings
- `POST /api/admin/pickups` - Create pickup booking
- `PUT /api/admin/pickups` - Update pickup status

## User Workflow

### Admin Workflow
1. **Create Schedules**: Admin creates free delivery/pickup time slots
2. **Manage Slots**: View and manage existing schedules
3. **Monitor Bookings**: Track delivery and pickup bookings

### Seller Workflow
1. **Product Sold**: When product is marked as sold
2. **Book Delivery**: Select available delivery slot from admin schedules
3. **Track Status**: Monitor delivery progress

### Buyer Workflow
1. **Product Purchased**: After seller books delivery
2. **Book Pickup**: Select available pickup slot from admin schedules
3. **Track Status**: Monitor pickup progress

## Components

### AdminScheduleManager
Main component for admins to manage delivery and pickup schedules.
- 10-day calendar view (3 past, today, 6 future)
- Create new schedules with date, time, type, location
- View existing schedules with slot availability
- Delete schedules

### SellerDeliveryBooking
Component for sellers to book delivery slots.
- View available delivery schedules
- Select preferred time and add notes
- Book delivery slot

### BuyerPickupBooking
Component for buyers to book pickup slots.
- View available pickup schedules
- Select preferred time and add notes
- Book pickup slot

### SellerDeliveryIntegration
Example integration component showing how to add delivery booking to seller dashboard.

## Security Features
- Admin-only access to schedule management
- Role-based access control for deliveries and pickups
- Token-based authentication
- Input validation and sanitization

## Business Rules
- Multiple sellers/buyers can book the same time slot
- Schedules can only be created for future dates
- Schedules are automatically marked as inactive after the date passes
- Slot availability is tracked and updated in real-time

## Future Enhancements
- Email/SMS notifications for schedule updates
- Calendar integration (Google Calendar, Outlook)
- Advanced scheduling algorithms
- Mobile app support
- Analytics and reporting

## Testing
- Test schedule creation and management
- Test delivery and pickup booking flows
- Test slot availability updates
- Test error handling and edge cases

## Troubleshooting

### Sync Verified Payments Not Working

If the "Sync Verified Payments" functionality is not working, follow these troubleshooting steps:

#### 1. **Check Database Collections**
Use the new "🔍 Debug Database" button to check:
- Total payment screenshots
- Number of verified payments
- Orders with payment screenshots
- Existing order statuses

#### 2. **Common Issues & Solutions**

**Issue: No verified payments found**
- **Cause**: Payment screenshots haven't been verified by admin
- **Solution**: Verify payment screenshots first in the payment verification section

**Issue: Missing related data**
- **Cause**: Buyer, seller, or product data is missing
- **Solution**: Ensure all users and products exist in their respective collections

**Issue: Database connection problems**
- **Cause**: MongoDB connection issues
- **Solution**: Check database connection and server status

**Issue: Permission errors**
- **Cause**: Admin token expired or invalid
- **Solution**: Re-login as admin to get fresh token

#### 3. **Debug Steps**

1. **Click "🔍 Debug Database"** button
2. **Check console logs** for detailed error messages
3. **Verify payment status** in payment_screenshots collection
4. **Check order relationships** between payments and orders
5. **Validate data integrity** across collections

#### 4. **Manual Verification**

Check these collections manually:
```javascript
// Check verified payments
db.payment_screenshots.find({ status: "verified" })

// Check orders with payment screenshots
db.orders.find({ paymentScreenshotId: { $exists: true } })

// Check existing order statuses
db.order_status.find({})
```

#### 5. **Reset Sync State**

If needed, you can reset the sync state:
```javascript
// Remove all order statuses (be careful!)
db.order_status.deleteMany({})

// Then run sync again
```

#### 6. **Contact Support**

If issues persist:
- Check browser console for error messages
- Review server logs for backend errors
- Ensure all required collections exist
- Verify database permissions and connections
