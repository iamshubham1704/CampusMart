// app/api/sellers/[sellerId]/listings/[listingId]/route.js
import clientPromise from '@/lib/mongo';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

// Delete a listing
export async function DELETE(req, { params }) {
  try {
    const { sellerId, listingId } = params;
    
    // Verify JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (err) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (decoded.sellerId !== sellerId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }), 
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const listings = db.collection('listings');

    // Delete the listing
    const result = await listings.deleteOne({
      _id: new ObjectId(listingId),
      sellerId: new ObjectId(sellerId)
    });

    if (result.deletedCount === 0) {
      return new Response(
        JSON.stringify({ error: 'Listing not found' }), 
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Update seller's listing count
    const sellers = db.collection('sellers');
    await sellers.updateOne(
      { _id: new ObjectId(sellerId) },
      { $inc: { totalListings: -1 } }
    );

    return new Response(
      JSON.stringify({ success: true, message: 'Listing deleted successfully' }), 
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error deleting listing:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}