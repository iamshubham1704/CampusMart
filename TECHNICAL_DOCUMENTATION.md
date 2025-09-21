# CampusMart - Comprehensive Technical Documentation

## Table of Contents
1. [System Overview](#1-system-overview)
2. [Service-wise Documentation](#2-service-wise-documentation)
3. [Event Flow & Messaging](#3-event-flow--messaging)
4. [Data Flow](#4-data-flow)
5. [Authentication & Security](#5-authentication--security)
6. [Scalability & Reliability](#6-scalability--reliability)
7. [Eventual Extensions](#7-eventual-extensions)
8. [Appendices](#8-appendices)

---

## 1. System Overview

### 1.1 Project Introduction

**CampusMart** is a comprehensive marketplace platform designed specifically for college students to buy, sell, and exchange items within their campus community. The platform facilitates peer-to-peer commerce while providing administrative oversight and assignment management capabilities.

**Core Value Proposition:**
- Safe and trusted marketplace for college students
- Built-in messaging system for buyer-seller communication
- Assignment management system for academic support
- Comprehensive admin dashboard for platform oversight
- Mobile-optimized experience with iOS Safari compatibility

**Target Users:**
- **Students (Buyers)**: Purchase items, book pickups, manage orders, submit assignments
- **Students (Sellers)**: List products, manage inventory, handle deliveries, communicate with buyers
- **Alphas**: Assignment helpers and academic support staff
- **Admins**: Platform managers with full oversight capabilities

### 1.2 High-Level Architecture

**Architecture Type**: Monolith with Modular API Structure
- **Framework**: Next.js 15+ with App Router
- **Runtime**: Node.js
- **Database**: MongoDB with both native driver and Mongoose ODM
- **Authentication**: JWT-based with role-based access control
- **File Storage**: ImageKit for image management
- **Styling**: CSS Modules with Tailwind CSS

**Key Services & Components:**
1. **User Management Service** - Registration, authentication, profiles
2. **Marketplace Service** - Product listings, orders, payments
3. **Messaging Service** - Real-time chat between users
4. **Assignment Service** - Academic assignment management
5. **Admin Service** - Platform administration and oversight
6. **Delivery/Pickup Service** - Logistics coordination
7. **Payment Service** - Transaction processing and verification

**External Integrations:**
- **ImageKit**: Image storage and optimization
- **MongoDB Atlas**: Cloud database hosting
- **Email Service**: Nodemailer for notifications
- **QR Code Generation**: For order tracking

### 1.3 Deployment Approach

**Development Environment:**
- Local development with `npm run dev`
- Hot reload for rapid development
- Cross-platform compatibility (Windows, macOS, Linux)

**Technology Stack:**
- **Frontend**: React 19.1.1 with Next.js 15.5.2
- **Backend**: Node.js API routes
- **Database**: MongoDB 6.18.0 + Mongoose 8.17.1
- **Authentication**: JWT with enhanced mobile support
- **Build Tools**: Tailwind CSS 3.4.17, PostCSS, Autoprefixer

**Deployment Considerations:**
- Docker containerization (planned)
- CI/CD pipeline setup (planned)
- Environment variable management
- Database migration strategies
- Image optimization and CDN integration

---

## 2. Service-wise Documentation

### 2.1 User Management Service

**Responsibility**: Handle user registration, authentication, and profile management for buyers, sellers, alphas, and admins.

#### APIs:

##### Authentication Endpoints

**Buyer Authentication:**
```
POST /api/buyer/login
POST /api/buyer/register
```

**Request Body (Login):**
```json
{
  "email": "student@college.edu",
  "password": "securepassword123"
}
```

**Response (Login):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "64f...",
    "name": "John Doe",
    "email": "student@college.edu",
    "role": "buyer"
  }
}
```

**Seller Authentication:**
```
POST /api/seller/login
POST /api/seller/register
```

**Admin Authentication:**
```
POST /api/admin/login
POST /api/admin/register
```

**Alpha Authentication:**
```
POST /api/alpha/login
POST /api/alpha/register
```

##### Profile Management

**Get User Profile:**
```
GET /api/user/profile
Authorization: Bearer <jwt_token>
```

**Update User Profile:**
```
PUT /api/user/profile
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Updated Name",
  "phone": "1234567890",
  "college": "University Name"
}
```

#### Database Schema:

**Buyers Collection:**
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  phone: String,
  password: String (hashed),
  college: String,
  isActive: Boolean,
  createdAt: Date,
  lastLogin: Date
}
```

**Sellers Collection:**
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  phone: String,
  password: String (hashed),
  college: String,
  isActive: Boolean,
  totalSales: Number,
  totalEarnings: Number,
  rating: Number,
  createdAt: Date,
  lastLogin: Date
}
```

**Admins Collection:**
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: "admin",
  isActive: Boolean,
  createdAt: Date,
  lastLogin: Date
}
```

### 2.2 Marketplace Service

**Responsibility**: Manage product listings, orders, payments, and marketplace transactions.

#### APIs:

**Product Listings:**
```
GET    /api/listings          # Browse listings
POST   /api/listings          # Create listing
PUT    /api/listings/:id      # Update listing
DELETE /api/listings/:id      # Delete listing
GET    /api/listings/:id      # Get specific listing
```

**Create Listing Request:**
```json
{
  "title": "Calculus Textbook",
  "description": "Excellent condition, minimal highlighting",
  "price": 45.00,
  "category": "Books",
  "condition": "good",
  "images": ["image1_url", "image2_url"],
  "location": "Campus Library"
}
```

**Orders Management:**
```
GET    /api/buyer/orders      # Get buyer orders
POST   /api/buyer/orders      # Create order
GET    /api/seller/orders     # Get seller orders
PUT    /api/orders/:id        # Update order status
```

**Payment Screenshots:**
```
POST   /api/payment-screenshots        # Upload payment proof
GET    /api/payment-screenshots/:id    # View payment proof
PUT    /api/payment-screenshots/:id    # Update verification status
```

#### Database Schema:

**Listings Collection:**
```javascript
{
  _id: ObjectId,
  sellerId: ObjectId,
  title: String,
  description: String,
  price: Number,
  category: String,
  condition: String,
  images: [String],
  location: String,
  status: "active" | "sold" | "inactive",
  views: Number,
  createdAt: Date,
  updatedAt: Date
}
```

**Orders Collection:**
```javascript
{
  _id: ObjectId,
  buyerId: ObjectId,
  sellerId: ObjectId,
  productId: ObjectId,
  quantity: Number,
  totalAmount: Number,
  status: "pending" | "confirmed" | "completed" | "cancelled",
  paymentScreenshotId: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### 2.3 Messaging Service

**Responsibility**: Enable real-time communication between buyers and sellers.

#### APIs:

**Conversations:**
```
GET    /api/conversations?userType=buyer&userId=123
POST   /api/conversations      # Create conversation
```

**Messages:**
```
GET    /api/messages?conversationId=123
POST   /api/messages           # Send message
PUT    /api/messages/:id       # Mark as read
```

**Send Message Request:**
```json
{
  "conversationId": "64f...",
  "message": "Hi, is this item still available?",
  "senderType": "buyer"
}
```

#### Database Schema:

**Conversations Collection:**
```javascript
{
  _id: ObjectId,
  buyer_id: ObjectId,
  seller_id: ObjectId,
  product_id: ObjectId,
  lastMessage: String,
  lastMessageAt: Date,
  unreadCount: {
    buyer: Number,
    seller: Number
  },
  createdAt: Date
}
```

**Messages Collection:**
```javascript
{
  _id: ObjectId,
  conversation_id: ObjectId,
  sender_id: ObjectId,
  sender_type: "buyer" | "seller",
  message: String,
  created_at: Date,
  read_at: Date
}
```

### 2.4 Assignment Service

**Responsibility**: Manage academic assignments and alpha assignment system.

#### APIs:

**Assignment Management:**
```
GET    /api/assignments               # List assignments
POST   /api/assignments               # Create assignment
PUT    /api/assignments/:id           # Update assignment
DELETE /api/assignments/:id           # Delete assignment
POST   /api/assignments/upload-pdf    # Upload assignment PDF
```

**Alpha Assignment Endpoints:**
```
GET    /api/alpha/assignments         # Get alpha assignments
POST   /api/alpha/assignments         # Update assignment status
GET    /api/alpha/payments            # Get alpha payment requests
```

**Admin Assignment Management:**
```
GET    /api/admin/assignments         # Admin view assignments
POST   /api/admin/assignments         # Admin create assignments
PUT    /api/admin/assignments/:id     # Admin update assignments
```

#### Database Schema:

**Assignments Collection:**
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  subject: String,
  dueDate: Date,
  assignedBy: ObjectId,      // Admin/Teacher
  assignedTo: [ObjectId],    // Alpha IDs
  class: String,
  priority: "low" | "medium" | "high",
  status: "draft" | "published" | "completed" | "overdue",
  attachments: [{
    filename: String,
    url: String,
    fileType: String,
    uploadDate: Date
  }],
  submissions: [{
    student: ObjectId,
    submittedAt: Date,
    files: [String],
    grade: Number,
    feedback: String,
    status: "submitted" | "graded" | "late"
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### 2.5 Admin Service

**Responsibility**: Comprehensive platform administration and oversight.

#### APIs:

**User Management:**
```
GET    /api/admin/users         # List all users
GET    /api/admin/buyers        # List buyers
GET    /api/admin/sellers       # List sellers
PUT    /api/admin/users/:id     # Update user status
```

**Analytics & Statistics:**
```
GET    /api/admin/stats         # Platform statistics
GET    /api/admin/analytics/orders  # Order analytics
```

**Reports Management:**
```
GET    /api/admin/reports       # List reports
PUT    /api/admin/reports/:id   # Update report status
POST   /api/admin/reports       # Bulk actions
```

**Payment Verification:**
```
GET    /api/admin/payment-screenshots    # Review payments
PUT    /api/admin/payment-screenshots/:id # Verify/reject payments
```

**Seller Transactions:**
```
GET    /api/admin/seller-transactions    # View all transactions
PUT    /api/admin/seller-transactions/:id # Update transaction status
```

#### Authentication Rules:
- All admin endpoints require `role: "admin"` in JWT
- Admin token verification: `verifyAdminToken(request)`
- Session timeout: 7 days
- Admin-specific cookie: `admin-auth-token`

### 2.6 Delivery/Pickup Service

**Responsibility**: Coordinate delivery schedules and pickup arrangements.

#### APIs:

**Admin Schedule Management:**
```
GET    /api/admin/schedule      # View schedules
POST   /api/admin/schedule      # Create schedule
PUT    /api/admin/schedule      # Update schedule
DELETE /api/admin/schedule      # Delete schedule
```

**Seller Delivery Booking:**
```
GET    /api/admin/deliveries    # View delivery bookings
POST   /api/admin/deliveries    # Book delivery slot
PUT    /api/admin/deliveries    # Update delivery status
```

**Buyer Pickup Booking:**
```
GET    /api/admin/pickups       # View pickup bookings
POST   /api/admin/pickups       # Book pickup slot
PUT    /api/admin/pickups       # Update pickup status
```

#### Database Schema:

**Admin_Schedules Collection:**
```javascript
{
  _id: ObjectId,
  adminId: ObjectId,
  date: Date,
  startTime: String,         // "8:00 AM"
  endTime: String,           // "1:00 PM"
  type: "delivery" | "pickup",
  location: String,
  maxSlots: Number,
  currentSlots: Number,
  status: "active" | "inactive" | "cancelled",
  createdAt: Date,
  updatedAt: Date
}
```

**Deliveries Collection:**
```javascript
{
  _id: ObjectId,
  productId: ObjectId,
  sellerId: ObjectId,
  adminScheduleId: ObjectId,
  preferredTime: String,
  notes: String,
  status: "pending" | "confirmed" | "completed" | "cancelled",
  createdAt: Date,
  updatedAt: Date
}
```

**Pickups Collection:**
```javascript
{
  _id: ObjectId,
  productId: ObjectId,
  buyerId: ObjectId,
  sellerId: ObjectId,
  adminScheduleId: ObjectId,
  deliveryId: ObjectId,
  preferredTime: String,
  notes: String,
  status: "pending" | "confirmed" | "completed" | "cancelled",
  createdAt: Date,
  updatedAt: Date
}
```

---

## 3. Event Flow & Messaging

### 3.1 Inter-Service Events

The system currently operates as a monolith, but events are handled through direct database operations and API calls. Future microservices architecture would implement the following event patterns:

#### Planned Event Types:

**User Events:**
- `user.registered` - New user registration
- `user.login` - User login activity
- `user.profile.updated` - Profile changes

**Marketplace Events:**
- `listing.created` - New product listing
- `listing.updated` - Listing modifications
- `order.placed` - New order creation
- `order.confirmed` - Order confirmation
- `payment.uploaded` - Payment screenshot submitted
- `payment.verified` - Payment verification completed

**Communication Events:**
- `message.sent` - New message in conversation
- `conversation.created` - New conversation started

**Assignment Events:**
- `assignment.created` - New assignment posted
- `assignment.assigned` - Assignment assigned to alpha
- `assignment.completed` - Assignment completion
- `assignment.graded` - Assignment graded

### 3.2 Event Payload Structure

**User Registration Event:**
```json
{
  "eventType": "user.registered",
  "timestamp": "2024-01-15T10:30:00Z",
  "userId": "64f...",
  "userType": "buyer",
  "data": {
    "email": "student@college.edu",
    "name": "John Doe",
    "college": "University Name"
  }
}
```

**Order Placed Event:**
```json
{
  "eventType": "order.placed",
  "timestamp": "2024-01-15T14:15:00Z",
  "orderId": "64f...",
  "data": {
    "buyerId": "64f...",
    "sellerId": "64f...",
    "productId": "64f...",
    "amount": 45.00,
    "quantity": 1
  }
}
```

### 3.3 Producer → Consumer Flow

**Current Implementation (Monolith):**
1. API endpoint receives request
2. Database operation performed
3. Response sent to client
4. Client updates UI state

**Future Microservices Flow:**
1. **Producer Service** publishes event to message queue
2. **Message Broker** (Redis/RabbitMQ) routes event
3. **Consumer Services** process events asynchronously
4. **Notification Service** sends alerts to users
5. **Analytics Service** updates metrics

### 3.4 Retry/Dead-Letter Strategies

**Planned Implementation:**
- **Retry Policy**: Exponential backoff (1s, 2s, 4s, 8s, 16s)
- **Max Retries**: 5 attempts
- **Dead Letter Queue**: For failed events after max retries
- **Circuit Breaker**: Prevent cascade failures
- **Event Replay**: Capability to replay failed events

---

## 4. Data Flow

### 4.1 User Request Flow

**Complete Request Flow:**
```
User Request → Next.js Middleware → API Route → Authentication → Database → Response → Client
```

**Detailed Flow Breakdown:**

1. **Client Request**: User action triggers HTTP request
2. **Middleware Processing**: 
   - Token extraction and validation
   - Route protection based on user role
   - Redirect to login if unauthorized
3. **API Route Handler**:
   - Request parsing and validation
   - Authentication verification
   - Business logic processing
4. **Database Operations**:
   - MongoDB query execution
   - Data validation and constraints
   - Transaction handling (where applicable)
5. **Response Generation**:
   - Data serialization
   - Error handling
   - Status code assignment
6. **Client Processing**:
   - Response parsing
   - UI state updates
   - Error display or success feedback

### 4.2 Authentication Flow

**Login Process:**
```
1. User submits credentials → 
2. API validates against database → 
3. JWT token generated → 
4. Token stored in HTTP-only cookie → 
5. User redirected to dashboard
```

**Protected Route Access:**
```
1. Request with cookie → 
2. Middleware extracts token → 
3. Token validation → 
4. User data attached to request → 
5. API processes with user context
```

### 4.3 Marketplace Transaction Flow

**Product Purchase Flow:**
```
1. Buyer browses listings → 
2. Buyer initiates order → 
3. Order created in database → 
4. Seller notified → 
5. Payment screenshot uploaded → 
6. Admin verifies payment → 
7. Delivery scheduled → 
8. Pickup arranged → 
9. Order completed
```

### 4.4 Background Jobs & Async Workflows

**Current Implementation:**
- File upload processing (ImageKit integration)
- Email notifications (Nodemailer)
- Database cleanup operations

**Planned Async Workflows:**
```javascript
// Cron Jobs (using node-cron)
schedule.scheduleJob('0 0 * * *', () => {
  // Daily cleanup of expired listings
  cleanupExpiredListings();
});

schedule.scheduleJob('0 */6 * * *', () => {
  // Every 6 hours: sync payment statuses
  syncPaymentStatuses();
});
```

### 4.5 Assignment Workflow

**Assignment Creation to Completion:**
```
1. Admin creates assignment → 
2. Assignment assigned to alpha → 
3. Alpha receives notification → 
4. Student submits work → 
5. Alpha reviews and grades → 
6. Payment processed to alpha → 
7. Assignment marked complete
```

---

## 5. Authentication & Security

### 5.1 Token Strategy

**JWT Implementation:**
- **Algorithm**: HS256
- **Secret**: Environment variable `JWT_SECRET`
- **Expiration**: 
  - Users: 30 days
  - Admins: 7 days
- **Storage**: HTTP-only cookies with enhanced mobile support

**Token Payload Structure:**
```json
{
  "userId": "64f...",
  "email": "user@example.com",
  "role": "buyer" | "seller" | "admin" | "alpha",
  "name": "User Name",
  "iat": 1641234567,
  "exp": 1641234567
}
```

**Enhanced Mobile Support:**
- iOS Safari cookie compatibility
- Alternative cookie parsing methods
- Base64 and Base64URL token format support
- Mobile device detection and optimization

### 5.2 Roles & Permissions

**Role Hierarchy:**
```
Admin (Full Access)
├── Alpha (Assignment Management)
├── Seller (Product Management + Basic Features)
└── Buyer (Basic Features)
```

**Permission Matrix:**

| Feature | Buyer | Seller | Alpha | Admin |
|---------|-------|--------|-------|--------|
| Browse Listings | ✅ | ✅ | ✅ | ✅ |
| Create Listings | ❌ | ✅ | ❌ | ✅ |
| Place Orders | ✅ | ❌ | ❌ | ✅ |
| Messaging | ✅ | ✅ | ✅ | ✅ |
| Assignment Submission | ✅ | ❌ | ❌ | ✅ |
| Assignment Grading | ❌ | ❌ | ✅ | ✅ |
| User Management | ❌ | ❌ | ❌ | ✅ |
| Payment Verification | ❌ | ❌ | ❌ | ✅ |
| Analytics Dashboard | ❌ | Limited | Limited | ✅ |

### 5.3 Route Protection

**Middleware Protection:**
```javascript
// middleware.js
export const config = {
  matcher: [
    '/buyer-dashboard/:path*',
    '/seller-dashboard/:path*', 
    '/admin-dashboard/:path*',
    '/alpha-dashboard/:path*'
  ]
};
```

**API Route Protection:**
```javascript
// Example protected endpoint
export async function GET(request) {
  const user = verifyToken(request);
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  if (user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // Protected logic here
}
```

### 5.4 Input Validation & Security

**Security Measures:**
- **Password Hashing**: bcryptjs with salt rounds
- **SQL Injection Prevention**: MongoDB native driver
- **XSS Protection**: Input sanitization
- **CSRF Protection**: HTTP-only cookies + SameSite
- **Rate Limiting**: Planned implementation
- **File Upload Security**: ImageKit integration with validation

**Input Validation Examples:**
```javascript
// Email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password requirements
const passwordMinLength = 6;

// Phone number validation
const phoneRegex = /^[0-9]{10}$/;
```

### 5.5 Session Management

**Session Security:**
- JWT expiration handling
- Token refresh mechanism
- Session invalidation on logout
- Multiple device session tracking (planned)

**Cookie Configuration:**
```javascript
const cookieOptions = [
  `auth-token=${token}`,
  'Path=/',
  'HttpOnly',
  isProd ? 'Secure' : '',
  'SameSite=Lax',
  `Max-Age=${7 * 24 * 60 * 60}`,
  'Priority=High'
].filter(Boolean).join('; ');
```

---

## 6. Scalability & Reliability

### 6.1 Horizontal Scaling Approach

**Current Architecture**: Monolith deployment
- Single Node.js application instance
- MongoDB database (single instance)
- Shared resources and state

**Planned Horizontal Scaling:**

1. **Application Layer Scaling:**
   ```
   Load Balancer (nginx/AWS ALB)
   ├── App Instance 1 (Primary)
   ├── App Instance 2 (Secondary)
   └── App Instance N (Auto-scaling)
   ```

2. **Database Scaling Strategy:**
   - **Read Replicas**: For read-heavy operations
   - **Sharding**: By user type or geographical region
   - **Connection Pooling**: Optimize database connections

3. **Microservices Migration Path:**
   ```
   API Gateway
   ├── User Service
   ├── Marketplace Service
   ├── Messaging Service
   ├── Assignment Service
   └── Admin Service
   ```

### 6.2 Database Sharding/Replication

**Sharding Strategy:**
- **Shard Key**: `userId` for user-centric collections
- **Shard Distribution**: By college/university
- **Cross-shard Queries**: Minimize through careful schema design

**Replication Setup:**
```javascript
// MongoDB Replica Set Configuration
{
  "_id": "campusmart-rs",
  "members": [
    {"_id": 0, "host": "primary:27017", "priority": 2},
    {"_id": 1, "host": "secondary1:27017", "priority": 1},
    {"_id": 2, "host": "secondary2:27017", "priority": 1},
    {"_id": 3, "host": "arbiter:27017", "arbiterOnly": true}
  ]
}
```

**Collection Distribution:**
- **Users Collections**: Shard by `userId` hash
- **Marketplace Collections**: Shard by `sellerId` or `college`
- **Messages**: Shard by `conversationId`
- **Assignments**: Shard by `assignedTo` (alpha ID)

### 6.3 Caching Strategy

**Multi-Level Caching:**

1. **Application-Level Cache (Redis):**
   ```javascript
   // User session cache
   await redis.setex(`user:${userId}`, 3600, JSON.stringify(userData));
   
   // Popular listings cache
   await redis.setex('listings:popular', 300, JSON.stringify(popularListings));
   
   // Search results cache
   await redis.setex(`search:${queryHash}`, 600, JSON.stringify(results));
   ```

2. **Database Query Cache:**
   - MongoDB query result caching
   - Aggregation pipeline caching
   - Index optimization

3. **CDN & Static Asset Caching:**
   - **ImageKit CDN**: Automatic image optimization and caching
   - **Static Assets**: CSS, JS, fonts cached at edge locations
   - **API Response Caching**: For frequently requested data

**Cache Invalidation Strategy:**
```javascript
// Event-driven cache invalidation
const invalidateCache = async (eventType, data) => {
  switch(eventType) {
    case 'listing.updated':
      await redis.del(`listing:${data.listingId}`);
      await redis.del('listings:popular');
      break;
    case 'user.updated':
      await redis.del(`user:${data.userId}`);
      break;
  }
};
```

### 6.4 Monitoring/Logging/Alerting Stack

**Logging Strategy:**
```javascript
// Structured logging implementation
const logger = {
  info: (message, metadata) => {
    console.log(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      message,
      ...metadata
    }));
  },
  error: (error, context) => {
    console.error(JSON.stringify({
      level: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      context
    }));
  }
};
```

**Monitoring Metrics:**
- **Application Metrics**: Response times, error rates, throughput
- **Database Metrics**: Query performance, connection pool usage
- **User Metrics**: Active users, conversion rates, feature usage
- **Business Metrics**: Transactions, revenue, user engagement

**Alerting Rules:**
```yaml
# Example Prometheus alerting rules
groups:
  - name: campusmart.rules
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        annotations:
          summary: "High error rate detected"
      
      - alert: DatabaseConnectionIssue
        expr: mongodb_connections_current > 100
        for: 2m
        annotations:
          summary: "High database connection count"
```

### 6.5 Reliability & Fault Tolerance

**Circuit Breaker Pattern:**
```javascript
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.threshold = threshold;
    this.timeout = timeout;
    this.failureCount = 0;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }
  
  async execute(operation) {
    if (this.state === 'OPEN') {
      throw new Error('Circuit breaker is OPEN');
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}
```

**Health Check Endpoints:**
```javascript
// /api/health endpoint
export async function GET() {
  const checks = {
    database: await checkDatabaseConnection(),
    imagekit: await checkImageKitConnection(),
    redis: await checkRedisConnection()
  };
  
  const healthy = Object.values(checks).every(check => check.status === 'ok');
  
  return Response.json({
    status: healthy ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString()
  }, { status: healthy ? 200 : 503 });
}
```

---

## 7. Eventual Extensions

### 7.1 AI Integration

**Planned AI Features:**

1. **Smart Product Recommendations:**
   ```javascript
   // ML-based recommendation engine
   const recommendations = await aiService.getRecommendations({
     userId,
     purchaseHistory,
     browsingBehavior,
     userPreferences
   });
   ```

2. **Automated Assignment Grading:**
   - Natural Language Processing for essay evaluation
   - Code quality analysis for programming assignments
   - Plagiarism detection integration

3. **Intelligent Chatbot:**
   - Customer support automation
   - FAQ handling
   - Order tracking assistance

4. **Price Optimization:**
   - Dynamic pricing suggestions for sellers
   - Market analysis and trends
   - Demand forecasting

### 7.2 Analytics & Business Intelligence

**Enhanced Analytics Platform:**

1. **Real-time Dashboard:**
   ```javascript
   // Analytics data pipeline
   const analyticsEvents = [
     'user.action',
     'product.view',
     'order.placed',
     'message.sent'
   ];
   
   // Stream to analytics service
   analyticsEvents.forEach(event => {
     analytics.track(event, eventData);
   });
   ```

2. **Predictive Analytics:**
   - User churn prediction
   - Demand forecasting
   - Inventory optimization
   - Revenue projection

3. **A/B Testing Framework:**
   - Feature flag management
   - User segmentation
   - Conversion optimization
   - Statistical significance testing

### 7.3 Mobile Application

**Native Mobile Apps:**
- **React Native** cross-platform development
- **Push notifications** for real-time updates
- **Offline capabilities** for basic functionality
- **Camera integration** for easy product photography

**Mobile-Specific Features:**
- Location-based services for campus navigation
- QR code scanning for quick product access
- Biometric authentication
- Mobile wallet integration

### 7.4 Third-Party Integrations

**Payment Gateways:**
- **Stripe** for credit card processing
- **PayPal** for alternative payments
- **Digital Wallets** (Apple Pay, Google Pay)
- **Cryptocurrency** support (planned)

**Social Media Integration:**
- **Facebook/Instagram** product sharing
- **WhatsApp** quick messaging
- **Google OAuth** simplified registration

**Logistics Partners:**
- **Campus delivery services** integration
- **Locker systems** for secure pickup
- **GPS tracking** for delivery status

**Educational Platforms:**
- **Canvas/Blackboard** LMS integration
- **Google Classroom** assignment sync
- **Zoom** virtual tutoring sessions

---

## 8. Appendices

### 8.1 API Reference Table

| Endpoint | Method | Auth Required | Role | Description |
|----------|--------|---------------|------|-------------|
| `/api/buyer/login` | POST | No | - | Buyer authentication |
| `/api/seller/login` | POST | No | - | Seller authentication |
| `/api/admin/login` | POST | No | - | Admin authentication |
| `/api/alpha/login` | POST | No | - | Alpha authentication |
| `/api/user/profile` | GET | Yes | Any | Get user profile |
| `/api/user/profile` | PUT | Yes | Any | Update user profile |
| `/api/listings` | GET | No | - | Browse product listings |
| `/api/listings` | POST | Yes | Seller | Create new listing |
| `/api/listings/:id` | PUT | Yes | Seller | Update listing |
| `/api/listings/:id` | DELETE | Yes | Seller | Delete listing |
| `/api/conversations` | GET | Yes | Any | Get user conversations |
| `/api/messages` | GET | Yes | Any | Get conversation messages |
| `/api/messages` | POST | Yes | Any | Send message |
| `/api/assignments` | GET | Yes | Any | List assignments |
| `/api/assignments` | POST | Yes | Admin | Create assignment |
| `/api/alpha/assignments` | POST | Yes | Alpha | Get alpha assignments |
| `/api/admin/users` | GET | Yes | Admin | List all users |
| `/api/admin/stats` | GET | Yes | Admin | Platform statistics |
| `/api/admin/reports` | GET | Yes | Admin | View reports |
| `/api/admin/payment-screenshots` | GET | Yes | Admin | Review payments |
| `/api/admin/seller-transactions` | GET | Yes | Admin | View transactions |
| `/api/admin/schedule` | GET | Yes | Admin | View schedules |
| `/api/admin/schedule` | POST | Yes | Admin | Create schedule |
| `/api/admin/deliveries` | GET | Yes | Admin | View deliveries |
| `/api/admin/pickups` | GET | Yes | Admin | View pickups |
| `/api/payment-screenshots` | POST | Yes | Buyer | Upload payment proof |
| `/api/upload/images` | POST | Yes | Any | Upload images |

### 8.2 Event Reference Table

| Event Type | Payload Schema | Producers | Consumers |
|------------|----------------|-----------|----------|
| `user.registered` | `{userId, userType, email, name}` | Auth Service | Analytics, Email |
| `listing.created` | `{listingId, sellerId, category, price}` | Marketplace | Analytics, Search |
| `order.placed` | `{orderId, buyerId, sellerId, amount}` | Orders | Analytics, Notifications |
| `message.sent` | `{messageId, conversationId, senderId}` | Messaging | Notifications, Analytics |
| `assignment.created` | `{assignmentId, adminId, alphaIds}` | Assignments | Notifications, Analytics |
| `payment.verified` | `{paymentId, orderId, amount}` | Admin | Orders, Transactions |

### 8.3 Database Collections Summary

| Collection | Primary Keys | Indexes | Relationships |
|------------|--------------|---------|---------------|
| `buyers` | `_id`, `email` | email, college, createdAt | → orders, messages |
| `sellers` | `_id`, `email` | email, college, isActive | → listings, orders |
| `admins` | `_id`, `email` | email, role | → assignments, schedules |
| `alphas` | `_id`, `email` | email, name | → assignments |
| `listings` | `_id` | sellerId, category, status | → orders, messages |
| `orders` | `_id` | buyerId, sellerId, status | → payments |
| `conversations` | `_id` | buyer_id, seller_id | → messages |
| `messages` | `_id` | conversation_id, created_at | ← conversations |
| `assignments` | `_id` | assignedBy, assignedTo, status | ← admins, alphas |
| `admin_schedules` | `_id` | adminId, date, type | → deliveries, pickups |
| `deliveries` | `_id` | sellerId, adminScheduleId | ← listings, schedules |
| `pickups` | `_id` | buyerId, adminScheduleId | ← orders, schedules |
| `payment_screenshots` | `_id` | buyerId, sellerId, status | → orders |

### 8.4 Glossary of Key Terms

**Alpha**: Academic support staff who help with assignments and grading.

**Assignment**: Academic task that can be requested by students and completed by alphas.

**Circuit Breaker**: Design pattern that prevents cascading failures in distributed systems.

**Conversation**: Chat thread between a buyer and seller about a specific product.

**Delivery**: Scheduled time slot for sellers to drop off sold items to admin.

**ImageKit**: Third-party service for image storage, optimization, and CDN delivery.

**JWT (JSON Web Token)**: Stateless authentication token used for user sessions.

**Listing**: Product advertisement created by sellers on the marketplace.

**Middleware**: Next.js function that runs before API routes for authentication and authorization.

**ObjectId**: MongoDB's unique identifier format for documents.

**Pickup**: Scheduled time slot for buyers to collect purchased items from admin.

**Sharding**: Database partitioning technique to distribute data across multiple servers.

**Webhook**: HTTP callback triggered by external services to notify the application of events.

---

## Conclusion

CampusMart represents a comprehensive marketplace solution designed specifically for the college environment. The platform successfully combines traditional e-commerce functionality with academic support features, creating a unique ecosystem for campus communities.

**Current State:**
- Monolithic Next.js application with robust feature set
- JWT-based authentication with mobile optimization
- Comprehensive admin dashboard with full platform oversight
- Real-time messaging and assignment management capabilities

**Technical Strengths:**
- Scalable MongoDB database design
- Role-based access control system
- Mobile-first responsive design
- Comprehensive API structure

**Future Roadmap:**
- Microservices migration for improved scalability
- AI integration for smart recommendations and automation
- Enhanced analytics and business intelligence
- Mobile native applications
- Advanced payment processing integration

This documentation serves as a comprehensive guide for developers, system administrators, and stakeholders involved in the CampusMart platform development and maintenance.

---

*Document Version: 1.0*  
*Last Updated: January 2024*  
*Next Review: March 2024*