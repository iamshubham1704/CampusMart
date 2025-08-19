// app/api/admin/login/route.js
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
    const admins = db.collection('admins');

    // Find admin by email
    const admin = await admins.findOne({ email: email.toLowerCase() });

    if (!admin) {
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify password
    if (!admin.password) {
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
      isValidPassword = await bcrypt.compare(password, admin.password);
    } catch (bcryptError) {
      console.error('Bcrypt error:', bcryptError);
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

    // Check if admin account is active
    if (admin.isActive !== undefined && !admin.isActive) {
      return new Response(
        JSON.stringify({ error: 'Account is deactivated. Please contact support.' }), 
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        adminId: admin._id.toString(),
        email: admin.email,
        name: admin.name,
        role: 'admin'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Update last login time
    try {
      await admins.updateOne(
        { _id: admin._id }, 
        { $set: { lastLogin: new Date() } }
      );
    } catch (updateError) {
      console.error('Error updating last login:', updateError);
    }

    // Create response headers with cookie (dev-safe: no Secure in development)
    const isProd = process.env.NODE_ENV === 'production';
    const cookie = [
      `admin-auth-token=${token}`,
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

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Login successful',
        token,
        admin: {
          id: admin._id.toString(),
          name: admin.name,
          email: admin.email,
          role: admin.role
        }
      }), 
      { 
        status: 200,
        headers
      }
    );

  } catch (error) {
    console.error('Admin login error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}