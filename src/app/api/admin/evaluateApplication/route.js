import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '../../_utils/session';
import { query } from '../../_utils/db';

export async function POST(req) {
  try {
    const session = getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'ACCESS_DENIED: Admin permissions required.' }, { status: 403 });
    }

    const {
      id,
      scoreAcademic,
      scoreSocioEconomic,
      scoreLeadership,
      scoreInterview,
      scoreSpecialCircumstances,
      evaluatorRemarks,
      status
    } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ error: 'Application ID and status are required.' }, { status: 400 });
    }

    const total = 
      Number(scoreAcademic || 0) + 
      Number(scoreSocioEconomic || 0) + 
      Number(scoreLeadership || 0) + 
      Number(scoreInterview || 0) + 
      Number(scoreSpecialCircumstances || 0);

    const appRes = await query('SELECT username, last_name, first_name FROM scholar_applications WHERE id = $1', [id]);
    if (appRes.rows.length === 0) {
      return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
    }
    const app = appRes.rows[0];

    // Update in Supabase
    await query(
      `UPDATE scholar_applications
       SET 
         score_academic = $1,
         score_socio_economic = $2,
         score_leadership = $3,
         score_interview = $4,
         score_special_circumstances = $5,
         score_total = $6,
         evaluator_remarks = $7,
         status = $8,
         evaluated_by = $9,
         evaluated_at = CURRENT_TIMESTAMP
       WHERE id = $10`,
      [
        Number(scoreAcademic || 0),
        Number(scoreSocioEconomic || 0),
        Number(scoreLeadership || 0),
        Number(scoreInterview || 0),
        Number(scoreSpecialCircumstances || 0),
        total,
        evaluatorRemarks,
        status,
        session.username,
        id
      ]
    );

    // Audit trail log
    await query(
      `INSERT INTO audit_logs (actor, action, details) VALUES ($1, $2, $3)`,
      [
        session.username,
        'SCHOLAR_EVALUATED',
        `Evaluated application of ${app.username} (${app.first_name} ${app.last_name}) | Total Score: ${total} | Status: ${status}`
      ]
    );

    return NextResponse.json({ success: true, message: 'Evaluation submitted successfully.' });
  } catch (err) {
    console.error('evaluateApplication API error:', err);
    return NextResponse.json({ error: 'Failed to submit evaluation.' }, { status: 500 });
  }
}
