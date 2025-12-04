import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/middleware/auth';
import { addCorsHeaders } from '@/lib/middleware/cors';
import { logger } from '@/lib/utils/logger';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);

    // Get active calendar integrations
    const integrationsResult = await query(
      'SELECT * FROM calendar_integrations WHERE user_id = $1 AND is_active = TRUE',
      [user.id]
    );

    if (integrationsResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No active calendar integrations found' },
        { status: 400 }
      );
    }

    // Get upcoming appointments
    const appointmentsResult = await query(
      `SELECT id, appointment_date, appointment_time, duration, service_id
       FROM appointments
       WHERE user_id = $1 AND status != 'cancelled' AND appointment_date >= CURRENT_DATE
       ORDER BY appointment_date, appointment_time
       LIMIT 50`,
      [user.id]
    );

    // Update last sync time for all integrations
    for (const integration of integrationsResult.rows) {
      await query(
        'UPDATE calendar_integrations SET last_sync_at = CURRENT_TIMESTAMP WHERE id = $1',
        [integration.id]
      );
    }

    logger.info('Calendar sync completed', { 
      userId: user.id, 
      integrationsCount: integrationsResult.rows.length,
      appointmentsCount: appointmentsResult.rows.length 
    });

    const response = NextResponse.json({
      success: true,
      message: 'Calendar synced successfully',
      data: {
        syncedAppointments: appointmentsResult.rows.length,
        integrationsSynced: integrationsResult.rows.length,
      },
    });

    return addCorsHeaders(response, req);
  } catch (error) {
    logger.error('Calendar sync error', error as Error);
    return NextResponse.json(
      { success: false, error: 'Failed to sync calendar' },
      { status: 500 }
    );
  }
}

