// // app/api/admin/register/route.js
// import { MongoClient } from 'mongodb';
// import bcrypt from 'bcryptjs';

// const uri = process.env.MONGODB_URI;
// const client = new MongoClient(uri);
// const dbName = 'campusmart';

// export async function POST(req) {
//   let isConnected = false;
  
//   try {
//     const body = await req.json();
//     const { name, email, password } = body;

//     // Validate required fields
//     if (!name || !email || !password) {
//       return Response.json({ error: 'All fields are required' }, { status: 400 });
//     }

//     // Validate email format
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       return Response.json({ error: 'Invalid email format' }, { status: 400 });
//     }

//     // Validate password length
//     if (password.length < 6) {
//       return Response.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
//     }

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 12);

//     await client.connect();
//     isConnected = true;

//     const db = client.db(dbName);
//     const adminsCollection = db.collection('admins');

//     // Check if admin already exists
//     const existingAdmin = await adminsCollection.findOne({ 
//       email: email.toLowerCase().trim() 
//     });
    
//     if (existingAdmin) {
//       return Response.json({ 
//         error: 'Admin already exists with this email' 
//       }, { status: 409 });
//     }

//     // Create admin data object
//     const adminData = {
//       name: name.trim(),
//       email: email.toLowerCase().trim(),
//       password: hashedPassword,
//       role: 'admin',
//       isActive: true,
//       createdAt: new Date(),
//       updatedAt: new Date()
//     };

//     // Insert admin into database
//     const result = await adminsCollection.insertOne(adminData);

//     return Response.json({ 
//       message: 'Admin registered successfully', 
//       adminId: result.insertedId,
//       admin: {
//         name: adminData.name,
//         email: adminData.email,
//         role: adminData.role,
//         createdAt: adminData.createdAt
//       }
//     }, { status: 201 });

//   } catch (err) {
//     console.error('Admin registration error:', err);
    
//     if (err.code === 11000) {
//       return Response.json({ 
//         error: 'Admin already exists with this email' 
//       }, { status: 409 });
//     }
    
//     return Response.json({ 
//       error: 'Internal server error. Please try again later.' 
//     }, { status: 500 });
//   } finally {
//     if (isConnected) {
//       try {
//         await client.close();
//       } catch (closeErr) {
//         console.error('Error closing connection:', closeErr);
//       }
//     }
//   }
// }
