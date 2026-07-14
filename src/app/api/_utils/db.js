import { Pool } from 'pg';

let pool = null;

function parseConnectionString(url) {
  try {
    const cleanUrl = url.split('?')[0];
    const matches = cleanUrl.match(/postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (!matches) return null;
    return {
      user: decodeURIComponent(matches[1]),
      password: decodeURIComponent(matches[2]),
      host: matches[3],
      port: parseInt(matches[4], 10),
      database: matches[5]
    };
  } catch (err) {
    return null;
  }
}

function getPool() {
  if (!pool) {
    const url = process.env.DATABASE_URL || '';
    if (!url || url.includes('[PASSWORD]') || url.includes('[PROJECT_ID]')) {
      throw new Error('DATABASE_URL is a placeholder.');
    }

    if (!global._postgresPool) {
      const parsedConfig = parseConnectionString(url);
      if (parsedConfig) {
        global._postgresPool = new Pool({
          ...parsedConfig,
          ssl: {
            rejectUnauthorized: false
          }
        });
      } else {
        const cleanUrl = url.split('?')[0];
        global._postgresPool = new Pool({
          connectionString: cleanUrl,
          ssl: {
            rejectUnauthorized: false
          }
        });
      }
    }
    pool = global._postgresPool;
  }
  return pool;
}

// ==========================================
//  OFFLINE IN-MEMORY MOCK DATABASE ENGINE
// ==========================================
let mockUsers = [
  { username: 'admin', password_hash: '$2b$10$pxBfx8kWYuOrntklVC1Dxefc9LqE/1FDx3JCYORQkt4mbT6YE9.8.', role: 'admin', display_name: 'System Administrator', barangay: null, created_at: new Date().toISOString() },
  { username: 'scholar', password_hash: '$2b$10$pxBfx8kWYuOrntklVC1Dxefc9LqE/1FDx3JCYORQkt4mbT6YE9.8.', role: 'scholar', display_name: 'Jane Doe', barangay: 'Atate', created_at: new Date().toISOString() },
  { username: 'sk_atate', password_hash: '$2b$10$pxBfx8kWYuOrntklVC1Dxefc9LqE/1FDx3JCYORQkt4mbT6YE9.8.', role: 'SK', display_name: 'Atate SK Chairman', barangay: 'Atate', created_at: new Date().toISOString() },
  { username: 'encoder1', password_hash: '$2b$10$iui9yCS2fqFFOTsjeBq4Jua1ts9mKHWsKVXvN6SlDGadfaFGCY6wS', role: 'encoder', display_name: 'Encoder 1', barangay: null, created_at: new Date().toISOString() },
  { username: 'encoder2', password_hash: '$2b$10$iui9yCS2fqFFOTsjeBq4Jua1ts9mKHWsKVXvN6SlDGadfaFGCY6wS', role: 'encoder', display_name: 'Encoder 2', barangay: null, created_at: new Date().toISOString() },
  { username: 'encoder3', password_hash: '$2b$10$iui9yCS2fqFFOTsjeBq4Jua1ts9mKHWsKVXvN6SlDGadfaFGCY6wS', role: 'encoder', display_name: 'Encoder 3', barangay: null, created_at: new Date().toISOString() },
  { username: 'encoder4', password_hash: '$2b$10$iui9yCS2fqFFOTsjeBq4Jua1ts9mKHWsKVXvN6SlDGadfaFGCY6wS', role: 'encoder', display_name: 'Encoder 4', barangay: null, created_at: new Date().toISOString() },
  { username: 'encoder5', password_hash: '$2b$10$iui9yCS2fqFFOTsjeBq4Jua1ts9mKHWsKVXvN6SlDGadfaFGCY6wS', role: 'encoder', display_name: 'Encoder 5', barangay: null, created_at: new Date().toISOString() }
];

let mockApplications = [
  {
    id: 'app-1',
    application_no: 'AFS-00001',
    date_filed: new Date(Date.now() - 2*24*60*60*1000).toISOString(),
    student_full_name: 'Jane M. Doe',
    date_of_birth: '2005-08-12',
    sex: 'Female',
    contact_number: '09123456789',
    barangay: 'Atate',
    email: 'jane.doe@example.com',
    school: 'Nueva Ecija University of Science and Technology',
    school_year: '2026-2027',
    is_solo_parent_beneficiary: false,
    is_orphan: false,
    is_pwd: false,
    is_ip: false,
    is_out_of_school_youth: false,
    special_circumstances_specify: '',
    status: 'Approved',
    evaluated_by: 'admin',
    evaluated_at: new Date().toISOString()
  },
  {
    id: 'app-2',
    application_no: 'AFS-00002',
    date_filed: new Date(Date.now() - 1*24*60*60*1000).toISOString(),
    student_full_name: 'John A. Smith',
    date_of_birth: '2004-03-22',
    sex: 'Male',
    contact_number: '09876543210',
    barangay: 'Atate',
    email: 'john.smith@example.com',
    school: 'Central Luzon State University',
    school_year: '2026-2027',
    is_solo_parent_beneficiary: true,
    is_orphan: false,
    is_pwd: false,
    is_ip: false,
    is_out_of_school_youth: false,
    special_circumstances_specify: 'Living with mother who is solo parent',
    status: 'Pending',
    evaluated_by: 'encoder1',
    evaluated_at: new Date().toISOString()
  }
];

let mockDocuments = [
  { file_id: 'doc-1', file_name: 'Resolution_No1_Atate.pdf', file_url: 'https://docs.google.com/viewer?url=https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', category: 'Resolution', sub_category: 'Atate', user_type: 'SK', uploaded_by: 'sk_atate', status: 'Approved', created_at: new Date(Date.now() - 3*24*60*60*1000).toISOString() },
  { file_id: 'doc-2', file_name: 'Accomplishment_Report_Q2.pdf', file_url: 'https://docs.google.com/viewer?url=https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', category: 'Accomplishment Report', sub_category: 'Atate', user_type: 'SK', uploaded_by: 'sk_atate', status: 'Approved', created_at: new Date(Date.now() - 1*24*60*60*1000).toISOString() },
  { file_id: 'doc-3', file_name: 'Pending_Minutes.pdf', file_url: 'https://docs.google.com/viewer?url=https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', category: 'Minutes of Meeting', sub_category: 'Atate', user_type: 'SK', uploaded_by: 'sk_atate', status: 'Pending', created_at: new Date().toISOString() }
];

let mockDeadlines = [
  { id: 'dl-1', title: 'Scholar Grade Sheets Submission', date: new Date(Date.now() + 5*24*60*60*1000).toISOString() },
  { id: 'dl-2', title: 'Barangay SK Annual Budget Report', date: new Date(Date.now() + 12*24*60*60*1000).toISOString() }
];

let mockAuditLogs = [
  { id: 1, timestamp: new Date(Date.now() - 10*60*1000).toISOString(), actor: 'system', action: 'INIT', details: 'Database initialized in offline mock mode.' }
];

function resolveMockQuery(text, params = []) {
  const sql = text.trim().replace(/\s+/g, ' ');
  console.log(`[Offline DB Mock] Resolving Query: ${sql.slice(0, 80)}... with params [${params}]`);

  // 1. SELECT * FROM users WHERE username = $1
  if (sql.includes('SELECT * FROM users WHERE username = $1')) {
    const user = mockUsers.find(u => u.username === params[0].toLowerCase().trim());
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }

  // 2. SELECT username FROM users WHERE username = $1
  if (sql.includes('SELECT username FROM users WHERE username = $1')) {
    const user = mockUsers.find(u => u.username === params[0].toLowerCase().trim());
    return { rows: user ? [{ username: user.username }] : [], rowCount: user ? 1 : 0 };
  }

  // 3. SELECT * FROM users ORDER BY created_at DESC
  if (sql.includes('SELECT username, role, barangay, display_name as "displayName", created_at as "createdAt" FROM users')) {
    const users = mockUsers.map(u => ({
      username: u.username,
      role: u.role,
      barangay: u.barangay,
      displayName: u.display_name,
      createdAt: u.created_at
    }));
    return { rows: users, rowCount: users.length };
  }

  // 4. SELECT * FROM scholar_applications WHERE username = $1
  if (sql.includes('SELECT * FROM scholar_applications WHERE username = $1')) {
    const app = mockApplications.find(a => a.username === params[0]);
    return { rows: app ? [app] : [], rowCount: app ? 1 : 0 };
  }

  // 5. SELECT * FROM scholar_applications WHERE id = $1
  if (sql.includes('SELECT username, last_name, first_name FROM scholar_applications WHERE id = $1')) {
    const app = mockApplications.find(a => a.id === params[0]);
    return { rows: app ? [app] : [], rowCount: app ? 1 : 0 };
  }

  // 6. SELECT * FROM scholar_applications (Admin list filterable by Barangay/Status)
  if (sql.startsWith('SELECT * FROM scholar_applications')) {
    let filtered = [...mockApplications];
    // Simple filter mapping based on parameters
    if (params.length > 0) {
      if (sql.includes('barangay = $1')) {
        filtered = filtered.filter(a => a.barangay === params[0]);
        if (params[1]) {
          filtered = filtered.filter(a => a.status === params[1]);
        }
      } else if (sql.includes('status = $1')) {
        filtered = filtered.filter(a => a.status === params[0]);
      }
    }
    return { rows: filtered, rowCount: filtered.length };
  }

  // 7. SELECT file_id as "fileId" FROM documents WHERE sub_category = ANY($1) AND status = 'Approved'
  if (sql.includes('FROM documents WHERE sub_category = ANY($1) AND status = \'Approved\'')) {
    const searchDirs = params[0] || [];
    const matched = mockDocuments.filter(d => searchDirs.includes(d.sub_category) && d.status === 'Approved');
    const rows = matched.map(d => ({
      fileId: d.file_id,
      name: d.file_name,
      url: d.file_url,
      category: d.category,
      subCategory: d.sub_category,
      userType: d.user_type,
      uploadedBy: d.uploaded_by,
      date: d.created_at
    }));
    return { rows, rowCount: rows.length };
  }

  // 8. SELECT * FROM documents WHERE status = 'Pending'
  if (sql.includes('FROM documents WHERE status = \'Pending\'')) {
    const pending = mockDocuments.filter(d => d.status === 'Pending');
    const rows = pending.map(d => ({
      fileId: d.file_id,
      name: d.file_name,
      url: d.file_url,
      category: d.category,
      subCategory: d.sub_category,
      userType: d.user_type,
      uploadedBy: d.uploaded_by,
      date: d.created_at
    }));
    return { rows, rowCount: rows.length };
  }

  // 9. SELECT * FROM documents WHERE file_id = $1
  if (sql.includes('SELECT * FROM documents WHERE file_id = $1')) {
    const doc = mockDocuments.find(d => d.file_id === params[0]);
    return { rows: doc ? [doc] : [], rowCount: doc ? 1 : 0 };
  }

  // 10. Document aggregate queries
  if (sql.includes("COUNT(*)::int as count FROM documents WHERE status = 'Approved'")) {
    const approved = mockDocuments.filter(d => d.status === 'Approved');
    return { rows: [{ count: approved.length }] };
  }
  if (sql.includes("COUNT(*)::int as count FROM documents WHERE status = 'Pending'")) {
    const pending = mockDocuments.filter(d => d.status === 'Pending');
    return { rows: [{ count: pending.length }] };
  }
  if (sql.includes("category, COUNT(*)::int as count FROM documents WHERE status = 'Approved' GROUP BY category")) {
    const groups = {};
    mockDocuments.filter(d => d.status === 'Approved').forEach(d => {
      groups[d.category] = (groups[d.category] || 0) + 1;
    });
    const rows = Object.entries(groups).map(([category, count]) => ({ category, count }));
    return { rows, rowCount: rows.length };
  }
  if (sql.includes("sub_category, COUNT(*)::int as count, MAX(created_at) as newest FROM documents WHERE status = 'Approved' GROUP BY sub_category")) {
    const groups = {};
    mockDocuments.filter(d => d.status === 'Approved').forEach(d => {
      if (!groups[d.sub_category]) {
        groups[d.sub_category] = { count: 0, newest: d.created_at };
      }
      groups[d.sub_category].count++;
      if (new Date(d.created_at) > new Date(groups[d.sub_category].newest)) {
        groups[d.sub_category].newest = d.created_at;
      }
    });
    const rows = Object.entries(groups).map(([sub_category, info]) => ({
      sub_category,
      count: info.count,
      newest: info.newest
    }));
    return { rows, rowCount: rows.length };
  }

  // 11. SELECT file_id as "fileId" ... FROM documents WHERE status = 'Approved' ORDER BY created_at DESC LIMIT 10
  if (sql.includes('SELECT file_id as "fileId"') && sql.includes('LIMIT 10')) {
    const approved = mockDocuments.filter(d => d.status === 'Approved');
    const sorted = approved.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);
    const rows = sorted.map(d => ({
      fileId: d.file_id,
      name: d.file_name,
      url: d.file_url,
      category: d.category,
      subCategory: d.sub_category,
      uploadedBy: d.uploaded_by,
      date: d.created_at
    }));
    return { rows, rowCount: rows.length };
  }

  // 12. SELECT COUNT(*)::int FROM users WHERE role = 'scholar'
  if (sql.includes("SELECT COUNT(*)::int as count FROM users WHERE role = 'scholar'") || sql.includes("SELECT COUNT(*)::int FROM users WHERE role = 'scholar'")) {
    const scholars = mockUsers.filter(u => u.role === 'scholar');
    return { rows: [{ count: scholars.length }] };
  }

  // 13. Three-Month Trend query (sub_category, month, count)
  if (sql.includes('SELECT sub_category as "subCategory"') && sql.includes("date_trunc('month', created_at) as month")) {
    const groups = {};
    const now = new Date();
    const cutoff = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    
    mockDocuments.filter(d => d.status === 'Approved' && new Date(d.created_at) >= cutoff).forEach(d => {
      const date = new Date(d.created_at);
      const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
      const key = `${d.sub_category}|${firstOfMonth}`;
      groups[key] = (groups[key] || 0) + 1;
    });

    const rows = Object.entries(groups).map(([key, count]) => {
      const [subCategory, month] = key.split('|');
      return { subCategory, month, count };
    });

    return { rows, rowCount: rows.length };
  }

  // 13.5 General Trend Data query (date_trunc)
  if (sql.includes("date_trunc('month', created_at) as month")) {
    // return empty stats or mock trend
    return { rows: [], rowCount: 0 };
  }

  // 14. SELECT id, title, date FROM deadlines ORDER BY date ASC
  if (sql.includes('SELECT id, title, date FROM deadlines')) {
    return { rows: mockDeadlines, rowCount: mockDeadlines.length };
  }

  // 15. SELECT id, timestamp, actor, action, details FROM audit_logs
  if (sql.includes('SELECT id, timestamp, actor, action, details FROM audit_logs')) {
    const sorted = [...mockAuditLogs].sort((a,b) => b.id - a.id);
    return { rows: sorted, rowCount: sorted.length };
  }

  // 16. INSERT INTO users
  if (sql.includes('INSERT INTO users')) {
    const newUser = {
      username: params[0],
      password_hash: params[1],
      role: params[2],
      barangay: params[3],
      display_name: params[4],
      created_at: new Date().toISOString()
    };
    mockUsers.push(newUser);
    return { rows: [], rowCount: 1 };
  }

  // 17. INSERT INTO audit_logs
  if (sql.includes('INSERT INTO audit_logs')) {
    const newLog = {
      id: mockAuditLogs.length + 1,
      timestamp: new Date().toISOString(),
      actor: params[0],
      action: params[1],
      details: params[2]
    };
    mockAuditLogs.push(newLog);
    return { rows: [], rowCount: 1 };
  }

  // 18. INSERT INTO deadlines
  if (sql.includes('INSERT INTO deadlines')) {
    const existingIdx = mockDeadlines.findIndex(d => d.id === params[0]);
    const dl = { id: params[0], title: params[1], date: params[2].toISOString() };
    if (existingIdx !== -1) {
      mockDeadlines[existingIdx] = dl;
    } else {
      mockDeadlines.push(dl);
    }
    return { rows: [], rowCount: 1 };
  }

  // 19. DELETE FROM deadlines WHERE id = $1
  if (sql.includes('DELETE FROM deadlines WHERE id = $1')) {
    mockDeadlines = mockDeadlines.filter(d => d.id !== params[0]);
    return { rows: [], rowCount: 1 };
  }

  // 20. DELETE FROM users WHERE username = $1
  if (sql.includes('DELETE FROM users WHERE username = $1')) {
    mockUsers = mockUsers.filter(u => u.username !== params[0]);
    return { rows: [], rowCount: 1 };
  }

  // 21. INSERT INTO documents
  if (sql.includes('INSERT INTO documents')) {
    const newDoc = {
      file_id: params[0],
      file_name: params[1],
      file_url: params[2],
      category: params[3],
      sub_category: params[4],
      user_type: params[5],
      uploaded_by: params[6],
      status: params[8] || 'Pending',
      created_at: new Date().toISOString()
    };
    mockDocuments.push(newDoc);
    return { rows: [], rowCount: 1 };
  }

  // 22. UPDATE documents SET status = 'Approved' WHERE file_id = $1
  if (sql.includes("UPDATE documents SET status = 'Approved' WHERE file_id = $1")) {
    const doc = mockDocuments.find(d => d.file_id === params[0]);
    if (doc) doc.status = 'Approved';
    return { rows: [], rowCount: 1 };
  }

  // 23. DELETE FROM documents WHERE file_id = $1
  if (sql.includes('DELETE FROM documents WHERE file_id = $1')) {
    mockDocuments = mockDocuments.filter(d => d.file_id !== params[0]);
    return { rows: [], rowCount: 1 };
  }

  // 24. INSERT INTO scholar_applications
  if (sql.includes('INSERT INTO scholar_applications')) {
    const nextVal = mockApplications.length + 1;
    const applicationNo = 'AFS-' + String(nextVal).padStart(5, '0');
    const newApp = {
      id: 'app-' + nextVal,
      application_no: applicationNo,
      date_filed: new Date().toISOString(),
      student_full_name: params[0],
      date_of_birth: params[1],
      sex: params[2],
      barangay: params[3],
      contact_number: params[4],
      email: params[5],
      school: params[6],
      school_year: params[7],
      is_solo_parent_beneficiary: params[8],
      is_orphan: params[9],
      is_pwd: params[10],
      is_ip: params[11],
      is_out_of_school_youth: params[12],
      special_circumstances_specify: params[13],
      status: params[14],
      evaluated_by: params[15],
      evaluated_at: new Date().toISOString()
    };
    mockApplications.push(newApp);
    return { rows: [{ application_no: applicationNo }], rowCount: 1 };
  }

  // 25. UPDATE scholar_applications
  if (sql.includes('UPDATE scholar_applications')) {
    const app = mockApplications.find(a => a.id === params[15]);
    if (app) {
      app.student_full_name = params[0];
      app.date_of_birth = params[1];
      app.sex = params[2];
      app.barangay = params[3];
      app.contact_number = params[4];
      app.email = params[5];
      app.school = params[6];
      app.school_year = params[7];
      app.is_solo_parent_beneficiary = params[8];
      app.is_orphan = params[9];
      app.is_pwd = params[10];
      app.is_ip = params[11];
      app.is_out_of_school_youth = params[12];
      app.special_circumstances_specify = params[13];
      app.status = params[14];
      app.evaluated_at = new Date().toISOString();
    }
    return { rows: [], rowCount: 1 };
  }

  return { rows: [], rowCount: 0 };
}

export async function query(text, params) {
  const start = Date.now();
  try {
    const url = process.env.DATABASE_URL || '';
    const isPlaceholder = !url || url.includes('[PASSWORD]') || url.includes('[PROJECT_ID]');

    if (isPlaceholder) {
      // Resolve using local in-memory mock engine
      const res = resolveMockQuery(text, params);
      return res;
    }

    const activePool = getPool();
    const res = await activePool.query(text, params);
    const duration = Date.now() - start;
    console.log(`Executed query: ${text.slice(0, 100)}... (${duration}ms)`);
    return res;
  } catch (error) {
    console.error(`Database query error: ${error.message} (Query: ${text})`);
    throw error;
  }
}
