// app/api/alpha/register/route.js
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
const dbName = "campusmart";

export async function POST(req) {
  let isConnected = false;

  try {
    const body = await req.json();
    const { name, email, password, phone } = body; // <-- added phone

    // Validate required fields
    if (!name || !email || !password || !phone) {
      return Response.json(
        { error: "All fields (name, email, password, phone) are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Validate password length
    if (password.length < 6) {
      return Response.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Validate phone number format (basic)
    const phoneRegex = /^[0-9]{10}$/; // expecting 10 digits
    if (!phoneRegex.test(phone)) {
      return Response.json(
        { error: "Invalid phone number. Must be 10 digits." },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    await client.connect();
    isConnected = true;

    const db = client.db(dbName);
    const alphasCollection = db.collection("alphas");

    // Check if alpha already exists
    const existingAlpha = await alphasCollection.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingAlpha) {
      return Response.json(
        {
          error: "Alpha already exists with this email",
        },
        { status: 409 }
      );
    }

    // Check if phone number already used (optional)
    const existingPhone = await alphasCollection.findOne({
      phone: phone.trim(),
    });

    if (existingPhone) {
      return Response.json(
        { error: "Alpha already exists with this phone number" },
        { status: 409 }
      );
    }

    // Create alpha data object
    const alphaData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),              // <-- added phone here
      password: hashedPassword,
      role: "alpha",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert alpha into database
    const result = await alphasCollection.insertOne(alphaData);

    return Response.json(
      {
        message: "Alpha registered successfully",
        alphaId: result.insertedId,
        alpha: {
          name: alphaData.name,
          email: alphaData.email,
          phone: alphaData.phone,    // <-- also return phone
          role: alphaData.role,
          createdAt: alphaData.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Alpha registration error:", err);

    if (err.code === 11000) {
      return Response.json(
        {
          error: "Alpha already exists with this email or phone",
        },
        { status: 409 }
      );
    }

    return Response.json(
      {
        error: "Internal server error. Please try again later.",
      },
      { status: 500 }
    );
  } finally {
    if (isConnected) {
      try {
        await client.close();
      } catch (closeErr) {
        console.error("Error closing connection:", closeErr);
      }
    }
  }
}
