import nodemailer from 'nodemailer';

export default async function sendEmail({ to, subject, text, html }) {
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'Gmail', // or use: host, port, secure
      auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_PASS, // App password (not your real Gmail password)
      },
    });

    // Send email
    const mailOptions = {
      from: `"CampusMart" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html: html || text,
    };

    await transporter.sendMail(mailOptions);
    ('Email sent to', to);
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Email could not be sent');
  }
}
