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
      `SELECT username, role, barangay, display_name as "displayName", created_at as "createdAt"
       FROM users 
       ORDER BY created_at DESC`
    );

    return NextResponse.json(res.rows);
  } catch (err) {
    console.error('listUsers API error:', err);
    return NextResponse.json({ error: 'Failed to list users.' }, { status: 500 });
  }
}
