// app/api/admin/assignments/assign-alpha/route.js
import clientPromise from "@/lib/mongo";
import { verifyToken } from "@/lib/auth";
import { ObjectId } from "mongodb";

/**
 * Verify Admin token
 * This function checks if the user has a valid token and an 'admin' role.
 */
function verifyAdminToken(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== "admin") {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error("Admin token verification failed:", error);
    return null;
  }
}

/**
 * PUT - Assign an alpha to a specific assignment
 * Requires an authenticated admin user.
 * Expects a JSON body with assignmentId and alphaId.
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
    const { assignmentId, alphaId } = body;

    // Validate required fields
    if (!assignmentId || !alphaId) {
      return Response.json(
        { error: "Missing required fields: assignmentId or alphaId" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("campusmart");

    const assignmentsCollection = db.collection("assignments");
    const alphasCollection = db.collection("alphas");

    // Find the alpha to get their name
    const alpha = await alphasCollection.findOne(
      { _id: new ObjectId(alphaId) },
      { projection: { name: 1 } }
    );
    if (!alpha) {
      return Response.json({ error: "Alpha not found" }, { status: 404 });
    }

    const alphaName = alpha.name;

     // Update the assignment with the alpha's ID and name
     const updateResult = await assignmentsCollection.updateOne(
       { _id: new ObjectId(assignmentId) },
       {
         $set: {
           assignedTo: new ObjectId(alphaId),
           assignedToName: alphaName, // Assign the alpha's name
           // Keep existing admin assignment - don't clear it
           // Mark as pending until alpha accepts
           status: "pending",
           updatedAt: new Date(),
         },
       }
     );

    if (updateResult.matchedCount === 0) {
      return Response.json({ error: "Assignment not found" }, { status: 404 });
    }

    return Response.json(
      {
        success: true,
        message: "Alpha assigned to assignment successfully",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error assigning alpha:", err);
    // Handle invalid ObjectId format specifically
    if (err.name === "BSONTypeError" || err.message.includes("ObjectId")) {
      return Response.json({ error: "Invalid ID format" }, { status: 400 });
    }
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
