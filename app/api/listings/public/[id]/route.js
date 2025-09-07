import { NextResponse } from 'next/server';
import clientPromise from '../../../../../lib/mongo';
import { getThumbnailUrl } from '../../../../../lib/imagekit';
import { ObjectId } from 'mongodb';

// Simple in-memory rate limiting (for production, consider Redis)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30; // 30 requests per minute per IP

// Suspicious activity tracking
const suspiciousActivityMap = new Map();
const SUSPICIOUS_THRESHOLD = 100; // 100 requests per hour
const SUSPICIOUS_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }
  
  const requests = rateLimitMap.get(ip);
  const validRequests = requests.filter(timestamp => timestamp > windowStart);
  
  if (validRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false; // Rate limit exceeded
  }
  
  validRequests.push(now);
  rateLimitMap.set(ip, validRequests);
  return true; // Within rate limit
}

function getClientIP(request) {
  // Get IP from various headers (considering proxy/load balancer scenarios)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Fallback to connection remote address
  return request.ip || 'unknown';
}

function checkSuspiciousActivity(ip) {
  const now = Date.now();
  const windowStart = now - SUSPICIOUS_WINDOW;
  
  if (!suspiciousActivityMap.has(ip)) {
    suspiciousActivityMap.set(ip, []);
  }
  
  const requests = suspiciousActivityMap.get(ip);
  const validRequests = requests.filter(timestamp => timestamp > windowStart);
  
  if (validRequests.length >= SUSPICIOUS_THRESHOLD) {
    return true; // Suspicious activity detected
  }
  
  validRequests.push(now);
  suspiciousActivityMap.set(ip, validRequests);
  return false; // Normal activity
}

export async function GET(request, context) {
  try {
    // Rate limiting check
    const clientIP = getClientIP(request);
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { success: false, message: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Check for suspicious activity
    if (checkSuspiciousActivity(clientIP)) {
      console.warn(`Suspicious activity detected from IP: ${clientIP}`);
      return NextResponse.json(
        { success: false, message: 'Access temporarily restricted due to unusual activity.' },
        { status: 429 }
      );
    }

    // Validate request method
    if (request.method !== 'GET') {
      return NextResponse.json(
        { success: false, message: 'Method not allowed' },
        { status: 405 }
      );
    }

    // Await params before accessing properties
    const params = await context.params;

    // Validate listing ID format
    if (!params.id || !ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid listing ID' },
        { status: 400 }
      );
    }

    // Additional validation for ID length and format
    if (params.id.length !== 24) {
      return NextResponse.json(
        { success: false, message: 'Invalid listing ID format' },
        { status: 400 }
      );
    }

    // Validate ID contains only valid characters
    if (!/^[a-f0-9]+$/i.test(params.id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid listing ID characters' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('campusmart');

    // Increment view count with rate limiting per IP
    const viewKey = `view_${params.id}_${clientIP}`;
    const viewTimestamp = Date.now();
    
    // Only increment view if this IP hasn't viewed recently (within 1 hour)
    const oneHourAgo = viewTimestamp - (60 * 60 * 1000);
    
    try {
      await db.collection('listing_views').updateOne(
        { 
          listingId: params.id, 
          ip: clientIP,
          timestamp: { $lt: oneHourAgo }
        },
        { 
          $set: { 
            listingId: params.id, 
            ip: clientIP, 
            timestamp: viewTimestamp,
            userAgent: request.headers.get('user-agent') || 'unknown'
          }
        },
        { upsert: true }
      );
      
      // Only increment main view count if this is a new view from this IP
      const viewResult = await db.collection('listing_views').findOne({
        listingId: params.id,
        ip: clientIP,
        timestamp: { $gte: oneHourAgo }
      });
      
      if (!viewResult || viewResult.timestamp < oneHourAgo) {
        await db.collection('listings').updateOne(
          { _id: new ObjectId(params.id) },
          { $inc: { views: 1 } }
        );
      }
    } catch (viewError) {
      console.warn('View tracking error (non-critical):', viewError);
      // Continue with listing fetch even if view tracking fails
    }

    const listing = await db.collection('listings')
      .aggregate([
        {
          $match: {
            _id: new ObjectId(params.id),
            status: { $in: ['active', null] }
          }
        },
        {
          $lookup: {
            from: 'sellers',
            let: { sellerId: '$sellerId' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', { $toObjectId: '$$sellerId' }] }
                }
              },
              {
                $project: {
                  // Only expose safe seller information
                  name: 1,
                  businessName: 1,
                  avatar: 1,
                  rating: 1,
                  verified: 1,
                  totalSales: 1,
                  responseTime: 1,
                  university: 1,
                  college: 1,
                  createdAt: 1,
                  joinedDate: 1
                }
              }
            ],
            as: 'seller'
          }
        }
      ])
      .toArray();

    if (!listing || listing.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Listing not found' },
        { status: 404 }
      );
    }

    const listingData = listing[0];
    const seller = listingData.seller?.[0];

    // Process images to ensure proper format
    let processedImages = [];
    
    if (listingData.images && listingData.images.length > 0) {
      processedImages = listingData.images.map((image, index) => {
        if (typeof image === 'string') {
          // Old format - base64 string
          return {
            url: image,
            thumbnailUrl: image,
            index
          };
        } else if (typeof image === 'object' && image.url) {
          // New format - ImageKit object
          return {
            url: image.url,
            thumbnailUrl: image.thumbnailUrl || getThumbnailUrl(image.url, 500),
            fileId: image.fileId,
            fileName: image.fileName,
            width: image.width,
            height: image.height,
            index
          };
        }
        return null;
      }).filter(img => img !== null);
    }

    // Format seller data (only safe information)
    const sellerInfo = seller ? {
      _id: seller._id.toString(),
      id: seller._id.toString(),
      name: seller.name || seller.businessName || 'Anonymous Seller',
      avatar: seller.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.name || 'User')}&size=100&background=3b82f6&color=ffffff`,
      rating: seller.rating || 4.5,
      verified: seller.verified || false,
      totalSales: seller.totalSales || 0,
      responseTime: seller.responseTime || '2 hours',
      university: seller.university || seller.college || 'Campus',
      joinedDate: seller.createdAt || seller.joinedDate
    } : null;

    // Format the response
    const responseData = {
      success: true,
      listing: {
        id: listingData._id.toString(),
        _id: listingData._id.toString(),
        title: listingData.title,
        description: listingData.description,
        price: listingData.price,
        originalPrice: listingData.originalPrice,
        commission: listingData.commission ?? 10,
        finalPrice: (listingData.price || 0) + ((listingData.price || 0) * ((listingData.commission ?? 10) / 100)),
        condition: listingData.condition,
        category: listingData.category,
        subcategory: listingData.subcategory,
        location: listingData.location,
        college: listingData.college,
        images: processedImages,
        tags: listingData.tags || [],
        status: listingData.status,
        views: listingData.views || 0,
        createdAt: listingData.createdAt,
        updatedAt: listingData.updatedAt,
        seller: sellerInfo,
        sellerId: listingData.sellerId?.toString()
      }
    };

    // Set security headers
    const response = NextResponse.json(responseData);
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Cache-Control', 'public, max-age=300'); // 5 minutes cache for public listings
    
    return response;

  } catch (error) {
    console.error('❌ Error fetching public listing:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch listing' },
      { status: 500 }
    );
  }
}