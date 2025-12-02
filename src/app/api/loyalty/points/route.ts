import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/middleware/auth';
import { logger } from '@/lib/utils/logger';
import { addCorsHeaders } from '@/lib/middleware/cors';

export async function OPTIONS(req: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, req);
}

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);

    // Get or create loyalty points record
    let result = await query(
      'SELECT * FROM loyalty_points WHERE user_id = $1',
      [user.id]
    );

    if (result.rows.length === 0) {
      // Create initial loyalty points record
      await query(
        `INSERT INTO loyalty_points (user_id, points, tier)
         VALUES ($1, 0, 'bronze')
         RETURNING *`,
        [user.id]
      );
      result = await query(
        'SELECT * FROM loyalty_points WHERE user_id = $1',
        [user.id]
      );
    }

    const loyaltyPoints = result.rows[0];

    // Calculate tier based on points
    let tier = 'bronze';
    const points = loyaltyPoints.points || 0;
    if (points >= 1000) tier = 'platinum';
    else if (points >= 500) tier = 'gold';
    else if (points >= 200) tier = 'silver';

    // Update tier if changed
    if (tier !== loyaltyPoints.tier) {
      await query(
        'UPDATE loyalty_points SET tier = $1 WHERE user_id = $2',
        [tier, user.id]
      );
    }

    const response = NextResponse.json({
      success: true,
      data: {
        loyaltyPoints: {
          points: loyaltyPoints.points || 0,
          pointsEarned: loyaltyPoints.points_earned || 0,
          pointsRedeemed: loyaltyPoints.points_redeemed || 0,
          tier: tier,
        },
      },
    });

    return addCorsHeaders(response, req);
  } catch (error: any) {
    logger.error('Get loyalty points error', error);
    const errorResponse = NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch loyalty points' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, req);
  }
}

