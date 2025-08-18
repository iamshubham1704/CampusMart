# Order History Feature for CampusMart

## Overview
The Order History feature allows buyers to track all their orders from payment submission to delivery completion. It automatically updates order statuses based on payment verification and delivery progress.

## Features

### 1. Automatic Order Tracking
- **Payment Screenshot Upload**: When a buyer uploads a payment screenshot, an order is automatically created
- **Real-time Status Updates**: Order status updates automatically based on admin actions
- **Integrated with Existing Systems**: Works with payment verification and order status management

### 2. Order Status Flow
1. **Payment Pending Verification** - Initial status when payment screenshot is uploaded
2. **Payment Verified** - Admin verifies the payment screenshot
3. **Will be Delivered Soon** - Admin marks order for delivery coordination
4. **Delivered** - Order successfully delivered to buyer
5. **Payment Rejected** - If payment verification fails (with admin contact info)

### 3. Order Information Display
- **Product Details**: Name, price, image, category
- **Seller Information**: Name, email, phone number
- **Order Details**: Amount, payment method, order date
- **Status Updates**: Real-time status with color-coded badges
- **Admin Contact**: Direct contact info for rejected payments

## Technical Implementation

### Database Collections Used
- `orders` - Main order records
- `payment_screenshots` - Payment verification data
- `order_status` - Detailed order progress tracking
- `listings` - Product information
- `sellers` - Seller details
- `buyers` - Buyer information

### API Endpoints
- `GET /api/buyer/order-history` - Fetch buyer's order history
- Supports pagination and status filtering

### Frontend Components
- **Order History Page**: `/buyer-dashboard/order-history`
- **Navigation**: Added to buyer dashboard sidebar
- **Header Action**: Quick access button in dashboard header

## How to Use

### For Buyers
1. **Access Order History**: 
   - Navigate to Buyer Dashboard
   - Click "Order History" in the sidebar
   - Or click the Package icon in the header

2. **View Orders**:
   - See all orders with current status
   - Filter by status (All, Payment Pending, Verified, etc.)
   - Search orders by product name, seller, or status

3. **Track Progress**:
   - Monitor payment verification status
   - See delivery coordination updates
   - Contact admin if payment is rejected

### For Admins
1. **Payment Verification**:
   - Verify payment screenshots in admin dashboard
   - Approve or reject payments
   - Update order status automatically

2. **Order Management**:
   - Track order progress through steps
   - Coordinate delivery between buyer and seller
   - Mark orders as delivered

## Status Meanings

| Status | Description | Color | Action Required |
|--------|-------------|-------|-----------------|
| Payment Pending | Screenshot uploaded, waiting for admin verification | Orange | Admin to verify payment |
| Payment Verified | Payment confirmed, order processing | Green | Admin to coordinate delivery |
| Will be Delivered Soon | Delivery coordination in progress | Blue | Admin to arrange delivery |
| Delivered | Order successfully completed | Green | None - Order complete |
| Payment Rejected | Payment verification failed | Red | Buyer to contact admin |

## Admin Contact Information
- **Email**: iamshubham1719@gmail.com
- **Phone**: +91 9315863073

## File Structure
```
app/
├── api/
│   └── buyer/
│       └── order-history/
│           └── route.js          # API endpoint
├── buyer-dashboard/
│   ├── order-history/
│   │   ├── page.js               # Order history page
│   │   └── OrderHistory.module.css # Styling
│   ├── page.js                   # Updated with navigation
│   └── BuyerDashboard.css        # Updated with nav styles
```

## Integration Points

### Payment Screenshot Upload
- Automatically creates order record
- Links payment screenshot to order
- Sets initial status to "payment_pending_verification"

### Admin Payment Verification
- Updates payment screenshot status
- Triggers order status updates
- Creates order_status records for tracking

### Order Status Management
- Tracks delivery progress
- Updates buyer dashboard in real-time
- Provides delivery coordination workflow

## Benefits

1. **Transparency**: Buyers can see exactly where their order stands
2. **Automation**: Status updates happen automatically based on admin actions
3. **Communication**: Clear contact information for issues
4. **Tracking**: Complete order lifecycle from payment to delivery
5. **User Experience**: Intuitive interface with status filtering and search

## Future Enhancements

1. **Email Notifications**: Automatic status update emails
2. **SMS Alerts**: Text message notifications for key status changes
3. **Delivery Tracking**: Real-time delivery location updates
4. **Order History Export**: Download order history as PDF/CSV
5. **Review System**: Post-delivery product reviews and ratings

## Troubleshooting

### Common Issues
1. **Orders not showing**: Check if buyer is authenticated
2. **Status not updating**: Verify admin has updated order status
3. **Images not loading**: Check product image URLs in listings collection

### Debug Steps
1. Check browser console for API errors
2. Verify database collections have correct data
3. Ensure authentication tokens are valid
4. Check admin dashboard for order status updates

## Support
For technical support or feature requests, contact the development team or refer to the admin contact information above.
