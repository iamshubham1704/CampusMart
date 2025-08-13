import { verifyToken } from '../../../../../lib/auth';
import clientPromise from '@/lib/mongo';
import { ObjectId } from 'mongodb';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return Response.json({ message: 'Invalid or expired token' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('profileImage');

    if (!file) {
      return Response.json({ message: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return Response.json({ 
        message: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' 
      }, { status: 400 });
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return Response.json({ 
        message: 'File size too large. Maximum size is 5MB.' 
      }, { status: 400 });
    }

    let userId = decoded.userId || decoded.sellerId || decoded.id || decoded.user_id;
    if (!userId) {
      return Response.json({ message: 'Invalid token: no user ID found' }, { status: 401 });
    }

    // Create unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `profile-${userId}-${timestamp}.${fileExtension}`;

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'profiles');
    await mkdir(uploadDir, { recursive: true });

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // Update user profile with image URL
    const imageUrl = `/uploads/profiles/${fileName}`;
    
    const client = await clientPromise;
    const db = client.db('campusmart');
    
    if (typeof userId === 'string' && ObjectId.isValid(userId)) {
      userId = new ObjectId(userId);
    }

    const result = await db.collection('sellers').updateOne(
      { _id: userId },
      { 
        $set: { 
          profileImage: imageUrl,
          updatedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }

    return Response.json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: { imageUrl }
    }, { status: 200 });

  } catch (error) {
    console.error('Error uploading image:', error);
    return Response.json({
      success: false,
      message: 'Failed to upload image'
    }, { status: 500 });
  }
}