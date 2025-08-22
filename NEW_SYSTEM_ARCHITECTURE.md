# 🚀 New System Architecture: Admin Schedules, Deliveries & Pickups

## 📋 **Overview**
This document describes the completely redesigned system for managing delivery and pickup schedules in CampusMart. The new system provides a cleaner, more logical flow where admins create schedules, sellers book delivery slots, and buyers book pickup slots only after delivery completion.

## 🏗️ **System Architecture**

### **1. Collections Structure**

#### **`admin_schedules`**
- **Purpose**: Admins create daily schedules with delivery/pickup slots
- **Key Fields**:
  - `adminId`: ObjectId - Admin who created this schedule
  - `date`: Date - Date of the schedule
  - `startTime`: String - Start time (e.g., "8:00 AM")
  - `endTime`: String - End time (e.g., "10:00 AM")
  - `type`: String - Either "delivery" or "pickup"
  - `location`: String - Location for delivery/pickup
  - `maxSlots`: Number - Maximum number of slots available
  - `currentSlots`: Number - Current slots booked (auto-calculated)
  - `status`: String - "active" or "inactive"

#### **`deliveries`**
- **Purpose**: Sellers book delivery slots from admin schedules
- **Key Fields**:
  - `productId`: ObjectId - Product being delivered
  - `sellerId`: ObjectId - Seller booking the delivery
  - `adminId`: ObjectId - Admin assigned to the order
  - `adminScheduleId`: ObjectId - Reference to admin schedule
  - `status`: String - "pending", "confirmed", "in_progress", "completed", "cancelled"
  - `preferredTime`: String - Seller's preferred time
  - `notes`: String - Additional notes

#### **`pickups`**
- **Purpose**: Buyers book pickup slots from admin schedules (after delivery completion)
- **Key Fields**:
  - `productId`: ObjectId - Product being picked up
  - `buyerId`: ObjectId - Buyer booking the pickup
  - `sellerId`: ObjectId - Seller of the product
  - `adminId`: ObjectId - Admin assigned to the order
  - `adminScheduleId`: ObjectId - Reference to admin schedule
  - `deliveryId`: ObjectId - Reference to completed delivery
  - `status`: String - "pending", "confirmed", "in_progress", "completed", "cancelled"
  - `preferredTime`: String - Buyer's preferred time
  - `notes`: String - Additional notes

### **2. System Flow**

#### **Step 1: Order Assignment**
1. **Order is sold** → Added to `order_status` collection
2. **Admin assigns themselves** → Sets `assignedAdminId` in `order_status`
3. **Order now has admin** → Ready for delivery/pickup scheduling

#### **Step 2: Admin Creates Schedules**
1. **Admin logs in** → Can see their dashboard
2. **Creates daily schedules** → Sets date, time, type (delivery/pickup), location, max slots
3. **Schedules are admin-specific** → Only that admin can see/manage their schedules

#### **Step 3: Seller Books Delivery**
1. **Seller logs in** → Sees available delivery schedules from their assigned admin
2. **Selects schedule** → Chooses date, time, location
3. **Books delivery** → Creates record in `deliveries` collection
4. **Admin verifies** → Can update delivery status

#### **Step 4: Buyer Books Pickup**
1. **Delivery completed** → Admin marks delivery as "completed"
2. **Buyer can now book pickup** → Only after delivery completion
3. **Selects pickup schedule** → From their assigned admin's pickup schedules
4. **Books pickup** → Creates record in `pickups` collection
5. **Pickup date validation** → Must be after delivery completion date

## 🔐 **Access Control & Security**

### **Admin Access**
- **Can create/edit/delete** their own schedules
- **Can view all deliveries/pickups** in the system
- **Can update status** of any delivery/pickup
- **Cannot modify** schedules with existing bookings

### **Seller Access**
- **Can view** delivery schedules from their assigned admin
- **Can book** delivery slots for their products
- **Can view** their own deliveries
- **Cannot see** other sellers' schedules or bookings

