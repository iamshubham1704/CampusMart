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
    const buyers = db.collection('buyers');

    // Find buyer by email (normalize to lowercase)
    const buyer = await buyers.findOne({ email: email.toLowerCase() });

    if (!buyer) {
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify the password exists in the buyer object
    if (!buyer.password) {
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
      isValidPassword = await bcrypt.compare(password, buyer.password);
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

    // Check if buyer account is active (if you have this field)
    if (buyer.isActive !== undefined && !buyer.isActive) {
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
        buyerId: buyer._id.toString(),
        email: buyer.email,
        name: buyer.name,
        role: 'buyer'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Update last login time (optional)
    try {
      await buyers.updateOne(
        { _id: buyer._id }, 
        { $set: { lastLogin: new Date() } }
      );
    } catch (updateError) {
    }

    // Create response headers with cookie (dev-safe: no Secure in development)
    const isProd = process.env.NODE_ENV === 'production';
    const cookie = [
      `auth-token=${token}`,
      'Path=/',
      'HttpOnly',
      isProd ? 'Secure' : '',
      'SameSite=Lax',
      `Max-Age=${7 * 24 * 60 * 60}`
    ].filter(Boolean).join('; ');

    const headers = new Headers({
      'Content-Type': 'application/json',
      'Set-Cookie': cookie
    });

    // Return success response with token and cookie
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Login successful',
        token,
        buyer: {
          id: buyer._id.toString(),
          name: buyer.name,
          email: buyer.email,
          phone: buyer.phone || null,
          college: buyer.college || null,
          profileImage: buyer.profileImage || null
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