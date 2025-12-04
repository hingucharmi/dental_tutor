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
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let queryStr = `
      SELECT tc.*, 
             tpi.description as treatment_description,
             s.name as service_name,
             s.description as service_description
      FROM treatment_compliance tc
      LEFT JOIN treatment_plan_items tpi ON tc.treatment_plan_item_id = tpi.id
      LEFT JOIN services s ON tpi.service_id = s.id
      WHERE tc.user_id = $1
    `;
    const params: any[] = [user.id];

    if (status && status !== 'all') {
      queryStr += ' AND tc.compliance_status = $2';
      params.push(status);
    }

    queryStr += ' ORDER BY tc.scheduled_date ASC';

    const result = await query(queryStr, params);

    const complianceItems = result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      treatmentPlanId: row.treatment_plan_id,
      treatmentPlanItemId: row.treatment_plan_item_id,
      scheduledDate: row.scheduled_date,
      completedDate: row.completed_date,
      status: row.compliance_status,
      reminderSent: row.reminder_sent,
      reminderCount: row.reminder_count,
      notes: row.notes,
      treatmentDescription: row.treatment_description,
      serviceName: row.service_name,
      serviceDescription: row.service_description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    const response = NextResponse.json({
      success: true,
      data: { complianceItems },
    });

    return addCorsHeaders(response, req);
  } catch (error) {
    logger.error('Get compliance error', error as Error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch compliance data' },
      { status: 500 }
    );
  }
}

