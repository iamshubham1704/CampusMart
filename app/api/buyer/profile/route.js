import { verifyToken } from "@/lib/auth";
import clientPromise from "@/lib/mongo";
import { ObjectId } from "mongodb";

// GET - Fetch buyer details
export async function GET(request) {
    try {
        const decoded = verifyToken(request);
        if (!decoded) {
            return Response.json({ message: 'Invalid or expired token' }, { status: 401 });
        }

        const client = await clientPromise;
        const db = client.db('campusmart');

        let userId = decoded.userId || decoded.buyerId || decoded.id || decoded.user_id;
        
        console.log('GET Profile - Decoded token data:', {
          userId: decoded.userId,
          buyerId: decoded.buyerId,
          id: decoded.id,
          user_id: decoded.user_id,
          role: decoded.role
        });

        if (!userId) {
            return Response.json({ message: 'Invalid token: no user ID found' }, { status: 401 });
        }

        if (typeof userId === 'string' && ObjectId.isValid(userId)) {
            userId = new ObjectId(userId);
        }

        const user = await db.collection('buyers').findOne(
            { _id: userId },
            {
                projection: {
                    password: 0
                }
            }
        );

        if (!user) {
            return Response.json({ message: 'User not found' }, { status: 404 });
        }

        return Response.json({
            message: 'Buyer details retrieved successfully',
            data: user
        }, { status: 200 });

    } catch (error) {
        return Response.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT/PATCH - Update buyer details - UNIQUE_IDENTIFIER
export async function PUT(request) {
    try {
        const decoded = verifyToken(request);
        if (!decoded) {
            return Response.json({ message: 'Invalid or expired token' }, { status: 401 });
        }

        const client = await clientPromise;
        const db = client.db('campusmart');

        let userId = decoded.userId || decoded.buyerId || decoded.id || decoded.user_id;
        
        console.log('PUT Profile - Decoded token data:', {
          userId: decoded.userId,
          buyerId: decoded.buyerId,
          id: decoded.id,
          user_id: decoded.user_id,
          role: decoded.role
        });

        if (!userId) {
            return Response.json({ message: 'Invalid token: no user ID found' }, { status: 401 });
        }

        if (typeof userId === 'string' && ObjectId.isValid(userId)) {
            userId = new ObjectId(userId);
        }

        // Parse request body
        const updateData = await request.json();

        // Remove sensitive fields that shouldn't be updated via this endpoint
        const { password, _id, createdAt, ...allowedUpdates } = updateData;

        // Validate that there's something to update
        if (Object.keys(allowedUpdates).length === 0) {
            return Response.json(
                { message: 'No valid fields to update' },
                { status: 400 }
            );
        }

        // Add updatedAt timestamp
        allowedUpdates.updatedAt = new Date();

        // Check if user exists before updating
        const existingUser = await db.collection('buyers').findOne({ _id: userId });
        if (!existingUser) {
            return Response.json({ message: 'User not found' }, { status: 404 });
        }

        // Update the user
        const result = await db.collection('buyers').updateOne(
            { _id: userId },
            { $set: allowedUpdates }
        );

        if (result.matchedCount === 0) {
            return Response.json({ message: 'User not found' }, { status: 404 });
        }

        if (result.modifiedCount === 0) {
            return Response.json(
                { message: 'No changes made to user data' },
                { status: 200 }
            );
        }

        // Fetch and return updated user data (without password)
        const updatedUser = await db.collection('buyers').findOne(
            { _id: userId },
            {
                projection: {
                    password: 0
                }
            }
        );

        return Response.json({
            message: 'Buyer details updated successfully',
            data: updatedUser
        }, { status: 200 });

    } catch (error) {

        if (error instanceof SyntaxError) {
            return Response.json(
                { message: 'Invalid JSON in request body' },
                { status: 400 }
            );
        }

        return Response.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PATCH - Partial update (alternative to PUT)
export async function PATCH(request) {
    // For partial updates, we can use the same logic as PUT
    // since we're already filtering out disallowed fields
    return PUT(request);
}