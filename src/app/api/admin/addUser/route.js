import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSessionFromRequest } from '../../_utils/session';
import { query } from '../../_utils/db';

export async function POST(req) {
  try {
    const session = getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'ACCESS_DENIED: Admin permissions required.' }, { status: 403 });
    }

    const { username, password, role, barangay, displayName } = await req.json();

    if (!username || !password || !role || !displayName) {
      return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 });
    }

    const cleanedUsername = username.toLowerCase().trim();

    // Check if user exists
    const checkRes = await query('SELECT username FROM users WHERE username = $1', [cleanedUsername]);
    if (checkRes.rows.length > 0) {
      return NextResponse.json({ error: 'Username is already taken.' }, { status: 400 });
    }

    // Password length validation
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    await query(
      `INSERT INTO users (username, password_hash, role, barangay, display_name)
       VALUES ($1, $2, $3, $4, $5)`,
      [cleanedUsername, passwordHash, role, (role === 'SK' || role === 'scholar') ? barangay : null, displayName]
    );

    // Audit log
    await query(
      `INSERT INTO audit_logs (actor, action, details) VALUES ($1, $2, $3)`,
      [session.username, 'USER_CREATED', `Admin created user: ${cleanedUsername} | Role: ${role}`]
    );

    return NextResponse.json({ success: true, message: `✅ User "${cleanedUsername}" created successfully.` });
  } catch (err) {
    console.error('addUser API error:', err);
    return NextResponse.json({ error: 'Failed to create user.' }, { status: 500 });
  }
}
