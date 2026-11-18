const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const db = require('../db');

// Helper to generate QR code data URL if missing
async function generateQRCode(certId, req) {
  const protocol = req.protocol;
  const host = req.get('host');
  const verificationUrl = `${protocol}://${host}/verify/${certId}`;
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 260,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    }
  });
  return { qrDataUrl, verificationUrl };
}

// GET /api/student/certificates/:rollNo
// Public endpoint for students to fetch their certificates using Roll Number
router.get('/certificates/:rollNo', async (req, res) => {
  const { rollNo } = req.params;

  if (!rollNo || !rollNo.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Roll number is required'
    });
  }

  const cleanRollNo = rollNo.trim().toUpperCase();

  try {
    // 1. Fetch student profile if present in students table
    const student = db.prepare(`
      SELECT 
        roll_number,
        name,
        course,
        year,
        department,
        email
      FROM students 
      WHERE UPPER(TRIM(roll_number)) = ?
    `).get(cleanRollNo);

    // 2. Fetch all certificates matching this roll number
    // Also include certificates linked by student email if student record exists
    let certificates = [];
    if (student && student.email) {
      certificates = db.prepare(`
        SELECT 
          certificate_id,
          recipient_name,
          recipient_email,
          roll_number,
          department,
          course,
          event_name,
          event_date,
          organization,
          certificate_type,
          rank_or_role,
          template_id,
          coordinator_name,
          coordinator_title,
          hod_name,
          hod_title,
          authority_name,
          authority_title,
          logo_url,
          seal_url,
          signature_url,
          secondary_signature_url,
          hod_signature_url,
          qr_code_data,
          verification_url,
          issue_date,
          is_valid,
          citation_text,
          created_at
        FROM certificates
        WHERE UPPER(TRIM(roll_number)) = ?
           OR ( (roll_number IS NULL OR TRIM(roll_number) = '') AND LOWER(TRIM(recipient_email)) = LOWER(TRIM(?)) )
        ORDER BY issue_date DESC, created_at DESC
      `).all(cleanRollNo, student.email);
    } else {
      certificates = db.prepare(`
        SELECT 
          certificate_id,
          recipient_name,
          recipient_email,
          roll_number,
          department,
          course,
          event_name,
          event_date,
          organization,
          certificate_type,
          rank_or_role,
          template_id,
          coordinator_name,
          coordinator_title,
          hod_name,
          hod_title,
          authority_name,
          authority_title,
          logo_url,
          seal_url,
          signature_url,
          secondary_signature_url,
          hod_signature_url,
          qr_code_data,
          verification_url,
          issue_date,
          is_valid,
          citation_text,
          created_at
        FROM certificates
        WHERE UPPER(TRIM(roll_number)) = ?
        ORDER BY issue_date DESC, created_at DESC
      `).all(cleanRollNo);
    }

    // Filter by name if provided
    const reqName = (req.query.name || '').trim().toLowerCase();
    if (reqName) {
      const filtered = certificates.filter(c => 
        (c.recipient_name && c.recipient_name.toLowerCase().includes(reqName)) ||
        (student && student.name && student.name.toLowerCase().includes(reqName))
      );
      if (filtered.length > 0) {
        certificates = filtered;
      }
    }

    // Ensure all returned certificates have valid QR codes
    for (const cert of certificates) {
      if (!cert.qr_code_data) {
        try {
          const { qrDataUrl, verificationUrl } = await generateQRCode(cert.certificate_id, req);
          db.prepare('UPDATE certificates SET qr_code_data = ?, verification_url = ? WHERE certificate_id = ?')
            .run(qrDataUrl, verificationUrl, cert.certificate_id);
          cert.qr_code_data = qrDataUrl;
          cert.verification_url = verificationUrl;
        } catch (qrErr) {
          console.warn('QR code generation warning for certificate:', cert.certificate_id, qrErr);
        }
      }
    }

    // Resolve student summary info
    let resolvedStudent = student || null;
    if (!resolvedStudent && certificates.length > 0) {
      resolvedStudent = {
        name: certificates[0].recipient_name,
        roll_number: cleanRollNo,
        department: certificates[0].department,
        course: certificates[0].course,
        email: certificates[0].recipient_email || ''
      };
    }

    return res.status(200).json({
      success: true,
      roll_number: cleanRollNo,
      student: resolvedStudent,
      count: certificates.length,
      certificates,
      message: certificates.length === 0
        ? `No certificates found for roll number ${cleanRollNo}.`
        : `Found ${certificates.length} certificate(s) for roll number ${cleanRollNo}.`
    });
  } catch (error) {
    console.error('Student certificate search error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve certificates for the specified roll number'
    });
  }
});

module.exports = router;
