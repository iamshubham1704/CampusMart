// app/api/admin/assign-admin/route.js
import clientPromise from "@/lib/mongo";
import { verifyToken, verifyAdminToken } from "@/lib/auth";
import { ObjectId } from "mongodb";

/**
 * PUT - Assign an admin to a specific assignment
 * Requires an authenticated admin user.
 * Expects a JSON body with assignmentId and adminId.
 */
export async function PUT(request) {
  try {
    // Authenticate the request using an admin token
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return Response.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { assignmentId, adminId } = body;

    // Validate required fields
    if (!assignmentId || !adminId) {
      return Response.json(
        { error: "Missing required fields: assignmentId or adminId" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("campusmart");

    const assignmentsCollection = db.collection("assignments");
    const adminsCollection = db.collection("admins");

    // Find the admin to get their name
    const admin = await adminsCollection.findOne(
      { _id: new ObjectId(adminId) },
      { projection: { name: 1, email: 1 } }
    );
    if (!admin) {
      return Response.json({ error: "Admin not found" }, { status: 404 });
    }

    const adminName = admin.name;

    // Update the assignment with the admin's ID and name
    const updateResult = await assignmentsCollection.updateOne(
      { _id: new ObjectId(assignmentId) },
      {
        $set: {
          assignedToAdmin: new ObjectId(adminId),
          assignedToAdminName: adminName,
          // Keep existing alpha assignment - don't clear it
          // Mark as pending until admin accepts
          status: "pending",
          updatedAt: new Date(),
        },
      }
    );

    if (updateResult.matchedCount === 0) {
      return Response.json({ error: "Assignment not found" }, { status: 404 });
    }

    // Get the updated assignment with populated admin details
    const updatedAssignment = await assignmentsCollection.findOne(
      { _id: new ObjectId(assignmentId) }
    );

    return Response.json(
      {
        success: true,
        message: "Admin assigned to assignment successfully",
        data: {
          ...updatedAssignment,
          assignedToAdmin: {
            _id: admin._id,
            name: admin.name,
            email: admin.email
          }
        }
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error assigning admin:", err);
    // Handle invalid ObjectId format specifically
    if (err.name === "BSONTypeError" || err.message.includes("ObjectId")) {
      return Response.json({ error: "Invalid ID format" }, { status: 400 });
    }
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
