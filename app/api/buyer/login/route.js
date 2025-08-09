import clientPromise from '@/lib/mongo';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;
    
    console.log('Login attempt for email:', email);

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
    const db = client.db('campusmart');
    const buyers = db.collection('buyers'); // Changed variable name for consistency

    // Find buyer by email
    const buyer = await buyers.findOne({ email }); // Changed variable name
    console.log('Buyer found:', buyer ? 'Yes' : 'No');
    
    if (!buyer) {
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, buyer.password);
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

    // Generate JWT token
    const token = jwt.sign(
      { 
        buyerId: buyer._id.toString(), // Changed from sellerId
        email: buyer.email,
        name: buyer.name
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
        buyer: {
          id: buyer._id.toString(), // Fixed variable reference
          name: buyer.name, // Fixed variable reference
          email: buyer.email, // Fixed variable reference
          phone: buyer.phone, // Fixed variable reference
          college: buyer.college // Added shipping address
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