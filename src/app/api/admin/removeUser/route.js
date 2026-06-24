import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '../../_utils/session';
import { query } from '../../_utils/db';

export async function POST(req) {
  try {
    const session = getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'ACCESS_DENIED: Admin permissions required.' }, { status: 403 });
    }

    const { targetUsername } = await req.json();

    if (!targetUsername) {
      return NextResponse.json({ error: 'Target username is required.' }, { status: 400 });
    }

    const cleanedTarget = targetUsername.toLowerCase().trim();

    // Check if target exists
    const userRes = await query('SELECT role FROM users WHERE username = $1', [cleanedTarget]);
    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }
    const targetUser = userRes.rows[0];

    // Prevent deleting the last admin
    if (targetUser.role === 'admin') {
      const adminCountRes = await query("SELECT COUNT(*)::int as count FROM users WHERE role = 'admin'");
      if (adminCountRes.rows[0].count <= 1) {
        return NextResponse.json({ error: 'Cannot delete the only remaining admin account.' }, { status: 400 });
      }
    }

    // Delete user
    await query('DELETE FROM users WHERE username = $1', [cleanedTarget]);

    // Audit log
    await query(
      `INSERT INTO audit_logs (actor, action, details) VALUES ($1, $2, $3)`,
      [session.username, 'USER_DELETED', `Admin deleted user account: ${cleanedTarget}`]
    );

    return NextResponse.json({ success: true, message: `🗑️ User "${cleanedTarget}" deleted successfully.` });
  } catch (err) {
    console.error('removeUser API error:', err);
    return NextResponse.json({ error: 'Failed to delete user.' }, { status: 500 });
  }
}
