import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '../_utils/db';
import { signSession } from '../_utils/session';

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 });
    }

    const cleanedUsername = username.toLowerCase().trim();

    // Query user
    const res = await query('SELECT * FROM users WHERE username = $1', [cleanedUsername]);
    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
    }

    const user = res.rows[0];

    // Check password
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      await query('INSERT INTO audit_logs (actor, action, details) VALUES ($1, $2, $3)', [
        cleanedUsername,
        'LOGIN_FAILED',
        'Invalid password attempt'
      ]);
      return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
    }

    // Sign session
    const payload = {
      username: user.username,
      role: user.role,
      barangay: user.barangay,
      display_name: user.display_name
    };
    const token = signSession(payload);

    // Audit log
    await query('INSERT INTO audit_logs (actor, action, details) VALUES ($1, $2, $3)', [
      user.username,
      'LOGIN',
      `User ${user.username} logged in as ${user.role}`
    ]);

    const response = NextResponse.json({
      success: true,
      token,
      user: payload
    });

    response.cookies.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 12 * 60 * 60, // 12 hours
      path: '/'
    });

    return response;
  } catch (err) {
    console.error('Login API error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
