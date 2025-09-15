// File: /app/api/alpha/assignments/update-status/route.js
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongo";
import { ObjectId } from "mongodb";
import { verifyToken } from "@/lib/auth";

function getObjectIdIfValid(id) {
  try {
    return id && ObjectId.isValid(id) ? new ObjectId(String(id)) : null;
  } catch {
    return null;
  }
}

/**
 * Verify Alpha token (same logic as the assignments/route.js)
 */
function verifyAlphaToken(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== 'alpha') {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('Alpha token verification failed:', error);
    return null;
  }
}

export async function PUT(request) {
  try {
    // Use the same token verification as the fetch route
    const decoded = verifyAlphaToken(request);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized - Alpha access required" }, { status: 401 });
    }

    // Parse body - now also accept alphaName from frontend
    const { assignmentId, status, completedAt, alphaName } = await request.json();
    if (!assignmentId || !status) {
      return NextResponse.json({ error: "Assignment ID and status are required" }, { status: 400 });
    }

    const validStatuses = ["pending", "in-progress", "completed", "rejected"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("campusmart");

    // Find alpha using the SAME logic as the assignments fetch route
    // Priority: use alphaName from request body, fallback to decoded token
    const searchName = alphaName || decoded.name;
    if (!searchName) {
      return NextResponse.json({ error: "Alpha name not found in request or token" }, { status: 400 });
    }

    const alpha = await db.collection("alphas").findOne({ name: searchName });
    if (!alpha) {
      return NextResponse.json({ error: "Alpha not found" }, { status: 401 });
    }

    // Find assignment
    const assignmentObjId = getObjectIdIfValid(assignmentId);
    if (!assignmentObjId) {
      return NextResponse.json({ error: "Invalid assignmentId format" }, { status: 400 });
    }

    const assignment = await db.collection("assignments").findOne({ _id: assignmentObjId });
    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    // ✅ FIXED: Use the same ownership check as the fetch logic
    // The assignment must be assigned to this alpha's _id (ObjectId)
    let ownershipMatches = false;

    if (assignment.assignedTo) {
      try {
        const assignedToObjId = ObjectId.isValid(String(assignment.assignedTo))
          ? new ObjectId(String(assignment.assignedTo))
          : null;
        if (assignedToObjId && assignedToObjId.equals(alpha._id)) {
          ownershipMatches = true;
        }
      } catch {
        ownershipMatches = false;
      }
    }

    if (!ownershipMatches) {
      // More detailed error for debugging
      console.log("Ownership check failed:", {
        assignmentId: assignmentObjId.toString(),
        assignedTo: assignment.assignedTo?.toString(),
        alphaId: alpha._id.toString(),
        alphaName: alpha.name
      });
      
      return NextResponse.json(
        { 
          error: "Unauthorized - This assignment is not assigned to you",
          debug: {
            assignmentAssignedTo: assignment.assignedTo?.toString(),
            yourAlphaId: alpha._id.toString()
          }
        },
        { status: 403 }
      );
    }

    // Build update operation
    let updateOperation = { $set: { updatedAt: new Date() } };

    if (status === "completed" || status === "alpha_completed") {
      // Alpha completion should not finalize delivery; mark as alpha_completed
      updateOperation.$set.status = "alpha_completed";
      updateOperation.$set.completedAt = completedAt ? new Date(completedAt) : new Date();
      updateOperation.$set.completedByAlpha = true;
    } else if (status === "in-progress") {
      updateOperation.$set.status = "in-progress";
    } else if (status === "rejected") {
      // When alpha rejects: clear assignee and set back to pending
      updateOperation.$set.status = "pending";
      updateOperation.$set.rejectedAt = new Date();
      updateOperation.$set.rejectedByAlpha = true;
      updateOperation.$unset = { assignedTo: "", assignedToName: "" };
    } else if (status === "pending") {
      updateOperation.$set.status = "pending";
    }

    const result = await db.collection("assignments").findOneAndUpdate(
      { _id: assignmentObjId },
      updateOperation,
      { returnDocument: "after" }
    );

    // Create notification for completed assignments
    if (status === "completed" || status === "alpha_completed") {
      try {
        const adminId = result?.value?.adminId;
        if (adminId) {
          await db.collection("notifications").insertOne({
            type: "assignment_alpha_completed",
            message: `${result.value.title || "Assignment"} has been marked completed by ${alpha.name}. Awaiting delivery confirmation.`,
            assignmentId: result.value._id,
            adminId: new ObjectId(String(adminId)),
            alphaId: alpha._id,
            createdAt: new Date(),
            read: false,
          });
        }
      } catch (notifyErr) {
        console.error("Failed to create admin notification:", notifyErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Assignment status updated to ${status}`,
      data: result.value
    }, { status: 200 });

  } catch (err) {
    console.error("update-status error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}