// app/api/seller/login/route.js
import clientPromise from '@/lib/mongo';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;
    
    console.log('Login attempt for email:', email); // Debug log

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const client = await clientPromise;
    const db = client.db('campusmart'); // Replace with your actual database name
    const sellers = db.collection('sellers');

    // Find seller by email
    const seller = await sellers.findOne({ email });
    console.log('Seller found:', seller ? 'Yes' : 'No'); // Debug log
    
    if (!seller) {
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, seller.password);
    console.log('Password valid:', isValidPassword); // Debug log
    
    if (!isValidPassword) {
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        sellerId: seller._id.toString(), // Changed from seller.id
        email: seller.email,
        name: seller.name
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Return success response with token
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Login successful',
        token,
        seller: {
          id: seller._id.toString(), // Changed from seller.id
          name: seller.name,
          email: seller.email,
          phone: seller.phone
        }
      }), 
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('=== LOGIN ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}