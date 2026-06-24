import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '../_utils/session';
import { query } from '../_utils/db';
import { moveFileInDrive, getOrCreateSubfolder } from '../_utils/auth';

const ROOT_FOLDER_ID = process.env.ROOT_FOLDER_ID || '1X3XPOwWTEuZdOHW6CJLfUpZG1FI15CEb';

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

    // Resolve target Google Drive folder
    let targetFolderId;
    if (doc.user_type === 'SK') {
      targetFolderId = await getOrCreateSubfolder(doc.sub_category, ROOT_FOLDER_ID);
    } else if (doc.user_type === 'LYDO') {
      targetFolderId = await getOrCreateSubfolder('LYDO', ROOT_FOLDER_ID);
    } else { // LYDC
      const lydcParentId = await getOrCreateSubfolder('LYDC', ROOT_FOLDER_ID);
      targetFolderId = await getOrCreateSubfolder(doc.sub_category, lydcParentId);
    }

    // Move file in Google Drive
    await moveFileInDrive(fileId, targetFolderId);

    // Update status in database
    await query("UPDATE documents SET status = 'Approved' WHERE file_id = $1", [fileId]);

    // Add audit trail log
    await query(
      `INSERT INTO audit_logs (actor, action, details) VALUES ($1, $2, $3)`,
      [
        session.username,
        'FILE_APPROVED',
        `Approved document: "${doc.file_name}" and moved it to ${doc.sub_category} folder`
      ]
    );

    return NextResponse.json({ success: true, message: `✅ Document "${doc.file_name}" approved successfully.` });
  } catch (err) {
    console.error('approveDocument API error:', err);
    return NextResponse.json({ error: 'Failed to approve document.' }, { status: 500 });
  }
}
