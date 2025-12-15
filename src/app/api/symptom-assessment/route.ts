import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/middleware/auth';
import { logger } from '@/lib/utils/logger';
import { addCorsHeaders } from '@/lib/middleware/cors';
// Generate session ID using crypto (Node.js built-in)
function generateSessionId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

const symptomAssessmentSchema = z.object({
  userId: z.number().optional(),
  sessionId: z.string().optional(),
  symptoms: z.any(), // Accept both array and object formats
  severity: z.string().optional(),
  duration: z.string().optional(),
  location: z.string().optional(),
  additionalInfo: z.string().optional(),
});

function parseDurationDays(duration?: string): number | null {
  if (!duration) return null;
  const num = parseInt(duration, 10);
  return Number.isNaN(num) ? null : num;
}

function detectRedFlags(symptomsLower: string[], severity?: string, duration?: string) {
  const hasBreathingIssue = symptomsLower.some((s) => s.includes('breath'));
  const hasSwallowIssue = symptomsLower.some((s) => s.includes('swallow'));
  const hasFever = symptomsLower.some((s) => s.includes('fever'));
  const hasSwelling = symptomsLower.some((s) => s.includes('swell'));
  const hasBleeding = symptomsLower.some((s) => s.includes('bleed'));
  const hasTrauma = symptomsLower.some((s) => s.includes('trauma') || s.includes('injury') || s.includes('broken'));
  const severePain = severity === 'severe';
  const durationDays = parseDurationDays(duration);

  const prolongedSeverePain = severePain && durationDays !== null && durationDays >= 2;

  const redFlag =
    hasBreathingIssue ||
    hasSwallowIssue ||
    (hasFever && hasSwelling) ||
    hasTrauma ||
    hasBleeding ||
    prolongedSeverePain;

  return { redFlag, hasBreathingIssue, hasSwallowIssue, hasFever, hasSwelling, hasBleeding, hasTrauma, prolongedSeverePain };
}

function calculateUrgencyScore(symptoms: any, severity?: string, duration?: string): { score: number; redFlag: boolean } {
  let score = 0;

  // Handle array format
  if (Array.isArray(symptoms)) {
    const symptomsLower = symptoms.map((s: string) => s.toLowerCase());
    const { redFlag, hasFever, hasSwelling, hasBleeding, hasTrauma, hasBreathingIssue, hasSwallowIssue, prolongedSeverePain } =
      detectRedFlags(symptomsLower, severity, duration);

    // Base severity for pain-related symptoms
    if (symptomsLower.some((s: string) => s.includes('pain') || s.includes('ache') || s.includes('toothache'))) {
      if (severity === 'severe') score += 35;
      else if (severity === 'moderate') score += 20;
      else if (severity === 'mild') score += 10;
      else score += 8;
    }

    // Swelling/facial swelling
    if (symptomsLower.some((s: string) => s.includes('swell'))) {
      score += 15;
    }

    // Fever
    if (hasFever) score += 15;

    // Bleeding
    if (hasBleeding) score += 20;

    // Trauma (broken tooth, injury)
    if (hasTrauma) score += 25;

    // Breathing/Swallowing difficulty
    if (hasBreathingIssue) score = Math.max(score, 85);
    if (hasSwallowIssue) score = Math.max(score, 80);

    // Fever + swelling combination escalates
    if (hasFever && hasSwelling) {
      score = Math.max(score, 80);
    }

    // Prolonged severe pain
    if (prolongedSeverePain) {
      score = Math.max(score, 70);
    }

    // Recent onset but acute
    const durationDays = parseDurationDays(duration);
    if (durationDays !== null && durationDays <= 1 && severity === 'severe') {
      score += 5;
    }

    // Cap at 100
    score = Math.min(score, 100);
    return { score, redFlag };
  }

  // Object format (legacy)
  if (symptoms.painLevel) {
    score += parseInt(symptoms.painLevel) * 2;
  }

  if (symptoms.bleeding === 'severe') score += 20;
  else if (symptoms.bleeding === 'moderate') score += 10;
  else if (symptoms.bleeding === 'mild') score += 5;

  if (symptoms.swelling === 'severe') score += 15;
  else if (symptoms.swelling === 'moderate') score += 8;

  if (symptoms.fever) score += 15;

  if (symptoms.difficultyBreathing) score += 25;
  if (symptoms.difficultySwallowing) score += 20;

  if (symptoms.trauma) score += 15;

  score = Math.min(score, 100);
  const redFlag =
    symptoms.difficultyBreathing ||
    symptoms.difficultySwallowing ||
    symptoms.trauma ||
    symptoms.bleeding === 'severe' ||
    symptoms.swelling === 'severe';

  return { score, redFlag };
}

