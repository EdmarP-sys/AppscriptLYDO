import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '../../_utils/session';
import { query } from '../../_utils/db';

export async function GET(req) {
  try {
    const session = getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'ACCESS_DENIED: Admin permissions required.' }, { status: 403 });
    }

    const res = await query(
      'SELECT id, timestamp, actor, action, details FROM audit_logs ORDER BY timestamp DESC LIMIT 500'
    );

    return NextResponse.json(res.rows);
  } catch (err) {
    console.error('getAuditLogs API error:', err);
    return NextResponse.json({ error: 'Failed to load audit logs.' }, { status: 500 });
  }
}
