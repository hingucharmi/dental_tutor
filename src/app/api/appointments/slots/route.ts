import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { addCorsHeaders } from '@/lib/middleware/cors';

// Business hours configuration
const BUSINESS_HOURS = {
  monday: { start: '09:00', end: '17:00' },
  tuesday: { start: '09:00', end: '17:00' },
  wednesday: { start: '09:00', end: '17:00' },
  thursday: { start: '09:00', end: '17:00' },
  friday: { start: '09:00', end: '15:00' },
  saturday: null,
  sunday: null,
};

const SLOT_DURATION = 30; // minutes
const SLOTS_PER_HOUR = 60 / SLOT_DURATION;

function getDayName(date: Date): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
}

function generateTimeSlots(startTime: string, endTime: string): string[] {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const slots: string[] = [];
  let currentHour = startHour;
  let currentMin = startMin;

  while (
    currentHour < endHour ||
    (currentHour === endHour && currentMin < endMin)
  ) {
    slots.push(`${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`);
    currentMin += SLOT_DURATION;
    if (currentMin >= 60) {
      currentMin = 0;
      currentHour++;
    }
  }

  return slots;
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const dentistId = searchParams.get('dentistId');
    const serviceId = searchParams.get('serviceId');

    if (!date) {
      return NextResponse.json(
        { success: false, error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    // Parse date properly - handle YYYY-MM-DD format
    const selectedDate = new Date(date + 'T00:00:00'); // Add time to avoid timezone issues
    
    // Validate date
    if (isNaN(selectedDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const dayName = getDayName(selectedDate);
    const hours = BUSINESS_HOURS[dayName as keyof typeof BUSINESS_HOURS];

    if (!hours) {
      const response = NextResponse.json({
        success: true,
        data: { slots: [], date, available: false, message: `No business hours for ${dayName}` },
      });
      return addCorsHeaders(response, req);
    }

    // Get booked appointments for the date
    let bookedSlotsQuery = `
      SELECT appointment_time, duration 
      FROM appointments 
      WHERE appointment_date = $1 AND status != 'cancelled'
    `;
    const queryParams: any[] = [date];

    if (dentistId) {
      bookedSlotsQuery += ' AND dentist_id = $2';
      queryParams.push(dentistId);
    }

    const bookedResult = await query(bookedSlotsQuery, queryParams);
    const bookedSlots = new Set<string>();

    bookedResult.rows.forEach((row) => {
      const [hour, min] = row.appointment_time.split(':').map(Number);
      const duration = row.duration || 30;
      const slotsNeeded = Math.ceil(duration / SLOT_DURATION);

      for (let i = 0; i < slotsNeeded; i++) {
        const slotMin = min + i * SLOT_DURATION;
        const slotHour = hour + Math.floor(slotMin / 60);
        const finalMin = slotMin % 60;
        bookedSlots.add(`${String(slotHour).padStart(2, '0')}:${String(finalMin).padStart(2, '0')}`);
      }
    });

    // Generate all available slots
    const allSlots = generateTimeSlots(hours.start, hours.end);
    const availableSlots = allSlots.filter((slot) => !bookedSlots.has(slot));

    const result = NextResponse.json({
      success: true,
      data: {
        slots: availableSlots,
        date,
        available: availableSlots.length > 0,
        businessHours: hours,
      },
    });

    return addCorsHeaders(result, req);
  } catch (error: any) {
    console.error('Slots API error:', error);
    const errorMessage = error?.message || 'Failed to fetch available slots';
    const response = NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
    return addCorsHeaders(response, req);
  }
}

