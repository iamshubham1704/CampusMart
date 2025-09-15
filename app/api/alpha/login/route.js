// app/api/alpha/login/route.js
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
    const alphas = db.collection('alphas');

    // Find alpha by email
    const alpha = await alphas.findOne({ email: email.toLowerCase() });

    if (!alpha) {
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify password
    if (!alpha.password) {
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
      isValidPassword = await bcrypt.compare(password, alpha.password);
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

    // Check if alpha account is active
    if (alpha.isActive !== undefined && !alpha.isActive) {
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
        alphaId: alpha._id.toString(),
        email: alpha.email,
        name: alpha.name,
        role: 'alpha'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Update last login time
    try {
      await alphas.updateOne(
        { _id: alpha._id }, 
        { $set: { lastLogin: new Date() } }
      );
    } catch (updateError) {
      console.error('Error updating last login:', updateError);
    }

    // Cookie setup
    const isProd = process.env.NODE_ENV === 'production';
    
    const cookieOptions = [
      `alpha-auth-token=${token}`,
      'Path=/',
      'HttpOnly',
      isProd ? 'Secure' : '',
      'SameSite=Lax',
      `Max-Age=${7 * 24 * 60 * 60}`,
      process.env.COOKIE_DOMAIN ? `Domain=${process.env.COOKIE_DOMAIN}` : '',
      'Priority=High'
    ].filter(Boolean);
    
    const cookie = cookieOptions.join('; ');

    const headers = new Headers({
      'Content-Type': 'application/json',
      'Set-Cookie': cookie,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Login successful',
        token,
        alpha: {
          id: alpha._id.toString(),
          name: alpha.name,
          email: alpha.email,
          role: alpha.role
        }
      }), 
      { 
        status: 200,
        headers
      }
    );

  } catch (error) {
    console.error('Alpha login error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
