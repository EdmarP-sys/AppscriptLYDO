import { google } from 'googleapis';
import { Readable } from 'stream';

export function getGoogleAuth() {
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!email || !privateKey) {
    throw new Error('GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY environment variables are missing.');
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

export async function getOrCreateSubfolder(folderName, parentFolderId) {
  const auth = getGoogleAuth();
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
  const auth = getGoogleAuth();
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
  const auth = getGoogleAuth();
  const drive = google.drive({ version: 'v3', auth });
  await drive.files.delete({ fileId });
}

export async function moveFileInDrive(fileId, targetFolderId) {
  const auth = getGoogleAuth();
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
