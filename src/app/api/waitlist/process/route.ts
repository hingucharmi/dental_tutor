import { NextRequest, NextResponse } from 'next/server';
import { processWaitlistEntries } from '@/lib/services/waitlist';
import { logger } from '@/lib/utils/logger';
import { addCorsHeaders } from '@/lib/middleware/cors';

// This endpoint should be called by a cron job or scheduled task
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    // Protect with CRON_SECRET like reminders
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'cron-secret-key'}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await processWaitlistEntries();

    const response = NextResponse.json({
      success: true,
      data: {
        processed: result.processed,
        notified: result.notified,
        autoBooked: result.autoBooked,
        errors: result.errors.length,
        details: result,
        timestamp: new Date().toISOString(),
      },
    });

    return addCorsHeaders(response, req);
  } catch (error) {
    logger.error('Process waitlist error', error as Error);
    return NextResponse.json(
      { success: false, error: 'Failed to process waitlist' },
      { status: 500 }
    );
  }
}








