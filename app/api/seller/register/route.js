import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
const dbName = 'campusmart'; 

export async function POST(req) {
  try {
    const body = await req.json();


    const { name, email, phone, password } = body;

    if (!name || !email || !phone || !password) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);


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
      isActive: true,
      createdAt: new Date(),
    };

    const result = await sellers.insertOne(sellerData); // ✅ Fixed: removed invalid writeConcern


    return Response.json({ message: 'Seller registered successfully', sellerId: result.insertedId }, { status: 201 });
  } catch (err) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}