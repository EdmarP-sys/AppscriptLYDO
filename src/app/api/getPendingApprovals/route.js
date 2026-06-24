import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '../_utils/session';
import { query } from '../_utils/db';

export async function GET(req) {
  try {
    const session = getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'ACCESS_DENIED: Admin permissions required.' }, { status: 403 });
    }

    const res = await query(
      `SELECT file_id as "fileId", file_name as "name", file_url as "url", 
              category, sub_category as "subCategory", user_type as "userType", 
              uploaded_by as "uploadedBy", created_at as "date"
       FROM documents
       WHERE status = 'Pending'
       ORDER BY created_at DESC`
    );

    return NextResponse.json(res.rows);
  } catch (err) {
    console.error('getPendingApprovals API error:', err);
    return NextResponse.json({ error: 'Failed to retrieve pending approvals.' }, { status: 500 });
  }
}
