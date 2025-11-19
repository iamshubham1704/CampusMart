// app/api/admin/payment-screenshots/route.js - CREATE NEW FILE
import { verifyToken, verifyAdminToken } from '@/lib/auth';
import clientPromise from '@/lib/mongo';
import { ObjectId } from 'mongodb';
import { createIdCandidates } from '@/lib/objectIdHelper';

export async function GET(request) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return Response.json({ 
        error: 'Unauthorized. Admin access required.' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const buyerId = searchParams.get('buyerId');
    const sellerId = searchParams.get('sellerId');

    const client = await clientPromise;
    const db = client.db('campusmart');
    const collection = db.collection('payment_screenshots');

    // Build filter (support both string/ObjectId stored IDs)
    let filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (buyerId) {
      filter.buyerId = { $in: createIdCandidates(buyerId) };
    }
    if (sellerId) {
      filter.sellerId = { $in: createIdCandidates(sellerId) };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get payment screenshots with pagination (exclude large imageData field for list view)
    const screenshots = await collection
      .find(filter, { 
        projection: { 
          imageData: 0 // Exclude imageData from list view for performance
        }
      })
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count for pagination
    const totalCount = await collection.countDocuments(filter);

    // Get additional data for each screenshot
    const screenshotsWithDetails = await Promise.all(
      screenshots.map(async (screenshot) => {
        try {
          // Get buyer details (support string/ObjectId)
          const buyersCollection = db.collection('buyers');
          let buyer = null;
          try {
            buyer = await buyersCollection.findOne(
              { _id: { $in: createIdCandidates(screenshot.buyerId) } },
              { projection: { name: 1, email: 1, phone: 1 } }
            );
          } catch (_) {}

          // Get seller details
          const sellersCollection = db.collection('sellers');
          let seller = null;
          try {
            seller = await sellersCollection.findOne(
              { _id: { $in: createIdCandidates(screenshot.sellerId) } },
              { projection: { name: 1, email: 1, phone: 1 } }
            );
          } catch (_) {}

          // Get product details (may be deleted)
          const productsCollection = db.collection('listings');
          let product = null;
          try {
            product = await productsCollection.findOne(
              { _id: { $in: createIdCandidates(screenshot.productId) } },
              { projection: { title: 1, price: 1, images: 1 } }
            );
          } catch (_) {}

          return {
            ...screenshot,
            buyer: buyer || null,
            seller: seller || null,
            product: product || null,
            // Add image URL for viewing
            imageUrl: `/api/payment-screenshots/image/${screenshot._id}`
          };
        } catch (detailError) {
          console.error('Error fetching details for screenshot:', screenshot._id, detailError);
          return {
            ...screenshot,
            buyer: null,
            seller: null,
            product: null,
            imageUrl: `/api/payment-screenshots/image/${screenshot._id}`
          };
        }
      })
    );

    return Response.json({
      success: true,
      data: {
        screenshots: screenshotsWithDetails,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching payment screenshots for admin:', error);
    return Response.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}