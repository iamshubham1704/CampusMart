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
      return NextResponse.json({ error: 'No PDF file provided. Please select a file to upload.' }, { status: 400 });
    }

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required. Please try again.' }, { status: 400 });
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ 
        error: `Invalid file type. Only PDF files are allowed. Selected file type: ${file.type || 'unknown'}` 
      }, { status: 400 });
    }

    // Validate file size (max 25MB)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return NextResponse.json({ 
        error: `File size (${fileSizeMB}MB) exceeds the maximum limit of 25MB. Please choose a smaller file.` 
      }, { status: 400 });
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
      return NextResponse.json({ 
        error: 'Assignment not found or you do not have permission to upload files for this assignment.' 
      }, { status: 404 });
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
      return NextResponse.json({ 
        error: 'Failed to upload file to our servers. Please check your internet connection and try again.' 
      }, { status: 502 });
    }

    if (!uploadResponse || !uploadResponse.url) {
      return NextResponse.json({ 
        error: 'Upload failed. The file was not properly saved. Please try again.' 
      }, { status: 502 });
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

