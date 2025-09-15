// app/api/alphas/route.js
import clientPromise from "@/lib/mongo";
import { verifyToken } from "@/lib/auth";

/**
 * Verify Admin token
 * This function will check if the user has a valid token and an 'admin' role.
 * You'll need to create a similar function in your `lib/auth.js` file.
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
 * GET - Get a list of all alphas
 * Requires an authenticated admin user.
 */
export async function GET(request) {
  try {
    // Authenticate the request using an admin token
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return Response.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db("campusmart"); // Replace with your DB name

    // Fetch all alpha documents, excluding the password field for security
    const alphas = await db
      .collection("alphas")
      .find({})
      .project({ password: 0 }) // Excludes the password field
      .toArray();

    return Response.json(
      {
        success: true,
        data: alphas,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching alphas:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
