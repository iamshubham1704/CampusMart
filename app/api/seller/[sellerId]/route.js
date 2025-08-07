import { connectToDatabase } from '../../../lib/mongodb'; // Adjust path to your DB connection
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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

    const { sellerId } = req.query;
    
    // Verify the seller ID matches the token
    const tokenSellerId = decoded.sellerId || decoded.userId || decoded.id || decoded.sub;
    if (sellerId !== tokenSellerId) {
      return res.status(403).json({ error: 'Access denied: Seller ID mismatch' });
    }

    // Connect to database
    const { db } = await connectToDatabase();
    
    if (req.method === 'GET') {
      // GET: Fetch seller data
      let seller;
      
      try {
        // Try to find by ObjectId first
        seller = await db.collection('sellers').findOne({ 
          _id: new ObjectId(sellerId) 
        });
      } catch (objectIdError) {
        // If ObjectId fails, try as string
        seller = await db.collection('sellers').findOne({ 
          _id: sellerId 
        });
      }

      // If still not found, try by email or other fields from token
      if (!seller && decoded.email) {
        seller = await db.collection('sellers').findOne({ 
          email: decoded.email 
        });
      }

      if (!seller) {
        // Check if this is a user in the users collection instead
        let user;
        try {
          user = await db.collection('users').findOne({ 
            _id: new ObjectId(sellerId) 
          });
        } catch {
          user = await db.collection('users').findOne({ 
            _id: sellerId 
          });
        }

        if (!user && decoded.email) {
          user = await db.collection('users').findOne({ 
            email: decoded.email 
          });
        }

        if (user) {
          // Convert user to seller format
          seller = {
            _id: user._id,
            name: user.name || user.username || 'Unknown',
            email: user.email,
            joinDate: user.createdAt || user.joinDate || new Date().toISOString(),
            rating: user.rating || 0,
            totalSales: user.totalSales || 0,
            responseRate: user.responseRate || 100,
            totalListings: user.totalListings || 0,
            completionRate: user.completionRate || 100,
            averagePrice: user.averagePrice || '0.00',
            totalEarnings: user.totalEarnings || 0,
            categories: user.categories || [],
            phone: user.phone || '',
            location: user.location || 'Campus',
            bio: user.bio || '',
            profileImage: user.profileImage || user.avatar || ''
          };

          // Optionally, save this as a seller record
          await db.collection('sellers').insertOne({
            ...seller,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        } else {
          return res.status(404).json({ 
            error: 'Seller profile not found. Please check if your account exists in the database.',
            debug: {
              searchedSellerId: sellerId,
              searchedEmail: decoded.email,
              tokenData: { ...decoded, iat: undefined, exp: undefined }
            }
          });
        }
      }

      res.status(200).json(seller);

    } else if (req.method === 'PUT') {
      // PUT: Update seller data
      const updateData = req.body;
      
      const result = await db.collection('sellers').updateOne(
        { _id: new ObjectId(sellerId) },
        { 
          $set: {
            ...updateData,
            updatedAt: new Date()
          }
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Seller not found' });
      }

      // Return updated seller data
      const updatedSeller = await db.collection('sellers').findOne({ 
        _id: new ObjectId(sellerId) 
      });
      
      res.status(200).json(updatedSeller);
    }

  } catch (error) {
    console.error('Error in seller API:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}