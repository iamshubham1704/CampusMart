import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
const dbName = 'campusmart'; 

export async function POST(req) {
  let isConnected = false;
  
  try {
    const body = await req.json();
    console.log('Request body parsed:', body);

    const { name, email, phone, password, college, year, course, branch } = body;

    // Validate required fields
    if (!name || !email || !phone || !password || !college || !year || !course || !branch) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Validate password length
    if (password.length < 6) {
      return Response.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');

    // Connect to database
    await client.connect();
    isConnected = true;
    console.log('Database connected successfully');
    
    const db = client.db(dbName);
    const buyersCollection = db.collection('buyers');

    // Check if buyer already exists with email or phone
    const existingBuyer = await buyersCollection.findOne({ 
      $or: [
        { email: email.toLowerCase().trim() }, 
        { phone: phone.trim() }
      ] 
    });
    
    if (existingBuyer) {
      const duplicateField = existingBuyer.email === email.toLowerCase().trim() ? 'email' : 'phone';
      return Response.json({ 
        error: `Buyer already exists with this ${duplicateField}` 
      }, { status: 409 });
    }

    // Create buyer data object
    const buyerData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone.trim(),
      college: college.trim(),
      year: year.trim(),
      course: course.trim(),
      branch: branch.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      role: 'buyer'
    };

    // Insert buyer into database
    const result = await buyersCollection.insertOne(buyerData); 
    console.log('Buyer created with ID:', result.insertedId);

    // Return success response without sensitive data
    return Response.json({ 
      message: 'Buyer registered successfully', 
      buyerId: result.insertedId,
      buyer: {
        name: buyerData.name,
        email: buyerData.email,
        phone: buyerData.phone,
        college: buyerData.college,
        year: buyerData.year,
        course: buyerData.course,
        branch: buyerData.branch,
        createdAt: buyerData.createdAt
      }
    }, { status: 201 });

  } catch (err) {
    console.error('=== REGISTRATION ERROR ===');
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    
    // Handle specific MongoDB errors
    if (err.code === 11000) {
      const duplicateField = Object.keys(err.keyPattern)[0];
      return Response.json({ 
        error: `Buyer already exists with this ${duplicateField}` 
      }, { status: 409 });
    }
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      return Response.json({ 
        error: 'Invalid data provided' 
      }, { status: 400 });
    }
    
    // Handle bcrypt errors
    if (err.name === 'Error' && err.message.includes('bcrypt')) {
      return Response.json({ 
        error: 'Password processing failed' 
      }, { status: 500 });
    }
    
    return Response.json({ 
      error: 'Internal server error. Please try again later.' 
    }, { status: 500 });
  } finally {
    // Always close the database connection
    if (isConnected) {
      try {
        await client.close();
        console.log('Database connection closed');
      } catch (closeErr) {
        console.error('Error closing database connection:', closeErr);
      }
    }
  }
}