import clientPromise from "@/lib/mongo";
import { verifyAdminToken } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function GET(request) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("campusmart");

    // Fetch completed assignments with revenue data
    const completedAssignments = await db.collection("assignments")
      .find({ 
        status: "completed",
        buyerPrice: { $exists: true, $ne: null, $gt: 0 } // Only assignments with buyer price set
      })
      .sort({ updatedAt: -1 })
      .toArray();

    // Calculate total assignment revenue
    const totalAssignmentRevenue = completedAssignments.reduce((sum, assignment) => {
      return sum + (assignment.buyerPrice || 0);
    }, 0);

    // Calculate total assignment commission (assuming 10% commission)
    const commissionRate = 0.10; // 10%
    const totalAssignmentCommission = totalAssignmentRevenue * commissionRate;

    // Get assignment revenue by date for analytics
    const assignmentRevenueByDate = completedAssignments.reduce((acc, assignment) => {
      const date = new Date(assignment.updatedAt).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          revenue: 0,
          commission: 0,
          count: 0
        };
      }
      acc[date].revenue += assignment.buyerPrice || 0;
      acc[date].commission += (assignment.buyerPrice || 0) * commissionRate;
      acc[date].count += 1;
      return acc;
    }, {});

    const revenueData = Object.values(assignmentRevenueByDate).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    return Response.json({
      success: true,
      data: {
        totalRevenue: totalAssignmentRevenue,
        totalCommission: totalAssignmentCommission,
        completedCount: completedAssignments.length,
        revenueByDate: revenueData,
        assignments: completedAssignments.map(assignment => ({
          _id: assignment._id,
          title: assignment.title,
          buyerPrice: assignment.buyerPrice,
          alphaPrice: assignment.alphaPrice,
          commission: (assignment.buyerPrice || 0) * commissionRate,
          completedAt: assignment.updatedAt,
          buyer: assignment.buyerName || 'Unknown Buyer'
        }))
      }
    });

  } catch (error) {
    console.error("Error fetching assignment revenue:", error);
    return Response.json(
      { error: "Failed to fetch assignment revenue" },
      { status: 500 }
    );
  }
}
