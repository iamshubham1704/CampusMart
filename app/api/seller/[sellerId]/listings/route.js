import { connectToDatabase } from '../../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  const { sellerId } = req.query;

  // Verify JWT token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];
  let decoded;
  
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const { db } = await connectToDatabase();

  if (req.method === 'GET') {
    try {
      // Fetch listings from database
      const listings = await db.collection('listings').find({ 
        sellerId: sellerId  // or new ObjectId(sellerId) if stored as ObjectId
      }).sort({ createdAt: -1 }).toArray();

      res.status(200).json(listings);
    } catch (error) {
      console.error('Error fetching listings:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } 
  
  else if (req.method === 'POST') {
    try {
      // Handle file upload and create listing
      const listingData = req.body;
      
      const newListing = {
        ...listingData,
        sellerId: sellerId,
        sellerName: decoded.name || 'Unknown Seller',
        sellerEmail: decoded.email,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active',
        views: 0,
        likes: 0,
        messages: 0,
        _id: new ObjectId()
      };

      const result = await db.collection('listings').insertOne(newListing);
      
      // Update seller's listing count
      await db.collection('sellers').updateOne(
        { _id: new ObjectId(sellerId) },
        { $inc: { totalListings: 1 } }
      );

      res.status(201).json(newListing);
    } catch (error) {
      console.error('Error creating listing:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } 
  
  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}