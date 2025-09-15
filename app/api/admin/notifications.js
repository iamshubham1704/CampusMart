// api/admin/notifications.js
// GET endpoint to fetch notifications for admin dashboard

import { connectDB } from '../../../lib/db';
import Notification from '../../../models/Notification';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    // Verify admin token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Fetch notifications sorted by creation date (newest first)
    const notifications = await Notification.find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('assignmentId', 'title description')
      .lean();

    res.status(200).json({
      success: true,
      data: notifications
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Server error' });
  }
}