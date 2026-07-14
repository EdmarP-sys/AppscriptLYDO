import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '../../_utils/session';
import { query } from '../../_utils/db';

export async function POST(req) {
  try {
    const session = getSessionFromRequest(req);
    if (!session || (session.role !== 'admin' && session.role !== 'LYDC' && session.role !== 'encoder')) {
      return NextResponse.json({ error: 'ACCESS_DENIED: Access restricted.' }, { status: 403 });
    }

    const data = await req.json();

    if (!data.id) {
      return NextResponse.json({ error: 'Missing application ID' }, { status: 400 });
    }

    const updateQuery = `
      UPDATE scholar_applications
      SET
        student_full_name = $1,
        date_of_birth = $2,
        sex = $3,
        barangay = $4,
        contact_number = $5,
        email = $6,
        school = $7,
        school_year = $8,
        is_solo_parent_beneficiary = $9,
        is_orphan = $10,
        is_pwd = $11,
        is_ip = $12,
        is_out_of_school_youth = $13,
        special_circumstances_specify = $14,
        status = $15
      WHERE id = $16
    `;

    const values = [
      data.studentFullName,
      data.dateOfBirth,
      data.sex,
      data.barangay,
      data.contactNumber || '',
      data.email || '',
      data.school || '',
      data.schoolYear || '',
      data.isSoloParentBeneficiary ? true : false,
      data.isOrphan ? true : false,
      data.isPwd ? true : false,
      data.isIp ? true : false,
      data.isOutOfSchoolYouth ? true : false,
      data.specialCircumstancesSpecify || null,
      data.status || 'Pending',
      data.id
    ];

    await query(updateQuery, values);

    // Log the action
    await query(
      `INSERT INTO audit_logs (actor, action, details) VALUES ($1, $2, $3)`,
      [session.username, 'UPDATE_SCHOLAR', `Updated scholar application ID: ${data.id}`]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Update scholar error:', err);
    return NextResponse.json({ error: 'Failed to update scholar application' }, { status: 500 });
  }
}
