import { NextResponse } from 'next/server';
import { query } from '../_utils/db';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const entity = searchParams.get('entity');

    if (!entity) {
      return NextResponse.json({ error: 'Entity parameter is required.' }, { status: 400 });
    }

    let entities = [entity];
    if (entity === 'Active Citizenship' || entity === 'Active Citizen') {
      entities = ['Active Citizen', 'Active Citizenship'];
    }

    const res = await query(
      `SELECT file_id as "fileId", file_name as "name", file_url as "url", 
              category, sub_category as "subCategory", user_type as "userType", 
              uploaded_by as "uploadedBy", created_at as "date"
       FROM documents 
       WHERE sub_category = ANY($1) AND status = 'Approved'
       ORDER BY created_at DESC`,
      [entities]
    );

    return NextResponse.json(res.rows);
  } catch (err) {
    console.error('getDocuments API error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
