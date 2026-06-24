import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '../_utils/session';
import { query } from '../_utils/db';

export async function POST(req) {
  try {
    const session = getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'ACCESS_DENIED: Admin permissions required.' }, { status: 403 });
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Deadline ID is required.' }, { status: 400 });
    }

    const dlRes = await query('SELECT title FROM deadlines WHERE id = $1', [id]);
    if (dlRes.rows.length === 0) {
      return NextResponse.json({ error: 'Deadline not found.' }, { status: 404 });
    }
    const title = dlRes.rows[0].title;

    // Delete
    await query('DELETE FROM deadlines WHERE id = $1', [id]);

    // Audit log
    await query(
      `INSERT INTO audit_logs (actor, action, details) VALUES ($1, $2, $3)`,
      [session.username, 'DEADLINE_DELETED', `Admin deleted deadline: "${title}"`]
    );

    return NextResponse.json({ success: true, message: 'Deadline deleted successfully.' });
  } catch (err) {
    console.error('adminDeleteDeadline API error:', err);
    return NextResponse.json({ error: 'Failed to delete deadline.' }, { status: 500 });
  }
}
