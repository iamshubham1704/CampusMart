import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongo';
import { verifyToken } from '@/lib/auth';

// GET - List active pickup schedules for buyers with availability info
export async function GET(request) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('campusmart');

    // Only active pickup schedules
    const schedules = await db.collection('admin_schedules').find({
      type: 'pickup',
      status: 'active'
    }).toArray();

    const enhanced = await Promise.all(
      schedules.map(async (schedule) => {
        const existing = await db.collection('pickups').countDocuments({
          adminScheduleId: schedule._id
        });
        return {
          ...schedule,
          currentSlots: existing,
          availableSlots: (schedule.maxSlots || 10) - existing,
          isAvailable: existing < (schedule.maxSlots || 10)
        };
      })
    );

    return NextResponse.json({ success: true, data: enhanced }, { status: 200 });
  } catch (error) {
    console.error('GET /api/buyer/pickup-schedules error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


