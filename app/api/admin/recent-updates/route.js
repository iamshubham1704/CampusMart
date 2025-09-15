// File: /api/admin/recent-updates/route.js
// This API endpoint provides recent assignment updates for admin dashboard

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongo";
import Assignment from "@/models/Assignment";
import jwt from "jsonwebtoken";

export async function GET(request) {
  try {
    await connectDB();
    
    // Get token from Authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user is admin
    if (decoded.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    // Get 'since' parameter from query string
    const { searchParams } = new URL(request.url);
    const sinceParam = searchParams.get('since');
    
    let sinceDate;
    if (sinceParam) {
      sinceDate = new Date(sinceParam);
    } else {
      // Default to last 1 hour if no since parameter
      sinceDate = new Date(Date.now() - 60 * 60 * 1000);
    }

    // Find assignments that have been updated since the given time
    const recentlyUpdatedAssignments = await Assignment.find({
      updatedAt: { $gte: sinceDate }
    })
    .populate([
      { path: 'buyer', select: 'name email' },
      { path: 'assignedToAlpha', select: 'name email' }
    ])
    .sort({ updatedAt: -1 })
    .limit(20);

    // Format updates for notifications
    const updates = recentlyUpdatedAssignments.map(assignment => {
      let message = '';
      let type = 'status_change';
      
      if (assignment.status === 'completed' && assignment.completedByAlpha) {
        message = `"${assignment.title}" has been completed by ${assignment.assignedToAlpha?.name || 'Alpha'}`;
        type = 'completed';
      } else if (assignment.status === 'completed') {
        message = `"${assignment.title}" has been marked as completed`;
        type = 'completed';
      } else if (assignment.status === 'in-progress') {
        message = `"${assignment.title}" is now in progress`;
        type = 'status_change';
      } else {
        message = `"${assignment.title}" status updated to ${assignment.status.replace('_', ' ')}`;
        type = 'status_change';
      }

      return {
        id: assignment._id,
        message,
        type,
        timestamp: assignment.updatedAt,
        assignmentTitle: assignment.title,
        assignmentId: assignment._id,
        status: assignment.status,
        buyer: assignment.buyer?.name,
        alpha: assignment.assignedToAlpha?.name
      };
    });

    return NextResponse.json({
      success: true,
      updates,
      count: updates.length,
      since: sinceDate
    });

  } catch (error) {
    console.error("Error fetching recent updates:", error);
    
    if (error.name === "JsonWebTokenError") {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }
    
    if (error.name === "TokenExpiredError") {
      return NextResponse.json(
        { error: "Token expired" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}