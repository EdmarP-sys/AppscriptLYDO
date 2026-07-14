import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '../../_utils/session';
import { query } from '../../_utils/db';

export async function POST(req) {
  try {
    const session = getSessionFromRequest(req);
    // Only admins, LYDO, and encoders can encode scholars
    if (!session || (session.role !== 'admin' && session.role !== 'LYDC' && session.role !== 'encoder')) {
      return NextResponse.json({ error: 'ACCESS_DENIED: Access restricted.' }, { status: 403 });
    }

    const data = await req.json();

    // Required fields check (minimal checking)
    if (!data.studentFullName || !data.dateOfBirth || !data.sex || !data.barangay) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Atomic generation of AFS application number & insertion
    const insertQuery = `
      INSERT INTO scholar_applications (
        application_no,
        student_full_name,
        date_of_birth,
        sex,
        barangay,
        contact_number,
        email,
        school,
        school_year,
        is_solo_parent_beneficiary,
        is_orphan,
        is_pwd,
        is_ip,
        is_out_of_school_youth,
        special_circumstances_specify,
        status,
        evaluated_by,
        evaluated_at
      )
      VALUES (
        'AFS-' || LPAD(nextval('scholar_afs_seq')::text, 5, '0'),
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, NOW()
      )
      RETURNING application_no
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
      session.username // evaluated_by is the encoder
    ];

    const res = await query(insertQuery, values);
    const newAfs = res.rows[0].application_no;

    // Log the action
    await query(
      `INSERT INTO audit_logs (actor, action, details) VALUES ($1, $2, $3)`,
      [session.username, 'ENCODE_SCHOLAR', `Encoded new scholar application: ${newAfs}`]
    );

    return NextResponse.json({ success: true, applicationNo: newAfs });
  } catch (err) {
    console.error('Encode scholar error:', err);
    return NextResponse.json({ error: 'Failed to encode scholar application' }, { status: 500 });
  }
}
