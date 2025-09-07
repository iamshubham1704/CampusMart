import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongo';
import { ObjectId } from 'mongodb';

// Simple in-memory rate limiting for analytics
const analyticsRateLimit = new Map();
const ANALYTICS_RATE_LIMIT = 10; // 10 requests per minute per IP
const ANALYTICS_WINDOW = 60 * 1000; // 1 minute

function checkAnalyticsRateLimit(ip) {
  const now = Date.now();
  const windowStart = now - ANALYTICS_WINDOW;
  
  if (!analyticsRateLimit.has(ip)) {
    analyticsRateLimit.set(ip, []);
  }
  
  const requests = analyticsRateLimit.get(ip);
  const validRequests = requests.filter(timestamp => timestamp > windowStart);
  
  if (validRequests.length >= ANALYTICS_RATE_LIMIT) {
    return false;
  }
  
  validRequests.push(now);
  analyticsRateLimit.set(ip, validRequests);
  return true;
}

function getClientIP(request) {
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
  
  return request.ip || 'unknown';
}

export async function POST(request) {
  try {
    // Rate limiting check
    const clientIP = getClientIP(request);
    if (!checkAnalyticsRateLimit(clientIP)) {
      return NextResponse.json(
        { success: false, message: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Validate request method
    if (request.method !== 'POST') {
      return NextResponse.json(
        { success: false, message: 'Method not allowed' },
        { status: 405 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.listingId || !ObjectId.isValid(body.listingId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid listing ID' },
        { status: 400 }
      );
    }

    // Validate timestamp
    if (!body.timestamp || typeof body.timestamp !== 'number') {
      return NextResponse.json(
        { success: false, message: 'Invalid timestamp' },
        { status: 400 }
      );
    }

    // Sanitize and validate data
    const analyticsData = {
      listingId: body.listingId,
      timestamp: new Date(body.timestamp),
      ip: clientIP,
      userAgent: body.userAgent?.substring(0, 500) || 'unknown', // Limit length
      referrer: body.referrer?.substring(0, 500) || 'direct', // Limit length
      createdAt: new Date()
    };

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('campusmart');

    // Store analytics data
    await db.collection('shared_listing_analytics').insertOne(analyticsData);

    // Update listing analytics summary
    await db.collection('listings').updateOne(
      { _id: new ObjectId(body.listingId) },
      { 
        $inc: { 
          sharedViews: 1,
          totalViews: 1
        },
        $set: {
          lastViewed: new Date()
        }
      }
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Analytics tracking error:', error);
    // Return success even on error to not break user experience
    return NextResponse.json({ success: true });
  }
}
