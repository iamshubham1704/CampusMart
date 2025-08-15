import clientPromise from '@/lib/mongo';
import crypto from 'crypto';
import sendEmail from '@/lib/sendEmail';

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart'); // change to your DB name
    const buyersCollection = db.collection('buyers');

    const buyer = await buyersCollection.findOne({ email });
    if (!buyer) {
      return new Response(JSON.stringify({ error: 'No account found with this email' }), { status: 404 });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpire = Date.now() + 3600000; // 1 hour

    await buyersCollection.updateOne(
      { email },
      { $set: { resetPasswordToken: resetToken, resetPasswordExpire: resetExpire } }
    );

    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${resetToken}`;

    await sendEmail({
      to: email,
      subject: 'Password Reset Request',
      text: `Click this link to reset your password: ${resetUrl}`,
    });

    return new Response(JSON.stringify({ message: 'Password reset link sent to your email.' }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