function generateRecommendations(urgencyScore: number, redFlag: boolean): string {
  if (redFlag || urgencyScore >= 80) {
    return 'URGENT: Seek immediate emergency dental or medical care (ER/urgent care).';
  } else if (urgencyScore >= 60) {
    return 'HIGH PRIORITY: Book an urgent dental visit within 24 hours.';
  } else if (urgencyScore >= 40) {
    return 'MODERATE: Schedule a dental appointment in the next 2-3 days.';
  } else {
    return 'LOW PRIORITY: Monitor at home and schedule a routine visit when convenient.';
  }
}

export async function OPTIONS(req: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, req);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userIdParam = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');
    
    // Try to get user from auth token
    let userId: number | null = null;
    try {
      const user = requireAuth(req);
      userId = user.id;
    } catch (authError) {
      // If no auth, use userId from query params if provided
      if (userIdParam) {
        userId = parseInt(userIdParam);
      }
    }

    let queryStr = 'SELECT * FROM symptom_assessments WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (userId) {
      queryStr += ` AND user_id = $${paramIndex++}`;
      params.push(userId);
    }

    if (sessionId) {
      queryStr += ` AND session_id = $${paramIndex++}`;
      params.push(sessionId);
    }

    queryStr += ' ORDER BY created_at DESC';

    const result = await query(queryStr, params);

    const assessments = result.rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      sessionId: row.session_id,
      symptoms: typeof row.symptoms === 'string' ? JSON.parse(row.symptoms) : row.symptoms,
      urgencyScore: row.urgency_score,
      triageResult: row.triage_result,
      recommendations: row.recommendations,
      createdAt: row.created_at,
    }));

    const response = NextResponse.json({
      success: true,
      data: { assessments },
    });

    return addCorsHeaders(response, req);
  } catch (error: any) {
    logger.error('Error fetching symptom assessments', error);
    const errorResponse = NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Failed to fetch symptom assessments' 
      },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, req);
  }
}

export async function POST(req: NextRequest) {
  try {
    // Try to get user from auth token, but don't require it (allow anonymous assessments)
    let userId: number | null = null;
    try {
      const user = requireAuth(req);
      userId = user.id;
    } catch (authError) {
      // Allow anonymous assessments
      logger.info('Anonymous symptom assessment');
    }

    const body = await req.json();
    const data = symptomAssessmentSchema.parse(body);
    const sessionId = data.sessionId || generateSessionId();
    
    // Use userId from auth token if available, otherwise from body
    const finalUserId = userId || data.userId || null;

    // Convert array format to object format for storage if needed
    let symptomsData = data.symptoms;
    if (Array.isArray(data.symptoms)) {
      // Convert array to object format for better storage
      symptomsData = {
        symptomsList: data.symptoms,
        severity: data.severity,
        duration: data.duration,
        location: data.location,
        additionalInfo: data.additionalInfo,
      };
    } else {
      // Merge additional fields if provided
      if (data.severity) symptomsData.severity = data.severity;
      if (data.duration) symptomsData.duration = data.duration;
      if (data.location) symptomsData.location = data.location;
      if (data.additionalInfo) symptomsData.additionalInfo = data.additionalInfo;
    }

    const { score: urgencyScore, redFlag } = calculateUrgencyScore(data.symptoms, data.severity, data.duration);
    const recommendations = generateRecommendations(urgencyScore, redFlag);
    const triageResult = redFlag
      ? 'urgent'
      : urgencyScore >= 70
      ? 'urgent'
      : urgencyScore >= 50
      ? 'high'
      : urgencyScore >= 30
      ? 'moderate'
      : 'low';

    const result = await query(
      `INSERT INTO symptom_assessments 
       (user_id, session_id, symptoms, urgency_score, recommendations, triage_result)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        finalUserId,
        sessionId,
        JSON.stringify(symptomsData),
        urgencyScore,
        recommendations,
        triageResult,
      ]
    );

    logger.info('Symptom assessment created', { id: result.rows[0].id, urgencyScore });

    const response = NextResponse.json({
      success: true,
      data: {
        assessment: {
          id: result.rows[0].id,
          sessionId: result.rows[0].session_id,
          urgencyScore: result.rows[0].urgency_score,
          triageResult: result.rows[0].triage_result,
          recommendations: result.rows[0].recommendations,
        },
      },
    }, { status: 201 });

    return addCorsHeaders(response, req);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      logger.error('Validation error', error);
      const errorResponse = NextResponse.json(
        { 
          success: false, 
          error: error.errors[0].message,
          details: error.errors 
        },
        { status: 400 }
      );
      return addCorsHeaders(errorResponse, req);
    }

    logger.error('Symptom assessment error', error as Error);
    const errorResponse = NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Failed to process symptom assessment',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, req);
  }
}

