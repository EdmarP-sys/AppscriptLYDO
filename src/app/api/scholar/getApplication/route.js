import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '../../_utils/session';
import { query } from '../../_utils/db';

export async function GET(req) {
  try {
    const session = getSessionFromRequest(req);
    if (!session || session.role !== 'scholar') {
      return NextResponse.json({ error: 'AUTH_EXPIRED: Please log in again.' }, { status: 401 });
    }

    const res = await query('SELECT * FROM scholar_applications WHERE username = $1', [session.username]);

    if (res.rows.length === 0) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({ found: true, application: res.rows[0] });
  } catch (err) {
    console.error('getApplication API error:', err);
    return NextResponse.json({ error: 'Failed to fetch application data.' }, { status: 500 });
  }
}
