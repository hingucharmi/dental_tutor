import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { addCorsHeaders } from '@/lib/middleware/cors';
import { NotFoundError } from '@/lib/utils/errors';

export async function OPTIONS(req: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, req);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dentistId = parseInt(id);
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    if (isNaN(dentistId)) {
      const errorResponse = NextResponse.json(
        { success: false, error: 'Invalid dentist ID' },
        { status: 400 }
      );
      return addCorsHeaders(errorResponse, req);
    }

    // Verify dentist exists
    const dentistCheck = await query(
      'SELECT id FROM dentists WHERE id = $1',
      [dentistId]
    );

    if (dentistCheck.rows.length === 0) {
      const errorResponse = NextResponse.json(
        { success: false, error: 'Dentist not found' },
        { status: 404 }
      );
      return addCorsHeaders(errorResponse, req);
    }

    // Get dentist's availability schedule
    const dentistResult = await query(
      'SELECT availability_schedule FROM dentists WHERE id = $1',
      [dentistId]
    );

    const availabilitySchedule = dentistResult.rows[0]?.availability_schedule || null;

    // If a specific date is requested, check for appointments on that date
    let availableSlots: any[] = [];
    let bookedSlots: any[] = [];

    if (date) {
      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const errorResponse = NextResponse.json(
          { success: false, error: 'Invalid date format. Use YYYY-MM-DD' },
          { status: 400 }
        );
        return addCorsHeaders(errorResponse, req);
      }

      // Get booked appointments for this dentist on this date
      const appointmentsResult = await query(
        `SELECT appointment_time, duration, status
         FROM appointments
         WHERE dentist_id = $1 
         AND appointment_date = $2
         AND status IN ('scheduled', 'confirmed')
         ORDER BY appointment_time ASC`,
        [dentistId, date]
      );

      bookedSlots = appointmentsResult.rows.map((row: any) => ({
        time: row.appointment_time,
        duration: row.duration,
        status: row.status,
      }));

      // Generate available slots based on availability schedule
      // Default business hours if no schedule is set
      const defaultHours = {
        monday: { start: '09:00', end: '17:00' },
        tuesday: { start: '09:00', end: '17:00' },
        wednesday: { start: '09:00', end: '17:00' },
        thursday: { start: '09:00', end: '17:00' },
        friday: { start: '09:00', end: '17:00' },
        saturday: null,
        sunday: null,
      };

      const schedule = availabilitySchedule || defaultHours;
      const dayOfWeek = new Date(date).getDay(); // 0 = Sunday, 1 = Monday, etc.
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dayOfWeek];
      const daySchedule = schedule[dayName as keyof typeof schedule];

      if (daySchedule && daySchedule.start && daySchedule.end) {
        // Generate 30-minute slots
        const startTime = daySchedule.start.split(':').map(Number);
        const endTime = daySchedule.end.split(':').map(Number);
        const startMinutes = startTime[0] * 60 + startTime[1];
        const endMinutes = endTime[0] * 60 + endTime[1];
        const slotDuration = 30; // minutes

        for (let minutes = startMinutes; minutes < endMinutes; minutes += slotDuration) {
          const hours = Math.floor(minutes / 60);
          const mins = minutes % 60;
          const timeSlot = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;

          // Check if this slot is booked
          const isBooked = bookedSlots.some((slot) => {
            const slotTime = slot.time.split(':').map(Number);
            const slotMinutes = slotTime[0] * 60 + slotTime[1];
            const slotEndMinutes = slotMinutes + (slot.duration || 30);
            return minutes >= slotMinutes && minutes < slotEndMinutes;
          });

          if (!isBooked) {
            availableSlots.push({
              time: timeSlot,
              duration: slotDuration,
            });
          }
        }
      }
    }

    const response = NextResponse.json({
      success: true,
      data: {
        dentistId,
        date: date || null,
        availabilitySchedule,
        availableSlots,
        bookedSlots,
        totalAvailableSlots: availableSlots.length,
        totalBookedSlots: bookedSlots.length,
      },
    });

    return addCorsHeaders(response, req);
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      const errorResponse = NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
      return addCorsHeaders(errorResponse, req);
    }

    const errorResponse = NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch dentist availability' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, req);
  }
}

