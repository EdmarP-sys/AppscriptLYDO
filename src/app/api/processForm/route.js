import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '../_utils/session';
import { query } from '../_utils/db';
import { uploadFileToDrive, getOrCreateSubfolder } from '../_utils/auth';

const ROOT_FOLDER_ID = process.env.ROOT_FOLDER_ID || '1X3XPOwWTEuZdOHW6CJLfUpZG1FI15CEb';
const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB limit

export async function POST(req) {
  try {
    // 1. Session verification
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'AUTH_EXPIRED: Your session has expired. Please log in again.' }, { status: 401 });
    }

    // 2. Parse form body
    const body = await req.json();
    const { fileData, fileName, mimeType, category, subCategory, userType } = body;

    if (!fileData || !fileName) {
      return NextResponse.json({ error: 'No file received. Please attach a document and try again.' }, { status: 400 });
    }

    // Enforce role-based limits
    if (session.role === 'SK') {
      if (userType !== 'SK' || subCategory !== session.barangay) {
        return NextResponse.json({ error: `ACCESS_DENIED: You may only upload documents for ${session.barangay}.` }, { status: 403 });
      }
    } else if (session.role === 'LYDC') {
      if (userType !== 'LYDC' || subCategory !== session.barangay) {
        return NextResponse.json({ error: `ACCESS_DENIED: You may only upload documents for your registered center: ${session.barangay}.` }, { status: 403 });
      }
    }

    // 3. File size validation
    const fileBuffer = Buffer.from(fileData, 'base64');
    if (fileBuffer.length > MAX_FILE_BYTES) {
      return NextResponse.json({ error: `FILE_TOO_LARGE: Maximum file size is ${MAX_FILE_BYTES / 1024 / 1024} MB.` }, { status: 400 });
    }

    // 4. Resolve folder target
    const isPending = session.role !== 'admin';
    let targetFolderId;

    if (isPending) {
      // Goes to [PENDING_APPROVALS] folder
      targetFolderId = await getOrCreateSubfolder('[PENDING_APPROVALS]', ROOT_FOLDER_ID);
    } else {
      // Goes directly to destination
      if (userType === 'SK') {
        targetFolderId = await getOrCreateSubfolder(subCategory, ROOT_FOLDER_ID);
      } else if (userType === 'LYDO') {
        targetFolderId = await getOrCreateSubfolder('LYDO', ROOT_FOLDER_ID);
      } else { // LYDC
        const lydcParentId = await getOrCreateSubfolder('LYDC', ROOT_FOLDER_ID);
        targetFolderId = await getOrCreateSubfolder(subCategory, lydcParentId);
      }
    }

    // 5. Upload file to Google Drive
    const driveUpload = await uploadFileToDrive({
      base64Data: fileData,
      fileName: fileName,
      mimeType: mimeType,
      folderId: targetFolderId
    });

    const status = isPending ? 'Pending' : 'Approved';
    const finalDestFunc = (userType === 'SK' || userType === 'LYDO') ? 'getOrCreateSubfolder_' : 'getOrCreateLYDCCenterFolder_';
    const finalDestArg = (userType === 'LYDO') ? 'LYDO' : subCategory;

    // 6. Save in Supabase documents table
    await query(
      `INSERT INTO documents (
        file_id, file_name, file_url, category, sub_category, 
        user_type, uploaded_by, is_pending, status, final_dest_func, final_dest_arg
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        driveUpload.fileId,
        fileName,
        driveUpload.url,
        category || 'General',
        subCategory,
        userType,
        session.username,
        isPending,
        status,
        finalDestFunc,
        finalDestArg
      ]
    );

    // 7. Log audit entry
    const destName = isPending ? 'Pending Approvals Queue' : subCategory;
    await query(
      `INSERT INTO audit_logs (actor, action, details) VALUES ($1, $2, $3)`,
      [
        session.username,
        'FILE_UPLOAD',
        `File: "${fileName}" uploaded to ${destName} | Status: ${status}`
      ]
    );

    return NextResponse.json({
      success: true,
      message: `✅ "${fileName}" uploaded successfully to ${destName} ` + 
               (isPending ? 'and is awaiting admin approval.' : '.')
    });

  } catch (err) {
    console.error('processForm API error:', err);
    return NextResponse.json({ error: 'Failed to process document upload.' }, { status: 500 });
  }
}
