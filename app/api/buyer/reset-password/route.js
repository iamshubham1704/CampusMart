import clientPromise from '@/lib/mongo';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) {
      return new Response(JSON.stringify({ error: 'Token and password are required' }), { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart'); // change to your DB name
    const buyersCollection = db.collection('buyers');

    const buyer = await buyersCollection.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!buyer) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await buyersCollection.updateOne(
      { resetPasswordToken: token },
      {
        $set: { password: hashedPassword },
        $unset: { resetPasswordToken: "", resetPasswordExpire: "" },
      }
    );

    return new Response(JSON.stringify({ message: 'Password reset successful' }), { status: 200 });
  } catch (error) {
    console.error('Reset password error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
