import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accountType } = await request.json();
    
    if (!accountType || !['buyer', 'seller'].includes(accountType)) {
      return Response.json({ error: "Invalid account type" }, { status: 400 });
    }
    (`Setting account type to: ${accountType} for user: ${session.user.email}`);
    
    return Response.json({ 
      success: true, 
      accountType,
      message: "Account type updated successfully" 
    });
    
  } catch (error) {
    console.error("Account type update error:", error);
    return Response.json({ 
      error: "Failed to update account type" 
    }, { status: 500 });
  }
}