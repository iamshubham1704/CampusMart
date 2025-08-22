# CampusMart Admin Team Assignment System

## Overview

The CampusMart platform now includes a comprehensive admin team assignment system that ensures each admin manages their own separate schedules and team members. This system prevents admins from seeing or managing schedules created by other admins, and ensures sellers and buyers can only book slots from their assigned admin team.

## System Architecture

### Collections

#### 1. `admin_team_assignments` Collection
Stores the relationship between users (sellers/buyers) and their assigned admin teams.

**Schema:**
```javascript
{
  _id: ObjectId,
  userId: ObjectId,           // Reference to user (seller or buyer)
  userType: String,           // "seller" or "buyer"
  assignedAdminId: ObjectId,  // Reference to admin user
  assignedAt: Date,           // When the assignment was made
  notes: String,              // Additional notes about the assignment
  status: String,             // "active", "inactive", "suspended"
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. `admin_schedules` Collection (Updated)
Now includes admin ID filtering to ensure schedules are admin-specific.

**Schema:**
```javascript
{
  _id: ObjectId,
  adminId: ObjectId,          // Admin who created the schedule (REQUIRED)
  date: Date,                 // Date of the schedule
  startTime: String,          // Start time (e.g., "8:00 AM")
  endTime: String,            // End time (e.g., "1:00 PM")
  type: String,               // "delivery" or "pickup"
  location: String,           // Pickup/delivery location
  maxSlots: Number,           // Maximum number of bookings allowed
  currentSlots: Number,       // Current number of bookings
  status: String,             // "active", "inactive", "cancelled"
  createdAt: Date,
  updatedAt: Date
}
```

#### 3. `deliveries` Collection (Updated)
Now includes admin team validation.

**Schema:**
```javascript
{
  _id: ObjectId,
  productId: ObjectId,        // Reference to the product/listing
  sellerId: ObjectId,         // Reference to seller user
  adminId: ObjectId,          // Reference to assigned admin (from team assignment)
  adminScheduleId: ObjectId,  // Reference to admin schedule
  preferredTime: String,      // Seller's preferred time within slot
  notes: String,              // Additional notes from seller
  status: String,             // "pending", "confirmed", "completed", "cancelled"
  createdAt: Date,
  updatedAt: Date
}
```

#### 4. `pickups` Collection (Updated)
Now includes admin team validation.

**Schema:**
```javascript
{
  _id: ObjectId,
  productId: ObjectId,        // Reference to the product/listing
  buyerId: ObjectId,          // Reference to buyer user
  sellerId: ObjectId,         // Reference to seller user
  adminId: ObjectId,          // Reference to assigned admin (from team assignment)
  adminScheduleId: ObjectId,  // Reference to admin schedule
  deliveryId: ObjectId,       // Reference to delivery record
  preferredTime: String,      // Buyer's preferred time within slot
  notes: String,              // Additional notes from buyer
  status: String,             // "pending", "confirmed", "completed", "cancelled"
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Admin Team Assignment Management

#### `GET /api/admin/team-assignment`
Fetch team assignments for the logged-in admin.

**Query Parameters:**
- `type`: Filter by user type ("sellers", "buyers", or "all")

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "userId": "...",
      "userType": "seller",
      "assignedAdminId": "...",
      "assignedAt": "2024-01-24T00:00:00.000Z",
      "notes": "Assigned to campus gate A team",
      "status": "active",
      "user": {
        "name": "John Doe",
        "email": "john@example.com",
        "college": "Engineering College"
      }
    }
  ]
}
```

#### `POST /api/admin/team-assignment`
Assign a user to the admin's team.

**Request Body:**
```json
{
  "userId": "...",
  "userType": "seller",
  "notes": "Assigned to campus gate A team"
}
```

#### `PUT /api/admin/team-assignment`
Update team assignment details.

**Request Body:**
```json
{
  "assignmentId": "...",
  "notes": "Updated notes",
  "status": "active"
}
```

#### `DELETE /api/admin/team-assignment?id={assignmentId}`
Remove user from admin team.

### Admin Schedule Management (Updated)

#### `GET /api/admin/schedule`
Fetch admin schedules with admin-specific filtering.

**Query Parameters:**
- `date`: Filter by specific date
- `type`: Filter by type ("delivery" or "pickup")
- `adminId`: Filter by specific admin (for admin users, defaults to their own ID)
- `status`: Filter by status ("active" or "all")

**Security Features:**
- Admin users can only see their own schedules
- Sellers/buyers can only see schedules from their assigned admin team
- Automatic admin ID filtering based on authentication

### User Management

#### `GET /api/admin/users`
Fetch available users for team assignment.

**Query Parameters:**
- `available`: "true" to get users not yet assigned to any admin team
- `type`: Filter by user type ("seller" or "buyer")
- `search`: Search by name, email, or college

## User Workflow

### 1. Admin Team Setup
1. Admin logs into the system
2. Navigates to Admin Dashboard → Team tab
3. Clicks "Assign User" to add sellers/buyers to their team
4. Selects user type (seller/buyer) and specific user
5. Adds optional notes about the assignment
6. User is now assigned to the admin's team

### 2. Admin Schedule Creation
1. Admin navigates to Admin Dashboard → Schedules tab
2. Clicks "Create Schedule" button
3. Selects date, type (delivery/pickup), time range, location, and max slots
4. Schedule is automatically created with the admin's ID
5. Schedule appears only in the admin's calendar view

### 3. Seller Delivery Booking
1. Seller's product is marked as sold
2. System checks if seller is assigned to an admin team
3. If assigned, seller sees available delivery schedules from their assigned admin only
4. Seller selects preferred time and adds notes
5. Delivery is booked with the assigned admin's schedule

### 4. Buyer Pickup Booking
1. After seller books delivery, buyer can book pickup
2. System checks if buyer is assigned to an admin team
3. If assigned, buyer sees available pickup schedules from their assigned admin only
4. Buyer selects preferred time and adds notes
5. Pickup is booked with the assigned admin's schedule

## Security Features

### Admin Isolation
- **Schedule Isolation**: Each admin can only see and manage their own schedules
- **Team Isolation**: Each admin can only manage users assigned to their team
- **API Protection**: All endpoints validate admin ownership before allowing access

### User Assignment Validation
- **Single Assignment**: Users can only be assigned to one admin team at a time
- **Role Validation**: System ensures sellers and buyers are assigned to appropriate teams
- **Assignment Verification**: All delivery/pickup bookings verify team assignment before allowing

### Token Security
- **Admin Token Validation**: All admin operations require valid admin JWT tokens
- **User Context**: Tokens include admin ID for proper filtering
- **Permission Checks**: Role-based access control for all operations

## Components

### AdminScheduleManager
Main component for admins to manage both schedules and team assignments.
- **Schedules Tab**: Create and manage delivery/pickup schedules
- **Team Tab**: Manage team assignments for sellers and buyers
- **Admin ID Detection**: Automatically detects admin ID from JWT token
- **Schedule Filtering**: Only shows schedules created by the logged-in admin

### AdminTeamManager
Component for managing admin team assignments.
- **User Assignment**: Assign sellers and buyers to admin teams
- **Team Overview**: View current team members and statistics
- **Assignment Management**: Update and remove team assignments
- **User Search**: Find available users for team assignment

## Database Indexes

For optimal performance, consider adding these indexes:

```javascript
// admin_team_assignments collection
db.admin_team_assignments.createIndex({ "assignedAdminId": 1, "status": 1 })
db.admin_team_assignments.createIndex({ "userId": 1, "userType": 1 })
db.admin_team_assignments.createIndex({ "status": 1 })

