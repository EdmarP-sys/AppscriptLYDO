import { NextResponse } from 'next/server';
import { query } from '../_utils/db';
import { BARANGAYS, LYDC_CENTERS } from '../_utils/constants';

export async function GET() {
  try {
    const counts = {};
    const lastUploads = {};

    // Initialize counts and lastUploads
    BARANGAYS.forEach(b => {
      counts[b] = 0;
      lastUploads[b] = null;
    });
    LYDC_CENTERS.forEach(c => {
      counts[c] = 0;
      lastUploads[c] = null;
    });
    counts['LYDO'] = 0;
    lastUploads['LYDO'] = null;

    // Fetch aggregates from Supabase
    const dbRes = await query(
      `SELECT sub_category as "subCategory", COUNT(*)::int as count, MAX(created_at) as "lastUpload"
       FROM documents
       WHERE status = 'Approved'
       GROUP BY sub_category`
    );

    dbRes.rows.forEach(row => {
      const cat = row.subCategory;
      // Handle the "Active Citizen" vs "Active Citizenship" mapping dynamically if needed
      let targetCat = cat;
      if (cat === 'Active Citizen' || cat === 'Active Citizenship') {
        targetCat = 'Active Citizenship';
      }

      if (counts[targetCat] !== undefined) {
        counts[targetCat] = row.count;
        lastUploads[targetCat] = row.lastUpload ? new Date(row.lastUpload).toISOString() : null;
      }
    });

    return NextResponse.json({ counts, lastUploads });
  } catch (err) {
    console.error('getAllDocumentCounts API error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
