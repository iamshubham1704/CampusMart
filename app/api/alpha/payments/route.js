import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongo";
import { verifyToken } from "@/lib/auth";
import { ObjectId } from "mongodb";

function verifyAlpha(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "alpha") return null;
    return decoded;
  } catch (e) {
    return null;
  }
}

// GET: list payment requests for alpha
export async function GET(request) {
  try {
    const decoded = verifyAlpha(request);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const client = await clientPromise;
    const db = client.db("campusmart");

    // Resolve alphaId from token
    let alphaDoc = null;
    if (decoded?.id && ObjectId.isValid(String(decoded.id))) {
      alphaDoc = await db.collection("alphas").findOne({ _id: new ObjectId(String(decoded.id)) });
    }
    if (!alphaDoc && decoded?.email) {
      alphaDoc = await db.collection("alphas").findOne({ email: decoded.email });
    }
    if (!alphaDoc && decoded?.name) {
      alphaDoc = await db.collection("alphas").findOne({ name: decoded.name });
    }
    if (!alphaDoc) return NextResponse.json({ error: "Alpha not found" }, { status: 404 });

    const payments = await db
      .collection("alpha_payment_requests")
      .aggregate([
        { $match: { alphaId: alphaDoc._id } },
        {
          $lookup: {
            from: "assignments",
            localField: "assignmentId",
            foreignField: "_id",
            as: "assignment",
          },
        },
        { $addFields: { assignment: { $arrayElemAt: ["$assignment", 0] } } },
        { $sort: { createdAt: -1 } },
      ])
      .toArray();

    return NextResponse.json({ success: true, data: payments });
  } catch (e) {
    console.error("GET /api/alpha/payments error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT: update payment request (e.g., mark as requested/confirmed as received)
export async function PUT(request) {
  try {
    const decoded = verifyAlpha(request);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { paymentRequestId, action } = body; // action: "request_payout" | "confirm_received"
    if (!paymentRequestId || !action) {
      return NextResponse.json({ error: "paymentRequestId and action are required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("campusmart");

    let objectId;
    try {
      objectId = new ObjectId(paymentRequestId);
    } catch {
      return NextResponse.json({ error: "Invalid paymentRequestId" }, { status: 400 });
    }

    const payment = await db.collection("alpha_payment_requests").findOne({ _id: objectId });
    if (!payment) return NextResponse.json({ error: "Payment request not found" }, { status: 404 });

    // Verify ownership
    // Resolve alphaId from token as before
    let alphaDoc = null;
    if (decoded?.id && ObjectId.isValid(String(decoded.id))) {
      alphaDoc = await db.collection("alphas").findOne({ _id: new ObjectId(String(decoded.id)) });
    }
    if (!alphaDoc && decoded?.email) {
      alphaDoc = await db.collection("alphas").findOne({ email: decoded.email });
    }
    if (!alphaDoc && decoded?.name) {
      alphaDoc = await db.collection("alphas").findOne({ name: decoded.name });
    }
    if (!alphaDoc) return NextResponse.json({ error: "Alpha not found" }, { status: 404 });
    if (String(payment.alphaId) !== String(alphaDoc._id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const update = { updatedAt: new Date() };
    if (action === "request_payout") {
      update.status = "requested"; // alpha asked admin/finance to pay
      update.requestedAt = new Date();
    } else if (action === "confirm_received") {
      update.status = "paid";
      update.paidAt = new Date();
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await db.collection("alpha_payment_requests").updateOne({ _id: objectId }, { $set: update });
    const updated = await db.collection("alpha_payment_requests").findOne({ _id: objectId });
    return NextResponse.json({ success: true, data: updated });
  } catch (e) {
    console.error("PUT /api/alpha/payments error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


