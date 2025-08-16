// app/api/seller/login/route.js
import clientPromise from '@/lib/mongo';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify the input password is not empty
    if (!password || password.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Password cannot be empty' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const client = await clientPromise;
    const db = client.db('campusmart');
    const sellers = db.collection('sellers');

    // Find seller by email
    const seller = await sellers.findOne({ email: email.toLowerCase() });

    if (!seller) {
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify the password exists in the seller object
    if (!seller.password) {

      return new Response(
        JSON.stringify({ error: 'Account configuration error. Please contact support.' }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    let isValidPassword;
    try {
      isValidPassword = await bcrypt.compare(password, seller.password);
    } catch (bcryptError) {
      return new Response(
        JSON.stringify({ error: 'Password verification failed' }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    if (!isValidPassword) {
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if seller account is active (if you have this field)
    if (seller.isActive !== undefined && !seller.isActive) {
      return new Response(
        JSON.stringify({ error: 'Account is deactivated. Please contact support.' }), 
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const token = jwt.sign(
      { 
        sellerId: seller._id.toString(),
        email: seller.email,
        name: seller.name
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Update last login time (optional)
    try {
      await sellers.updateOne(
        { _id: seller._id }, 
        { $set: { lastLogin: new Date() } }
      );
    } catch (updateError) {
      // Don't fail the login for this
    }


    //IsActive Seller
    try {
      await sellers.updateOne(
        { _id: seller._id }, 
        { $set: { isActive: true } }
      );
    } catch (updateError) {
      // Don't fail the login for this
    }

    // Create response headers with cookie
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Set-Cookie': `auth-token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}` // 7 days
    });

    // Return success response with token and cookie
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Login successful',
        token,
        seller: {
          id: seller._id.toString(),
          name: seller.name,
          email: seller.email,
          phone: seller.phone || null,
          profileImage: seller.profileImage || null
        }
      }), 
      { 
        status: 200,
        headers
      }
    );

  } catch (error) {
    
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}