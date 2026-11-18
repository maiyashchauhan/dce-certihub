const express = require('express');
const router = express.Router();
const db = require('../db');

// Public verification endpoint
router.get('/:certId', (req, res) => {
  const { certId } = req.params;

  try {
    const cert = db.prepare(`
      SELECT 
        certificate_id,
        recipient_name,
        roll_number,
        department,
        course,
        event_name,
        event_date,
        organization,
        certificate_type,
        rank_or_role,
        coordinator_name,
        coordinator_title,
        hod_name,
        hod_title,
        authority_name,
        authority_title,
        issue_date,
        is_valid,
        citation_text,
        template_id,
        logo_url,
        seal_url,
        signature_url,
        secondary_signature_url,
        hod_signature_url,
        created_at
      FROM certificates 
      WHERE certificate_id = ?
    `).get(certId.trim().toUpperCase());

    if (!cert) {
      return res.status(404).json({
        verified: false,
        status: 'INVALID_OR_NOT_FOUND',
        message: 'This certificate identifier was not found in the official college registry. It may be fraudulent or invalid.'
      });
    }

    if (cert.is_valid === 0) {
      return res.status(200).json({
        verified: false,
        status: 'REVOKED',
        message: 'This certificate was officially issued but has since been REVOKED by the college administration.',
        certificate: cert
      });
    }

    return res.status(200).json({
      verified: true,
      status: 'VERIFIED_AUTHENTIC',
      message: 'This certificate is authentic and officially verified by the college registrar and event board.',
      certificate: cert,
      verification_timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Failed to verify certificate' });
  }
});

module.exports = router;