### **Buyer Access**
- **Can view** pickup schedules from their assigned admin
- **Can book** pickup slots only after delivery completion
- **Can view** their own pickups
- **Cannot see** other buyers' schedules or bookings

## 🚦 **Business Rules**

### **Delivery Rules**
1. **Seller must have order** assigned to admin
2. **Admin must have active schedule** for delivery type
3. **Schedule must have available slots**
4. **Seller can only book one delivery per product**
5. **Delivery must be from assigned admin's schedule**

### **Pickup Rules**
1. **Buyer must have order** assigned to admin
2. **Delivery must be completed** before pickup booking
3. **Admin must have active schedule** for pickup type
4. **Schedule must have available slots**
5. **Pickup date must be after delivery completion**
6. **Buyer can only book one pickup per delivery**

### **Schedule Rules**
1. **Admin can only manage** their own schedules
2. **No overlapping schedules** for same admin, date, and type
3. **Cannot modify/delete** schedules with existing bookings
4. **Schedules are type-specific** (delivery or pickup)

## 🔧 **API Endpoints**

### **Admin Schedules** (`/api/admin/schedule`)
- `GET` - Get admin's own schedules
- `POST` - Create new schedule
- `PUT` - Update existing schedule
- `DELETE` - Delete schedule (if no bookings)

### **Deliveries** (`/api/admin/deliveries`)
- `GET` - Get deliveries (filtered by role)
- `POST` - Book delivery slot (seller only)
- `PUT` - Update delivery status

### **Pickups** (`/api/admin/pickups`)
- `GET` - Get pickups (filtered by role)
- `POST` - Book pickup slot (buyer only)
- `PUT` - Update pickup status

### **Seller Schedules** (`/api/seller/schedules`)
- `GET` - Get available delivery schedules from assigned admin

### **Buyer Schedules** (`/api/buyer/schedules`)
- `GET` - Get available pickup schedules from assigned admin (after delivery)

## 💡 **Key Benefits**

### **1. Cleaner Logic**
- **Order-based assignment** instead of user-based
- **Admin-specific schedules** instead of global schedules
- **Clear separation** between delivery and pickup workflows

### **2. Better Security**
- **Role-based access control** for all endpoints
- **Admin isolation** - admins only see their own schedules
- **Order validation** - users can only book for their assigned orders

### **3. Improved User Experience**
- **Sellers see relevant schedules** from their assigned admin
- **Buyers get clear feedback** about delivery requirements
- **Admin dashboard** shows only relevant information

### **4. Scalable Architecture**
- **Multiple admins** can work independently
- **Order-based assignment** supports high-volume operations
- **Clear data relationships** make debugging easier

## 🧪 **Testing Scenarios**

### **Test Case 1: Seller with Multiple Admins**
1. **Seller has 3 orders** assigned to different admins
2. **Each admin creates schedules** for different dates
3. **Seller sees schedules** from all assigned admins
4. **Seller can book** from any assigned admin's schedule

### **Test Case 2: Delivery to Pickup Flow**
1. **Admin creates delivery schedule** for August 25th
2. **Seller books delivery** for August 25th
3. **Admin marks delivery as completed**
4. **Admin creates pickup schedule** for August 26th
5. **Buyer books pickup** for August 26th

### **Test Case 3: Admin Isolation**
1. **Admin A creates schedules** for August 25th
2. **Admin B creates schedules** for August 25th
3. **Admin A only sees** their own schedules
4. **Admin B only sees** their own schedules

## 🚨 **Important Notes**

1. **Existing data migration** may be required
2. **Frontend components** need updates for new API structure
3. **Admin dashboard** should show only admin's own schedules
4. **Seller dashboard** should filter schedules by assigned admin
5. **Buyer dashboard** should require delivery completion first

## 🔄 **Migration Steps**

1. **Backup existing data** before making changes
2. **Update database schema** if needed
3. **Deploy new API endpoints**
4. **Update frontend components**
5. **Test all workflows** thoroughly
6. **Monitor system** for any issues

---

*This document was created to explain the new system architecture for CampusMart's delivery and pickup scheduling system.*
