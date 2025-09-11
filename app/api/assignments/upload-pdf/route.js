import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import clientPromise from '@/lib/mongo';
import { ObjectId } from 'mongodb';
import imagekit from '@/lib/imagekit';

export async function POST(request) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('pdf');
    const assignmentId = formData.get('assignmentId');

    if (!file) {
      return NextResponse.json({ error: 'No PDF file provided' }, { status: 400 });
    }

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
    }

    // Validate file size (max 25MB)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size must be less than or equal to 25MB' }, { status: 400 });
    }

    // Ensure ImageKit is available
    if (!imagekit) {
      return NextResponse.json({ error: 'File service unavailable. Try again later.' }, { status: 503 });
    }

    // Verify the assignment belongs to the authenticated user
    const client = await clientPromise;
    const db = client.db('campusmart');
    const assignment = await db.collection('assignments').findOne({
      _id: new ObjectId(assignmentId),
      buyerId: new ObjectId(decoded.userId)
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found or unauthorized' }, { status: 404 });
    }

    // Convert file to Buffer (no local writes)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Prepare a safe filename
    const timestamp = Date.now();
    const safeBaseName = (assignment.title || 'assignment')
      .toString()
      .replace(/[^a-z0-9\-]+/gi, '-')
      .toLowerCase()
      .slice(0, 50);
    const fileName = `assignment-${assignmentId}-${safeBaseName}-${timestamp}.pdf`;

    // Upload directly to ImageKit using buffer
    let uploadResponse;
    try {
      uploadResponse = await imagekit.upload({
        file: buffer,
        fileName,
        folder: 'campusmart/assignments',
        useUniqueFileName: true,
        isPrivateFile: false,
        tags: ['assignment', 'pdf']
      });
    } catch (err) {
      console.error('ImageKit upload failed:', err);
      return NextResponse.json({ error: 'Failed to upload file. Please try again.' }, { status: 502 });
    }

    if (!uploadResponse || !uploadResponse.url) {
      return NextResponse.json({ error: 'Upload failed. No URL returned.' }, { status: 502 });
    }

    // Persist the ImageKit URL to the assignment
    await db.collection('assignments').updateOne(
      { _id: new ObjectId(assignmentId) },
      {
        $set: {
          pdfUrl: uploadResponse.url,
          updatedAt: new Date()
        }
      }
    );

    const updated = await db.collection('assignments').findOne({ _id: new ObjectId(assignmentId) });

    console.log('✅ PDF uploaded to ImageKit and assignment updated:', {
      assignmentId,
      fileId: uploadResponse.fileId,
      url: uploadResponse.url,
      size: file.size
    });

    return NextResponse.json({
      success: true,
      data: {
        url: uploadResponse.url,
        assignment: updated
      },
      message: 'PDF uploaded successfully'
    });

  } catch (error) {
    console.error('POST /api/assignments/upload-pdf error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

