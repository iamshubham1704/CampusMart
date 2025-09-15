# Assignment System - CampusMart

## Overview
The Assignment System allows buyers to create assignment requests and admins to manage them. Buyers can upload PDF files, set budgets, and specify requirements, while admins can track, update status, and manage all assignments.

## Features

### Buyer Dashboard
- **Create Assignment Requests**: Fill out forms with title, description, type, subject, deadline, budget, and additional requirements
- **Upload PDF Files**: Attach assignment PDFs (max 10MB)
- **View Status**: Track assignment progress (pending, confirmed, in progress, completed, cancelled)
- **Assignment Types**: Assignment, Practical File, Project, Other
- **Subjects**: Computer Science, Engineering, Mathematics, Physics, Chemistry, Biology, Economics, Business, Literature, History, Geography, Psychology, Sociology, Political Science

### Admin Dashboard
- **View All Assignments**: See all assignment requests from all buyers
- **Filter & Search**: Filter by status and search by title, subject, or buyer details
- **Update Status**: Change assignment status and add admin notes
- **Set Delivery Dates**: Set tentative delivery dates
- **Delete Assignments**: Remove assignments if needed
- **Buyer Information**: View complete buyer details for each assignment

## Database Schema

### Assignments Collection
```javascript
{
  _id: ObjectId,
  title: String (required),
  description: String,
  type: String (required), // assignment, practical, project, other
  subject: String (required),
  deadline: Date,
  budget: Number (required),
  location: String,
  additionalRequirements: String,
  pdfUrl: String,
  buyerId: ObjectId (required),
  buyerName: String,
  buyerCollege: String,
  status: String (default: 'pending'),
  adminId: ObjectId,
  adminName: String,
  tentativeDeliveryDate: Date,
  confirmedAt: Date,
  adminNotes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Status Flow
1. **pending** - Initial status when assignment is created
2. **confirmed** - Admin has confirmed the assignment
3. **in_progress** - Assignment is being worked on
4. **completed** - Assignment is finished
5. **cancelled** - Assignment has been cancelled

## API Endpoints

### Buyer Endpoints
- `GET /api/assignments?userType=buyer` - Get buyer's assignments
- `POST /api/assignments` - Create new assignment
- `PUT /api/assignments` - Update assignment (PDF URL)
- `POST /api/assignments/upload-pdf` - Upload PDF file

### Admin Endpoints
- `GET /api/admin/assignments` - Get all assignments with pagination
- `PUT /api/admin/assignments` - Update assignment status and details
- `DELETE /api/admin/assignments?id={id}` - Delete assignment

## File Structure

```
app/
├── buyer-dashboard/
│   └── assignments/
│       ├── page.js - Buyer assignments page
│       └── Assignments.module.css - Buyer styles
├── admin-dashboard/
│   └── assignments/
│       ├── page.js - Admin assignments page
│       └── Assignments.module.css - Admin styles
└── api/
    ├── assignments/
    │   ├── route.js - Buyer assignment operations
    │   └── upload-pdf/
    │       └── route.js - PDF upload handling
    └── admin/
        └── assignments/
            └── route.js - Admin assignment operations
```

## How It Works

### 1. Buyer Creates Assignment
1. Buyer navigates to `/buyer-dashboard/assignments`
2. Clicks "Create Request" button
3. Fills out the form with assignment details
4. Optionally uploads a PDF file
5. Submits the form
6. Assignment is created with status "pending"

### 2. Admin Manages Assignment
1. Admin navigates to `/admin-dashboard/assignments`
2. Views all pending assignments
3. Can filter by status or search by keywords
4. Clicks "Manage" button on an assignment
5. Updates status, sets delivery date, adds notes
6. Assignment status changes accordingly

### 3. PDF Upload Process
1. Buyer selects PDF file (max 10MB)
2. File is uploaded to `/public/uploads/assignments/`
3. File URL is stored in the assignment record
4. PDF can be viewed by both buyer and admin

## Security Features

- **Authentication Required**: All endpoints require valid JWT tokens
- **Role-Based Access**: Buyers can only see their own assignments
- **Admin Verification**: Admin endpoints verify admin role
- **File Validation**: Only PDF files allowed, size limited to 10MB
- **Input Validation**: Required fields are validated on both client and server

## Error Handling

- **Network Errors**: Graceful fallbacks and user-friendly error messages
- **Validation Errors**: Clear feedback for form validation issues
- **File Upload Errors**: Specific error messages for file-related issues
- **Authentication Errors**: Redirect to login for unauthorized access

## Responsive Design

- **Mobile-First**: Optimized for mobile devices
- **Grid Layouts**: Responsive grid systems for different screen sizes
- **Touch-Friendly**: Large buttons and touch-optimized interactions
- **Modern UI**: Clean, professional design with smooth animations

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile Browsers**: iOS Safari, Chrome Mobile, Samsung Internet
- **Progressive Enhancement**: Core functionality works without JavaScript

## Performance Optimizations

- **Lazy Loading**: Components load only when needed
- **Efficient Queries**: MongoDB queries optimized with proper indexing
- **Image Optimization**: PDF files stored efficiently
- **Caching**: JWT tokens cached for better performance

## Future Enhancements

- **Real-time Updates**: WebSocket integration for live status updates
- **Email Notifications**: Automated emails for status changes
- **File Compression**: PDF compression for better storage efficiency
- **Advanced Analytics**: Detailed reporting and analytics dashboard
- **Mobile App**: Native mobile applications for iOS and Android

## Troubleshooting

### Common Issues

1. **PDF Upload Fails**
   - Check file size (must be under 10MB)
   - Ensure file is PDF format
   - Check server storage permissions

2. **Authentication Errors**
   - Verify JWT token is valid
   - Check token expiration
   - Ensure correct user role

3. **Assignment Not Loading**
   - Check MongoDB connection
   - Verify collection names
   - Check API endpoint URLs

### Debug Mode

Enable debug logging by setting environment variables:
```bash
DEBUG=true
NODE_ENV=development
```

## Support

For technical support or questions about the Assignment System, please contact the development team or refer to the main CampusMart documentation.

