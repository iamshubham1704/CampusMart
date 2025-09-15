import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongo";
import { verifyAdminToken } from "@/lib/auth";
import { ObjectId } from "mongodb";

// GET: list alpha payment requests (optionally filter by status)
export async function GET(request) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // e.g., pending | requested | paid

    const client = await clientPromise;
    const db = client.db("campusmart");

    const match = {};
    if (status && status !== "all") {
      match.status = status;
    }

    const payments = await db
      .collection("alpha_payment_requests")
      .aggregate([
        { $match: match },
        {
          $lookup: {
            from: "assignments",
            localField: "assignmentId",
            foreignField: "_id",
            as: "assignment",
          },
        },
        { $addFields: { assignment: { $arrayElemAt: ["$assignment", 0] } } },
        {
          $lookup: {
            from: "alphas",
            localField: "alphaId",
            foreignField: "_id",
            as: "alpha",
          },
        },
        { $addFields: { alpha: { $arrayElemAt: ["$alpha", 0] } } },
        { $sort: { createdAt: -1 } },
      ])
      .toArray();

    return NextResponse.json({ success: true, data: payments });
  } catch (e) {
    console.error("GET /api/admin/alpha-payments error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


