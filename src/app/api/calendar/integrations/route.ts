import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/middleware/auth';
import { addCorsHeaders } from '@/lib/middleware/cors';
import { logger } from '@/lib/utils/logger';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    
    const result = await query(
      'SELECT * FROM calendar_integrations WHERE user_id = $1 ORDER BY created_at DESC',
      [user.id]
    );

    const integrations = result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      provider: row.provider,
      calendarId: row.calendar_id,
      isActive: row.is_active,
      lastSyncAt: row.last_sync_at,
      syncFrequency: row.sync_frequency,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    const response = NextResponse.json({
      success: true,
      data: { integrations },
    });

    return addCorsHeaders(response, req);
  } catch (error) {
    logger.error('Get calendar integrations error', error as Error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch calendar integrations' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const body = await req.json();
    const { provider, syncFrequency = 'realtime' } = body;

    if (!provider) {
      return NextResponse.json(
        { success: false, error: 'Provider is required' },
        { status: 400 }
      );
    }

    // Check if integration already exists
    const existing = await query(
      'SELECT id FROM calendar_integrations WHERE user_id = $1 AND provider = $2',
      [user.id, provider]
    );

    if (existing.rows.length > 0) {
      // Update existing integration
      const result = await query(
        `UPDATE calendar_integrations 
         SET is_active = TRUE, sync_frequency = $1, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $2 AND provider = $3
         RETURNING *`,
        [syncFrequency, user.id, provider]
      );

      const integration = result.rows[0];
      return NextResponse.json({
        success: true,
        data: {
          integration: {
            id: integration.id,
            provider: integration.provider,
            isActive: integration.is_active,
            syncFrequency: integration.sync_frequency,
          },
        },
      });
    }

    // Create new integration
    const result = await query(
      `INSERT INTO calendar_integrations (user_id, provider, is_active, sync_frequency)
       VALUES ($1, $2, TRUE, $3)
       RETURNING *`,
      [user.id, provider, syncFrequency]
    );

    const integration = result.rows[0];
    logger.info('Calendar integration created', { userId: user.id, provider });

    const response = NextResponse.json({
      success: true,
      data: {
        integration: {
          id: integration.id,
          provider: integration.provider,
          isActive: integration.is_active,
          syncFrequency: integration.sync_frequency,
        },
      },
    }, { status: 201 });

    return addCorsHeaders(response, req);
  } catch (error) {
    logger.error('Create calendar integration error', error as Error);
    return NextResponse.json(
      { success: false, error: 'Failed to create calendar integration' },
      { status: 500 }
    );
  }
}

