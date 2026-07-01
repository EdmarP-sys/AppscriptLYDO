import { google } from 'googleapis';
import { Readable } from 'stream';

export function getGoogleAuth() {
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!email || !privateKey) {
    return null; // Return null so we can check it gracefully
  }

  return new google.auth.JWT(
    email,
    null,
    privateKey,
    [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/spreadsheets'
    ]
  );
}

// Helper to ensure Supabase Storage Bucket exists
async function ensureSupabaseBucket() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return;

  try {
    const cleanUrl = supabaseUrl.replace(/\/$/, '');
    await fetch(`${cleanUrl}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: 'lydo-documents', name: 'lydo-documents', public: true })
    });
  } catch (err) {
    // Ignore error if the bucket already exists
  }
}

export async function getOrCreateSubfolder(folderName, parentFolderId) {
  // If using Supabase Storage, folders are virtual paths, so just return the path prefix name
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return folderName;
  }

  const auth = getGoogleAuth();
  if (!auth) {
    throw new Error('Google Auth credentials are not configured.');
  }

  const drive = google.drive({ version: 'v3', auth });
  const q = `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName.replace(/'/g, "\\'")}' and '${parentFolderId}' in parents and trashed = false`;
  const listRes = await drive.files.list({
    q,
    fields: 'files(id, name)',
    spaces: 'drive'
  });

  if (listRes.data.files && listRes.data.files.length > 0) {
    return listRes.data.files[0].id;
  }

  const fileMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [parentFolderId]
  };

  const createRes = await drive.files.create({
    requestBody: fileMetadata,
    fields: 'id'
  });

  return createRes.data.id;
}

export async function uploadFileToDrive({ base64Data, fileName, mimeType, folderId }) {
  // Redirect to Supabase Storage if configured
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)?.replace(/\/$/, '');
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    await ensureSupabaseBucket();

    // Clean base64 and convert to Buffer
    const base64Clean = base64Data.replace(/^data:.*;base64,/, '');
    const buffer = Buffer.from(base64Clean, 'base64');

    // Virtual path prefix (e.g. folderId/fileName)
    const filePath = folderId ? `${folderId}/${fileName}` : fileName;

    const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/lydo-documents/${filePath}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': mimeType || 'application/pdf',
        'x-upsert': 'true'
      },
      body: buffer
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`Supabase Storage upload failed: ${errText}`);
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/lydo-documents/${filePath}`;
    return {
      fileId: filePath, // use virtual filePath as unique ID
      url: publicUrl
    };
  }

  // Fallback to Google Drive
  const auth = getGoogleAuth();
  if (!auth) {
    throw new Error('Google Auth credentials are not configured.');
  }

  const drive = google.drive({ version: 'v3', auth });
  const buffer = Buffer.from(base64Data, 'base64');
  const bufferStream = new Readable();
  bufferStream.push(buffer);
  bufferStream.push(null);

  const fileMetadata = {
    name: fileName,
    parents: folderId ? [folderId] : []
  };

  const media = {
    mimeType: mimeType || 'application/octet-stream',
    body: bufferStream
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id, webViewLink'
  });

  const fileId = response.data.id;
  const webViewLink = response.data.webViewLink;

  try {
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });
  } catch (err) {
    console.warn('Warning: Could not set sharing permission on Google Drive file:', err.message);
  }

  return { fileId, url: webViewLink };
}

export async function deleteFileFromDrive(fileId) {
  // Supabase delete
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)?.replace(/\/$/, '');
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const deleteRes = await fetch(`${supabaseUrl}/storage/v1/object/lydo-documents`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prefixes: [fileId] })
    });

    if (!deleteRes.ok) {
      const errText = await deleteRes.text();
      console.error(`Supabase file delete error: ${errText}`);
    }
    return;
  }

  // Google Drive delete
  const auth = getGoogleAuth();
  if (!auth) return;
  const drive = google.drive({ version: 'v3', auth });
  await drive.files.delete({ fileId });
}

export async function moveFileInDrive(fileId, targetFolderId) {
  // Supabase move/rename
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)?.replace(/\/$/, '');
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const fileName = fileId.split('/').pop();
    const newPath = `${targetFolderId}/${fileName}`;

    // 1. Copy to new path
    const copyRes = await fetch(`${supabaseUrl}/storage/v1/object/copy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from_bucket: 'lydo-documents',
        to_bucket: 'lydo-documents',
        source_key: fileId,
        destination_key: newPath
      })
    });

    if (!copyRes.ok) {
      const errText = await copyRes.text();
      throw new Error(`Supabase file move copy failed: ${errText}`);
    }

    // 2. Delete old path
    await deleteFileFromDrive(fileId);
    return;
  }

  // Google Drive move
  const auth = getGoogleAuth();
  if (!auth) return;
  const drive = google.drive({ version: 'v3', auth });
  
  const file = await drive.files.get({
    fileId: fileId,
    fields: 'parents'
  });
  const previousParents = file.data.parents?.join(',') || '';

  await drive.files.update({
    fileId: fileId,
    addParents: targetFolderId,
    removeParents: previousParents,
    fields: 'id, parents'
  });
}

export async function appendRowToSheet({ spreadsheetId, range, values }) {
  const auth = getGoogleAuth();
  if (!auth) {
    console.warn('Google Sheet log skipped: Credentials not configured.');
    return;
  }

  const sheets = google.sheets({ version: 'v4', auth });
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [values]
    }
  });
}
