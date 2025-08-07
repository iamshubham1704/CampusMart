import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
const dbName = 'campusmart'; 

export async function POST(req) {
  try {
    const body = await req.json();
    console.log('Request body parsed:', body);

    const { name, email, phone, password, shippingAddress } = body;

    if (!name || !email || !phone || !password || !shippingAddress) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');

    await client.connect();
    const db = client.db(dbName);
    const buyers = db.collection('Buyers'); // Changed variable name for clarity

    const existingBuyer = await buyers.findOne({ 
      $or: [{ email }, { phone }] // Check email OR phone separately
    });
    
    if (existingBuyer) {
      return Response.json({ error: 'Buyer already exists with this email or phone' }, { status: 409 });
    }

    const buyerData = {
      name,
      email,
      password: hashedPassword,
      phone,
      shippingAddress,
      createdAt: new Date(),
    };

    const result = await buyers.insertOne(buyerData); 
    console.log('Buyer created with ID:', result.insertedId);

    return Response.json({ 
      message: 'Buyer registered successfully', 
      buyerId: result.insertedId 
    }, { status: 201 });

  } catch (err) {
    console.error('=== REGISTRATION ERROR ===');
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    // Always close the database connection
    try {
      await client.close();
    } catch (closeErr) {
      console.error('Error closing database connection:', closeErr);
    }
  }
}