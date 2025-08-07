import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
const dbName = 'campusmart'; // replace with your actual DB name

export async function POST(req) {
  try {
    const body = await req.json();
    console.log('Request body parsed:', body);

    const { name, email, phone, password } = body;

    if (!name || !email || !phone || !password) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');

    await client.connect();
    const db = client.db(dbName);
    const sellers = db.collection('sellers');

    const existingSeller = await sellers.findOne({ email });
    if (existingSeller) {
      return Response.json({ error: 'Seller already exists' }, { status: 409 });
    }

    const sellerData = {
      name,
      email,
      phone,
      password: hashedPassword,
      createdAt: new Date(),
    };

    const result = await sellers.insertOne(sellerData); // ✅ Fixed: removed invalid writeConcern
    console.log('Seller created with ID:', result.insertedId);

    return Response.json({ message: 'Seller registered successfully', sellerId: result.insertedId }, { status: 201 });
  } catch (err) {
    console.error('=== REGISTRATION ERROR ===');
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}