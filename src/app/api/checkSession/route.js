import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '../_utils/session';

export async function GET(req) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ authenticated: false, error: 'No active session or session expired.' }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, user: session });
}
