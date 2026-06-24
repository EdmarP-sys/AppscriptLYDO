import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev-only-change-in-env';

export function signSession(payload) {
  // Session expires in 12 hours
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
}

export function verifySession(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Session verification failed:', error.message);
    return null;
  }
}

export function getSessionFromRequest(req) {
  try {
    // Check Authorization header first
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      return verifySession(token);
    }

    // Check cookie
    const cookieHeader = req.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => c.trim().split('='))
    );
    const sessionToken = cookies['session_token'];
    if (sessionToken) {
      return verifySession(sessionToken);
    }
  } catch (err) {
    console.error('Error getting session from request:', err.message);
  }
  return null;
}
