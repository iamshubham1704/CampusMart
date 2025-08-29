import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

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

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'assignments');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      console.error('Error creating uploads directory:', error);
      return NextResponse.json({ error: 'Failed to create uploads directory' }, { status: 500 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `assignment-${assignmentId}-${timestamp}.pdf`;
    const filepath = join(uploadsDir, filename);

    try {
      // Convert file to buffer and save
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filepath, buffer);
    } catch (error) {
      console.error('Error writing file:', error);
      return NextResponse.json({ error: 'Failed to save file' }, { status: 500 });
    }

    // Return the public URL
    const publicUrl = `/uploads/assignments/${filename}`;

    console.log('✅ PDF uploaded successfully:', {
      assignmentId,
      filename,
      filepath,
      size: file.size,
      url: publicUrl
    });

    return NextResponse.json({ 
      success: true, 
      data: { 
        url: publicUrl,
        filename,
        size: file.size
      },
      message: 'PDF uploaded successfully' 
    });

  } catch (error) {
    console.error('POST /api/assignments/upload-pdf error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