// admin_schedules collection
db.admin_schedules.createIndex({ "adminId": 1, "date": 1, "type": 1 })
db.admin_schedules.createIndex({ "adminId": 1, "status": 1 })

// deliveries collection
db.deliveries.createIndex({ "adminId": 1, "adminScheduleId": 1 })
db.deliveries.createIndex({ "sellerId": 1, "productId": 1 })

// pickups collection
db.pickups.createIndex({ "adminId": 1, "adminScheduleId": 1 })
db.pickups.createIndex({ "buyerId": 1, "deliveryId": 1 })
```

## Migration Notes

If upgrading from the previous system:

1. **Create admin_team_assignments collection** if it doesn't exist
2. **Update existing admin_schedules** to include adminId field
3. **Assign existing users** to appropriate admin teams
4. **Update existing deliveries/pickups** to include proper adminId references

## Benefits

### For Admins
- **Clear Ownership**: Each admin manages their own schedules and team
- **Better Organization**: Clear separation of responsibilities
- **Team Management**: Easy assignment and management of sellers/buyers

### For Users
- **Clear Support**: Users know exactly which admin team supports them
- **Consistent Experience**: All interactions go through the same admin team
- **Better Coordination**: Streamlined delivery and pickup processes

### For System
- **Scalability**: Multiple admin teams can operate independently
- **Security**: Proper isolation prevents unauthorized access
- **Maintainability**: Clear separation of concerns and responsibilities

## Troubleshooting

### Common Issues

1. **"Admin ID not detected"**
   - Solution: Re-login to refresh admin token
   - Check if admin token is properly stored in localStorage

2. **"You are not assigned to any admin team"**
   - Solution: Contact an administrator to be assigned to a team
   - Check if team assignment status is "active"

3. **"Schedule not found or not available for your team"**
   - Solution: Ensure you're trying to book from your assigned admin's schedule
   - Check if the schedule is active and has available slots

4. **"User is already assigned to admin"**
   - Solution: Remove user from current team before reassigning
   - Check existing team assignments

### Debug Endpoints

Use these endpoints for troubleshooting:

- `GET /api/admin/schedule?debug=true` - Check authentication and admin ID
- `GET /api/admin/team-assignment?type=all` - View all team assignments
- `GET /api/admin/users?available=true` - Check available users for assignment
