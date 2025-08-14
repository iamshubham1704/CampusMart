// app/api/seller/login/route.js
import clientPromise from '@/lib/mongo';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;
    
    console.log('Login attempt for email:', email);

    // Input validation
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
      console.error('Input password is empty');
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
    console.log('Seller found:', seller ? 'Yes' : 'No');
    
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
      console.error('Seller password is null or undefined for email:', email);
      return new Response(
        JSON.stringify({ error: 'Account configuration error. Please contact support.' }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Comparing passwords...');
    console.log('Input password length:', password.length);
    console.log('Stored password exists:', !!seller.password);
    console.log('Stored password starts with $2a or $2b:', seller.password.startsWith('$2a') || seller.password.startsWith('$2b'));
    
    // Compare passwords with proper error handling
    let isValidPassword;
    try {
      isValidPassword = await bcrypt.compare(password, seller.password);
    } catch (bcryptError) {
      console.error('Bcrypt comparison error:', bcryptError);
      console.error('Password hash format:', seller.password?.substring(0, 10) + '...');
      return new Response(
        JSON.stringify({ error: 'Password verification failed' }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Password valid:', isValidPassword);
    
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

    console.log('Login successful for:', seller.email);

    // Generate JWT token
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
      console.warn('Failed to update last login time:', updateError);
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