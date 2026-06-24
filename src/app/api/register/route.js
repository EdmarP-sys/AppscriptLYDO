import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '../_utils/db';

export async function POST(req) {
  try {
    const { username, password, displayName, barangay } = await req.json();

    if (!username || !password || !displayName || !barangay) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    const cleanedUsername = username.toLowerCase().trim();

    // Check if username is taken
    const checkRes = await query('SELECT username FROM users WHERE username = $1', [cleanedUsername]);
    if (checkRes.rows.length > 0) {
      return NextResponse.json({ error: 'Username is already taken.' }, { status: 400 });
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user into DB
    await query(
      `INSERT INTO users (username, password_hash, role, barangay, display_name)
       VALUES ($1, $2, $3, $4, $5)`,
      [cleanedUsername, passwordHash, 'scholar', barangay, displayName]
    );

    // Add audit log
    await query(
      `INSERT INTO audit_logs (actor, action, details) VALUES ($1, $2, $3)`,
      [cleanedUsername, 'USER_REGISTER', `Scholar self-registered: ${cleanedUsername} from Barangay ${barangay}`]
    );

    return NextResponse.json({ success: true, message: 'Registration successful! You can now log in.' });
  } catch (err) {
    console.error('Registration API error:', err);
    return NextResponse.json({ error: 'Failed to complete registration.' }, { status: 500 });
  }
}
