import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '../_utils/session';
import { query } from '../_utils/db';
import { BARANGAYS, LYDC_CENTERS } from '../_utils/constants';

export async function GET(req) {
  try {
    // Enable for admin, SK, and LYDC roles
    const session = getSessionFromRequest(req);
    if (!session || (session.role !== 'admin' && session.role !== 'SK' && session.role !== 'LYDC')) {
      return NextResponse.json({ error: 'ACCESS_DENIED: Access restricted.' }, { status: 403 });
    }

    const analytics = {
      totalFiles: 0,
      totalStorageBytes: 0, 
      categoryCounts: {},
      sectoralVolumes: {},
      recentActivity: [],
      submissionStatus: {},
      trendData: {},
      pendingApprovals: 0,
      totalActiveYouth: 0,
      trendTable: [],
      monthLabels: []
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

    // Determine the last 3 month labels (e.g. ["Apr 2026", "May 2026", "Jun 2026"])
    const mLabels = [];
    for (let i = 2; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      mLabels.push(d.toLocaleString('en-US', { month: 'short', year: 'numeric' }));
    }
    analytics.monthLabels = mLabels;

    // Execute queries in parallel
    const [
      filesCountRes,
      pendingCountRes,
      categoryCountsRes,
      sectoralVolumesRes,
      recentActivityRes,
      youthCountRes,
      trendRes,
      threeMonthTrendRes
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
             GROUP BY month`),
      query(`SELECT sub_category as "subCategory", date_trunc('month', created_at) as month, COUNT(*)::int as count 
             FROM documents 
             WHERE status = 'Approved' AND created_at >= date_trunc('month', NOW()) - INTERVAL '2 months'
             GROUP BY sub_category, month`)
    ]);

    analytics.totalFiles = filesCountRes.rows[0].count;
    analytics.pendingApprovals = pendingCountRes.rows[0].count;
    analytics.totalActiveYouth = youthCountRes.rows[0].count;

    categoryCountsRes.rows.forEach(r => {
      analytics.categoryCounts[r.category] = r.count;
    });

    // Initialize trend table structure for all Barangays, LYDC Centers, and LYDO
    const trendMap = {};
    const allEntities = [...BARANGAYS, ...LYDC_CENTERS, 'LYDO'];
    allEntities.forEach(ent => {
      trendMap[ent] = {
        entity: ent,
        lastUpload: null,
        status: 'red', // Default to red
        m1: 0, // current month count
        m2: 0, // last month count
        m3: 0  // 2 months ago count
      };
    });

    sectoralVolumesRes.rows.forEach(r => {
      const subCat = r.sub_category;
      analytics.sectoralVolumes[subCat] = r.count;
      
      if (analytics.submissionStatus.hasOwnProperty(subCat)) {
        analytics.submissionStatus[subCat] = r.newest ? new Date(r.newest).toISOString() : null;
      }

      // Populate last upload and active traffic light status
      if (trendMap[subCat]) {
        trendMap[subCat].lastUpload = r.newest ? new Date(r.newest).toISOString() : null;
        if (r.newest) {
          const daysDiff = (now - new Date(r.newest)) / (1000 * 60 * 60 * 24);
          trendMap[subCat].status = daysDiff <= 30 ? 'green' : 'red';
        }
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

    // Map monthly counts for the 3-month trend grid
    threeMonthTrendRes.rows.forEach(r => {
      const ent = r.subCategory;
      if (trendMap[ent]) {
        const d = new Date(r.month);
        const label = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
        
        if (label === mLabels[2]) {
          trendMap[ent].m1 = r.count;
        } else if (label === mLabels[1]) {
          trendMap[ent].m2 = r.count;
        } else if (label === mLabels[0]) {
          trendMap[ent].m3 = r.count;
        }
      }
    });

    analytics.trendTable = Object.values(trendMap);

    return NextResponse.json({ success: true, data: analytics });
  } catch (err) {
    console.error('getGlobalAnalyticsData API error:', err);
    return NextResponse.json({ error: 'Failed to retrieve analytics data.' }, { status: 500 });
  }
}
