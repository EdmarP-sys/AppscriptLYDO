import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '../../_utils/session';
import { query } from '../../_utils/db';

export async function GET(req) {
  try {
    const session = getSessionFromRequest(req);
    if (!session || (session.role !== 'admin' && session.role !== 'LYDC' && session.role !== 'encoder')) {
      return NextResponse.json({ error: 'ACCESS_DENIED: Restricted access.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const barangay = searchParams.get('barangay');
    const status = searchParams.get('status');

    let sql = 'SELECT * FROM scholar_applications WHERE 1=1';
    const params = [];

    if (barangay && barangay !== 'All') {
      params.push(barangay);
      sql += ` AND barangay = $${params.length}`;
    }

    if (status && status !== 'All') {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }

    sql += ' ORDER BY date_filed DESC';

    const res = await query(sql, params);
    return NextResponse.json(res.rows);
  } catch (err) {
    console.error('listApplications API error:', err);
    return NextResponse.json({ error: 'Failed to retrieve applications.' }, { status: 500 });
  }
}
