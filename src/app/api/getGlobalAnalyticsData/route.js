import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '../_utils/session';
import { query } from '../_utils/db';
import { BARANGAYS, LYDC_CENTERS } from '../_utils/constants';

export async function GET(req) {
  try {
    const session = getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'ACCESS_DENIED: Admin permissions required.' }, { status: 403 });
    }

    const analytics = {
      totalFiles: 0,
      totalStorageBytes: 0, // Placeholder as actual files reside on Drive
      categoryCounts: {},
      sectoralVolumes: {},
      recentActivity: [],
      submissionStatus: {},
      trendData: {},
      pendingApprovals: 0,
      totalActiveYouth: 0
    };

    // Initialize submissionStatus with nulls
    BARANGAYS.forEach(b => { analytics.submissionStatus[b] = null; });
    LYDC_CENTERS.forEach(c => { analytics.submissionStatus[c] = null; });
    analytics.submissionStatus['LYDO'] = null;

    // Last 6 months buckets
    const trendBuckets = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      trendBuckets.push(label);
      analytics.trendData[label] = 0;
    }

    // Execute queries in parallel
    const [
      filesCountRes,
      pendingCountRes,
      categoryCountsRes,
      sectoralVolumesRes,
      recentActivityRes,
      youthCountRes,
      trendRes
    ] = await Promise.all([
      query("SELECT COUNT(*)::int as count FROM documents WHERE status = 'Approved'"),
      query("SELECT COUNT(*)::int as count FROM documents WHERE status = 'Pending'"),
      query("SELECT category, COUNT(*)::int as count FROM documents WHERE status = 'Approved' GROUP BY category"),
      query("SELECT sub_category, COUNT(*)::int as count, MAX(created_at) as newest FROM documents WHERE status = 'Approved' GROUP BY sub_category"),
      query(`SELECT file_id as "fileId", file_name as name, file_url as url, category, 
                    sub_category as "subCategory", uploaded_by as "uploadedBy", created_at as date 
             FROM documents WHERE status = 'Approved' ORDER BY created_at DESC LIMIT 10`),
      query("SELECT COUNT(*)::int as count FROM users WHERE role = 'scholar'"),
      query(`SELECT date_trunc('month', created_at) as month, COUNT(*)::int as count 
             FROM documents 
             WHERE status = 'Approved' AND created_at >= NOW() - INTERVAL '6 months' 
             GROUP BY month`)
    ]);

    analytics.totalFiles = filesCountRes.rows[0].count;
    analytics.pendingApprovals = pendingCountRes.rows[0].count;
    analytics.totalActiveYouth = youthCountRes.rows[0].count;

    categoryCountsRes.rows.forEach(r => {
      analytics.categoryCounts[r.category] = r.count;
    });

    sectoralVolumesRes.rows.forEach(r => {
      const subCat = r.sub_category;
      analytics.sectoralVolumes[subCat] = r.count;
      if (analytics.submissionStatus.hasOwnProperty(subCat)) {
        analytics.submissionStatus[subCat] = r.newest ? new Date(r.newest).toISOString() : null;
      }
    });

    analytics.recentActivity = recentActivityRes.rows;

    trendRes.rows.forEach(r => {
      const d = new Date(r.month);
      const label = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      if (analytics.trendData.hasOwnProperty(label)) {
        analytics.trendData[label] = r.count;
      }
    });

    return NextResponse.json({ success: true, data: analytics });
  } catch (err) {
    console.error('getGlobalAnalyticsData API error:', err);
    return NextResponse.json({ error: 'Failed to retrieve analytics data.' }, { status: 500 });
  }
}
