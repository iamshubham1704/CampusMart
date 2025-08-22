# CampusMart Delivery & Pickup Schedule System

## Overview

The CampusMart platform now includes a comprehensive delivery and pickup scheduling system that allows admins to create available time slots for sellers to book delivery services and buyers to book pickup services. This system ensures smooth coordination between all parties involved in the transaction process.

## System Architecture

### Collections

#### 1. `admin_schedules` Collection
Stores admin-created time slots for delivery and pickup services.

**Schema:**
```javascript
{
  _id: ObjectId,
  adminId: ObjectId,        // Reference to admin user
  date: Date,               // Date of the schedule
  startTime: String,        // Start time (e.g., "8:00 AM")
  endTime: String,          // End time (e.g., "1:00 PM")
  type: String,             // "delivery" or "pickup"
  location: String,         // Pickup/delivery location
  maxSlots: Number,         // Maximum number of bookings allowed
  currentSlots: Number,     // Current number of bookings
  status: String,           // "active", "inactive", "cancelled"
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. `deliveries` Collection
Stores seller bookings for delivery services.

**Schema:**
```javascript
{
  _id: ObjectId,
  productId: ObjectId,      // Reference to the product/listing
  sellerId: ObjectId,       // Reference to seller user
  adminId: ObjectId,        // Reference to assigned admin
  adminScheduleId: ObjectId, // Reference to admin schedule
  preferredTime: String,    // Seller's preferred time within slot
  notes: String,            // Additional notes from seller
  status: String,           // "pending", "confirmed", "in_progress", "completed", "cancelled"
  adminNotes: String,       // Notes from admin
  createdAt: Date,
  updatedAt: Date
}
```

#### 3. `pickups` Collection
Stores buyer bookings for pickup services.

**Schema:**
```javascript
{
  _id: ObjectId,
  productId: ObjectId,      // Reference to the product/listing
  buyerId: ObjectId,        // Reference to buyer user
  sellerId: ObjectId,       // Reference to seller user
  adminId: ObjectId,        // Reference to assigned admin
  adminScheduleId: ObjectId, // Reference to admin schedule
  deliveryId: ObjectId,     // Reference to delivery record
  preferredTime: String,    // Buyer's preferred time within slot
  notes: String,            // Additional notes from buyer
  status: String,           // "pending", "confirmed", "in_progress", "completed", "cancelled"
  adminNotes: String,       // Notes from admin
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Admin Schedule Management

#### `GET /api/admin/schedule`
Fetch admin schedules with optional filters.

**Query Parameters:**
- `date`: Filter by specific date
- `type`: Filter by type ("delivery" or "pickup")
- `adminId`: Filter by specific admin

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "adminId": "...",
      "date": "2024-01-24T00:00:00.000Z",
      "startTime": "8:00 AM",
      "endTime": "1:00 PM",
      "type": "delivery",
      "location": "Campus Gate A",
      "maxSlots": 10,
      "currentSlots": 3,
      "status": "active"
    }
  ]
}
```

#### `POST /api/admin/schedule`
Create a new admin schedule.

**Request Body:**
```json
{
  "date": "2024-01-24",
  "startTime": "8:00 AM",
  "endTime": "1:00 PM",
  "type": "delivery",
  "location": "Campus Gate A",
  "maxSlots": 10
}
```

#### `PUT /api/admin/schedule`
Update an existing admin schedule.

**Request Body:**
```json
{
  "scheduleId": "...",
  "startTime": "9:00 AM",
  "endTime": "2:00 PM",
  "location": "Student Center",
  "maxSlots": 15,
  "status": "inactive"
}
```

#### `DELETE /api/admin/schedule?id={scheduleId}`
Delete an admin schedule (only if no bookings exist).

### Delivery Management

#### `GET /api/admin/deliveries`
Fetch delivery bookings with optional filters.

**Query Parameters:**
- `sellerId`: Filter by specific seller
- `adminId`: Filter by specific admin
- `status`: Filter by status
- `adminScheduleId`: Filter by admin schedule

#### `POST /api/admin/deliveries`
Create a new delivery booking (seller action).

**Request Body:**
```json
{
  "productId": "...",
  "adminScheduleId": "...",
  "preferredTime": "9:00 AM",
  "notes": "Please handle with care"
}
```

#### `PUT /api/admin/deliveries`
Update delivery status.

**Request Body:**
```json
{
  "deliveryId": "...",
  "status": "confirmed",
  "adminNotes": "Confirmed for 9:00 AM"
}
```

### Pickup Management

#### `GET /api/admin/pickups`
Fetch pickup bookings with optional filters.

**Query Parameters:**
- `buyerId`: Filter by specific buyer
- `adminId`: Filter by specific admin
- `status`: Filter by status
- `adminScheduleId`: Filter by admin schedule
- `deliveryId`: Filter by delivery record

#### `POST /api/admin/pickups`
Create a new pickup booking (buyer action).

**Request Body:**
```json
{
  "productId": "...",
  "adminScheduleId": "...",
  "deliveryId": "...",
  "preferredTime": "10:00 AM",
  "notes": "Will bring ID for verification"
}
```

#### `PUT /api/admin/pickups`
Update pickup status.

**Request Body:**
```json
{
  "pickupId": "...",
  "status": "confirmed",
  "adminNotes": "Confirmed for 10:00 AM"
}
```

## User Workflow

### 1. Admin Creates Schedules
1. Admin navigates to Profile → Schedule tab
2. Clicks "Create Schedule" button
3. Selects date, type (delivery/pickup), time range, location, and max slots
4. Submits the schedule
5. Schedule appears in the 10-day calendar view

### 2. Seller Books Delivery
1. Seller's product is marked as sold
2. Seller sees "Your delivery is scheduled" notification
3. Seller clicks to book delivery slot
4. Seller selects from available admin delivery schedules
5. Seller chooses preferred time and adds notes
6. Delivery booking is created and linked to admin schedule

### 3. Buyer Books Pickup
1. After delivery is scheduled, buyer can book pickup
2. Buyer sees pickup option in order history
3. Buyer selects from available admin pickup schedules
4. Buyer chooses preferred time and adds notes
5. Pickup booking is created and linked to delivery record

### 4. Admin Manages Bookings
1. Admin can view all bookings in their schedules
2. Admin can update status of deliveries and pickups
3. Admin can add notes and manage the process
4. Admin can cancel or modify schedules (if no bookings exist)

## Components

### AdminScheduleManager
- **Location**: `components/AdminScheduleManager.js`
- **Purpose**: Allows admins to create, view, and manage delivery/pickup schedules
- **Features**: 
  - 10-day calendar view (3 past, today, 6 future)
  - Create schedule form with time selection
  - Visual schedule management
  - Delete schedules

### SellerDeliveryBooking
- **Location**: `components/SellerDeliveryBooking.js`
- **Purpose**: Allows sellers to book delivery slots
- **Features**:
  - View available delivery schedules
  - Select preferred time within slot
  - Add notes and confirm booking

### BuyerPickupBooking
- **Location**: `components/BuyerPickupBooking.js`
- **Purpose**: Allows buyers to book pickup slots
- **Features**:
  - View available pickup schedules
  - Select preferred time within slot
  - Add notes and confirm booking
  - Important pickup information

## Integration Points

### Seller Dashboard
- Show delivery booking option when product is sold
- Display delivery status and details
- Link to delivery booking component

### Buyer Dashboard
- Show pickup booking option in order history
- Display pickup status and details
- Link to pickup booking component

### Admin Dashboard
- Schedule management in profile section
- View all deliveries and pickups
- Manage booking statuses

## Security Features

1. **Authentication**: All endpoints require valid user tokens
2. **Authorization**: Users can only access their own data
3. **Validation**: Input validation for all form fields
4. **Rate Limiting**: Prevents abuse of booking system
5. **Data Integrity**: Prevents deletion of schedules with existing bookings

## Business Rules

1. **Schedule Creation**: Only admins can create schedules
2. **Booking Limits**: Cannot exceed maxSlots for any schedule
3. **Status Flow**: Bookings follow logical status progression
4. **Cancellation**: Schedules with bookings cannot be deleted
5. **Time Constraints**: Preferred times must be within schedule range

## Future Enhancements

1. **Automated Notifications**: Email/SMS reminders for scheduled slots
2. **Calendar Integration**: Sync with external calendar systems
3. **Analytics Dashboard**: Track booking patterns and efficiency
4. **Mobile App**: Native mobile booking experience
5. **Payment Integration**: Optional premium delivery services
6. **Route Optimization**: Optimize admin travel between locations

## Testing

### Manual Testing Scenarios
1. Admin creates delivery and pickup schedules
2. Seller books delivery slot successfully
3. Buyer books pickup slot successfully
4. Admin updates booking statuses
5. Error handling for invalid inputs
6. Edge cases (full schedules, cancellations)

### API Testing
1. Test all endpoints with valid/invalid data
2. Test authentication and authorization
3. Test error handling and validation
4. Test concurrent booking scenarios

## Deployment

1. **Database**: Ensure MongoDB collections are created
2. **Environment Variables**: Set required environment variables
3. **API Routes**: Deploy new API endpoints
4. **Components**: Include new React components
5. **Testing**: Verify functionality in staging environment

## Support

For technical support or questions about the delivery and pickup system, please contact the development team or refer to the API documentation.

---

**Version**: 1.0.0  
**Last Updated**: January 2024  
**Maintainer**: CampusMart Development Team
