import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '../_utils/session';
import { query } from '../_utils/db';
import { deleteFileFromDrive } from '../_utils/auth';

export async function POST(req) {
  try {
    const session = getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'ACCESS_DENIED: Admin permissions required.' }, { status: 403 });
    }

    const { fileId } = await req.json();

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required.' }, { status: 400 });
    }

    // Fetch document details
    const docRes = await query('SELECT * FROM documents WHERE file_id = $1', [fileId]);
    if (docRes.rows.length === 0) {
      return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
    }
    const doc = docRes.rows[0];

    // Delete file from Google Drive
    try {
      await deleteFileFromDrive(fileId);
    } catch (driveErr) {
      console.error('Google Drive file deletion failed:', driveErr.message);
      // Continue to delete from DB anyway to avoid hanging records
    }

    // Delete document row in database
    await query('DELETE FROM documents WHERE file_id = $1', [fileId]);

    // Audit log entry
    await query(
      `INSERT INTO audit_logs (actor, action, details) VALUES ($1, $2, $3)`,
      [
        session.username,
        'FILE_REJECTED',
        `Rejected and deleted document: "${doc.file_name}" from ${doc.sub_category}`
      ]
    );

    return NextResponse.json({ success: true, message: `❌ Document "${doc.file_name}" has been rejected and deleted.` });
  } catch (err) {
    console.error('rejectDocument API error:', err);
    return NextResponse.json({ error: 'Failed to reject document.' }, { status: 500 });
  }
}
