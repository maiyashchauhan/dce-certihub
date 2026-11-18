const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const QRCode = require('qrcode');
const crypto = require('crypto');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });

// Helper to generate unique certificate ID
function generateCertificateId(prefix = 'CERT') {
  const year = new Date().getFullYear();
  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${year}-${randomHex}`;
}

// Helper to generate QR code data URL
async function generateQRCode(certId, req) {
  const protocol = req.protocol;
  const host = req.get('host');
  // Target the frontend verification URL route
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

// Get all certificates with filters
router.get('/', authenticateToken, (req, res) => {
  const { search, type, eventId, limit = 100, page = 1 } = req.query;

  try {
    let query = 'SELECT * FROM certificates WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (certificate_id LIKE ? OR recipient_name LIKE ? OR roll_number LIKE ? OR event_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (type && type !== 'all') {
      query += ' AND certificate_type = ?';
      params.push(type);
    }

    if (eventId) {
      query += ' AND event_id = ?';
      params.push(eventId);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), (Number(page) - 1) * Number(limit));

    const certificates = db.prepare(query).all(...params);
    const totalCount = db.prepare('SELECT COUNT(*) as count FROM certificates').get().count;

    res.json({
      certificates,
      total: totalCount,
      page: Number(page),
      limit: Number(limit)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// Get single certificate by Certificate ID (Auth-free or Auth)
router.get('/:certId', async (req, res) => {
  const { certId } = req.params;
  try {
    const cert = db.prepare('SELECT * FROM certificates WHERE certificate_id = ?').get(certId);
    if (!cert) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    // Ensure it has a QR code if missing
    if (!cert.qr_code_data) {
      const { qrDataUrl, verificationUrl } = await generateQRCode(cert.certificate_id, req);
      db.prepare('UPDATE certificates SET qr_code_data = ?, verification_url = ? WHERE id = ?').run(qrDataUrl, verificationUrl, cert.id);
      cert.qr_code_data = qrDataUrl;
      cert.verification_url = verificationUrl;
    }

    res.json(cert);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch certificate' });
  }
});

// Generate Single Certificate
router.post('/generate', authenticateToken, async (req, res) => {
  const {
    recipient_name,
    recipient_email,
    roll_number,
    department,
    course,
    event_id,
    event_name,
    event_date,
    organization,
    certificate_type = 'participation',
    rank_or_role = 'Participant',
    template_id = 'classic',
    coordinator_name,
    coordinator_title,
    hod_name = '',
    hod_title = 'Head of Department (HOD)',
    authority_name = '',
    authority_title = 'Principal',
    logo_url,
    seal_url,
    signature_url,
    secondary_signature_url,
    hod_signature_url,
    issue_date,
    citation_text,
    custom_cert_id
  } = req.body;

  if (!recipient_name || !event_name || !organization) {
    return res.status(400).json({ error: 'Recipient name, Event name, and Organization are required' });
  }

  try {
    const certId = custom_cert_id ? custom_cert_id.trim().toUpperCase() : generateCertificateId('CERT');
    const { qrDataUrl, verificationUrl } = await generateQRCode(certId, req);
    const resolvedIssueDate = issue_date || new Date().toISOString().split('T')[0];

    const stmt = db.prepare(`
      INSERT INTO certificates (
        certificate_id, recipient_name, recipient_email, roll_number, department, course,
        event_id, event_name, event_date, organization, certificate_type, rank_or_role,
        template_id, coordinator_name, coordinator_title, hod_name, hod_title, authority_name, authority_title,
        logo_url, seal_url, signature_url, secondary_signature_url, hod_signature_url, qr_code_data, verification_url,
        issue_date, citation_text, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      certId,
      recipient_name.trim(),
      recipient_email ? recipient_email.trim() : '',
      roll_number ? roll_number.trim().toUpperCase() : '',
      department ? department.trim() : '',
      course ? course.trim() : '',
      event_id || null,
      event_name.trim(),
      event_date || resolvedIssueDate,
      organization.trim(),
      certificate_type,
      rank_or_role,
      template_id,
      coordinator_name !== undefined ? coordinator_name : '',
      coordinator_title || (req.user.designation || 'Event Coordinator'),
      hod_name !== undefined ? hod_name : '',
      hod_title || 'Head of Department (HOD)',
      authority_name !== undefined ? authority_name : '',
      authority_title || 'Principal',
      logo_url || null,
      seal_url || null,
      signature_url || null,
      secondary_signature_url || null,
      hod_signature_url || null,
      qrDataUrl,
      verificationUrl,
      resolvedIssueDate,
      citation_text || `In recognition of valuable participation in ${event_name}`,
      req.user.id
    );

    const createdCert = db.prepare('SELECT * FROM certificates WHERE certificate_id = ?').get(certId);

    // Activity log
    db.prepare('INSERT INTO activity_logs (user_name, action, details) VALUES (?, ?, ?)').run(
      req.user.name,
      'CERTIFICATE_GENERATED',
      `Generated certificate ${certId} for ${recipient_name} (${event_name})`
    );

    res.status(201).json({
      message: 'Certificate created successfully',
      certificate: createdCert
    });
  } catch (error) {
    console.error('Error generating certificate:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Certificate ID already exists. Please choose another or let it auto-generate.' });
    }
    res.status(500).json({ error: 'Failed to generate certificate' });
  }
});

// Bulk Certificate Generation from Event Participants
router.post('/bulk-generate-event', authenticateToken, async (req, res) => {
  const {
    event_id,
    template_id = 'classic',
    authority_name = '',
    authority_title = 'Principal',
    coordinator_name,
    coordinator_title,
    hod_name = '',
    hod_title = 'Head of Department (HOD)',
    logo_url,
    signature_url,
    secondary_signature_url,
    hod_signature_url,
    issue_date,
    citation_template,
    only_winners = false
  } = req.body;

  if (!event_id) {
    return res.status(400).json({ error: 'Event ID is required' });
  }

  try {
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(event_id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    let pQuery = 'SELECT * FROM participants WHERE event_id = ?';
    if (only_winners) {
      pQuery += " AND (award_type != 'Participation' OR participation_status = 'Winner')";
    }
    const participants = db.prepare(pQuery).all(event_id);

    if (participants.length === 0) {
      return res.status(400).json({
        error: only_winners
          ? 'No winners found for this event. Please assign ranks to participants first using "Decide Winners & Ranks" or uncheck "Only generate for Winners".'
          : 'No participants registered for this event yet. Please add students first.'
      });
    }

    const resolvedDate = issue_date || new Date().toISOString().split('T')[0];
    const generatedCerts = [];

    // Ensure every player in a team gets a distinct individual certificate!
    // 1. If players were saved as individual participant records (the standard multi-player team entry flow),
    //    each player already has their own record with individual name, roll number, and email.
    // 2. If a legacy record or CSV has comma-separated names in p.name (e.g. "Alice, Bob, Charlie"), expand each player.
    // 3. If a legacy team record was stored as a single row with team_members ("Alice, Bob, Charlie") and no individual rows exist, expand each member.
    const teamRowCount = {};
    for (const p of participants) {
      if (p.team_name) {
        const tKey = p.team_name.trim().toLowerCase();
        teamRowCount[tKey] = (teamRowCount[tKey] || 0) + 1;
      }
    }

    const targetParticipants = [];
    for (const p of participants) {
      if (p.name && p.name.includes(',')) {
        // Name contains multiple comma-separated people
        const names = p.name.split(',').map(n => n.trim()).filter(Boolean);
        for (const nm of names) {
          targetParticipants.push({
            ...p,
            name: nm,
            is_team_player: true
          });
        }
      } else if (
        p.participant_type === 'team' &&
        p.team_name &&
        teamRowCount[p.team_name.trim().toLowerCase()] === 1 &&
        p.team_members &&
        p.team_members.includes(',')
      ) {
        // Single legacy team row where members were only listed in team_members
        const members = p.team_members.split(',').map(m => m.trim()).filter(Boolean);
        for (const member of members) {
          targetParticipants.push({
            ...p,
            name: member,
            is_team_player: true
          });
        }
      } else {
        // Normal individual participant row or individual team player row with their own name & roll
        targetParticipants.push(p);
      }
    }

    const insertStmt = db.prepare(`
      INSERT INTO certificates (
        certificate_id, recipient_name, recipient_email, roll_number, department, course,
        event_id, event_name, event_date, organization, certificate_type, rank_or_role,
        template_id, coordinator_name, coordinator_title, hod_name, hod_title, authority_name, authority_title,
        logo_url, signature_url, secondary_signature_url, hod_signature_url, qr_code_data, verification_url,
        issue_date, citation_text, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of targetParticipants) {
      const isWinner = p.participation_status === 'Winner' || (p.award_type && p.award_type !== 'Participation');
      const certType = isWinner ? 'winner' : 'participation';
      const rankOrRole = isWinner ? p.award_type : 'Participant';
      const prefix = isWinner ? 'CERT-WIN' : 'CERT-PAR';
      const certId = generateCertificateId(prefix);
      const { qrDataUrl, verificationUrl } = await generateQRCode(certId, req);

      let citation = citation_template;
      if (!citation) {
        if (p.team_name) {
          if (isWinner) {
            citation = `In recognition of achieving ${rankOrRole} as a proud member of Team "${p.team_name}" in ${event.title} organized by ${event.organization}.`;
          } else {
            citation = `In recognition of active participation and commendable teamwork as a member of Team "${p.team_name}" in ${event.title} organized by ${event.organization}.`;
          }
        } else {
          if (isWinner) {
            citation = `In recognition of achieving ${rankOrRole} in ${event.title} organized by ${event.organization}.`;
          } else {
            citation = `In recognition of active participation and dedication in ${event.title} organized by ${event.organization}.`;
          }
        }
      } else {
        citation = citation
          .replace('{name}', p.name)
          .replace('{event}', event.title)
          .replace('{rank}', rankOrRole)
          .replace('{team}', p.team_name || '');
      }

      insertStmt.run(
        certId,
        p.name,
        p.email || '',
        p.roll_number || '',
        p.department || event.department || '',
        '',
        event.id,
        event.title,
        event.event_date,
        event.organization,
        certType,
        rankOrRole,
        template_id,
        coordinator_name !== undefined ? coordinator_name : (event.coordinator_name || ''),
        coordinator_title || event.coordinator_title || 'Event Coordinator',
        hod_name !== undefined ? hod_name : '',
        hod_title || 'Head of Department (HOD)',
        authority_name !== undefined ? authority_name : '',
        authority_title || 'Principal',
        logo_url || null,
        signature_url || null,
        secondary_signature_url || null,
        hod_signature_url || null,
        qrDataUrl,
        verificationUrl,
        resolvedDate,
        citation,
        req.user.id
      );

      const record = db.prepare('SELECT * FROM certificates WHERE certificate_id = ?').get(certId);
      generatedCerts.push(record);
    }

    db.prepare('INSERT INTO activity_logs (user_name, action, details) VALUES (?, ?, ?)').run(
      req.user.name,
      'BULK_CERTIFICATES_EVENT',
      `Generated ${generatedCerts.length} certificates for event: ${event.title}`
    );

    res.json({
      message: `Successfully generated ${generatedCerts.length} certificates!`,
      count: generatedCerts.length,
      certificates: generatedCerts
    });
  } catch (error) {
    console.error('Bulk generate event error:', error);
    res.status(500).json({ error: 'Failed to bulk generate certificates: ' + error.message });
  }
});

// Bulk Certificate Generation from direct Excel/CSV upload
router.post('/bulk-generate-upload', authenticateToken, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No Excel or CSV file uploaded' });
  }

  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (!rows || rows.length === 0) {
      return res.status(400).json({ error: 'The uploaded file contains no rows' });
    }

    const {
      event_name = 'College Annual Tech Symposium',
      organization = 'Dronacharya College of Engineering',
      event_date = new Date().toISOString().split('T')[0],
      template_id = 'classic',
      authority_name = '',
      authority_title = 'Principal',
      coordinator_name,
      coordinator_title,
      hod_name = '',
      hod_title = 'Head of Department (HOD)',
      logo_url,
      signature_url,
      secondary_signature_url,
      hod_signature_url,
      issue_date
    } = req.body;

    const resolvedDate = issue_date || new Date().toISOString().split('T')[0];
    const generatedCerts = [];

    const insertStmt = db.prepare(`
      INSERT INTO certificates (
        certificate_id, recipient_name, recipient_email, roll_number, department, course,
        event_id, event_name, event_date, organization, certificate_type, rank_or_role,
        template_id, coordinator_name, coordinator_title, hod_name, hod_title, authority_name, authority_title,
        logo_url, signature_url, secondary_signature_url, hod_signature_url, qr_code_data, verification_url,
        issue_date, citation_text, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const row of rows) {
      const rawName = row['Name'] || row['Student Name'] || row['Recipient Name'] || row['name'];
      if (!rawName) continue;

      const teamName = row['Team Name'] || row['Team'] || row['team_name'] || '';
      const teamMembers = row['Team Members'] || row['team_members'];
      let playerNames = [];
      if (String(rawName).includes(',')) {
        playerNames = String(rawName).split(',').map(m => m.trim()).filter(Boolean);
      } else if (
        teamMembers &&
        String(teamMembers).includes(',') &&
        (!rawName || rawName.trim().toLowerCase() === teamName.trim().toLowerCase())
      ) {
        playerNames = String(teamMembers).split(',').map(m => m.trim()).filter(Boolean);
      } else {
        playerNames = [String(rawName).trim()];
      }

      const roll = row['Roll Number'] || row['RollNo'] || row['roll_number'] || '';
      const email = row['Email'] || row['email'] || '';
      const dept = row['Department'] || row['department'] || '';
      const course = row['Course'] || row['course'] || '';
      const rowEvent = row['Event'] || row['event_name'] || event_name;
      const rowDate = row['Date'] || row['event_date'] || event_date;
      const rowOrg = row['Organization'] || row['organization'] || organization;
      const certType = (row['Certificate Type'] || row['Type'] || 'participation').toLowerCase();
      const rankRole = row['Rank'] || row['Award'] || row['Role'] || (certType === 'winner' ? 'Winner' : 'Participant');
      const rowTemplate = row['Template'] || template_id;
      const rowHod = row['HOD'] || row['HOD Name'] || row['hod_name'] || hod_name || '';

      for (const playerName of playerNames) {
        const prefix = certType === 'winner' ? 'CERT-WIN' : (certType === 'internship' ? 'CERT-INT' : 'CERT-GEN');
        const certId = generateCertificateId(prefix);
        const { qrDataUrl, verificationUrl } = await generateQRCode(certId, req);

        const citation = row['Citation'] || (teamName
          ? `For exceptional contribution and exemplary achievement as a member of Team "${teamName}" in ${rowEvent}.`
          : `For exceptional contribution and exemplary participation in ${rowEvent}.`);

        insertStmt.run(
          certId,
          String(playerName).trim(),
          String(email).trim(),
          String(roll).trim().toUpperCase(),
          String(dept).trim(),
          String(course).trim(),
          null,
          String(rowEvent).trim(),
          String(rowDate).trim(),
          String(rowOrg).trim(),
          certType,
          String(rankRole).trim(),
          rowTemplate,
          coordinator_name !== undefined ? coordinator_name : '',
          coordinator_title || 'Event Coordinator',
          rowHod,
          hod_title || 'Head of Department (HOD)',
          authority_name !== undefined ? authority_name : '',
          authority_title || 'Principal',
          logo_url || null,
          signature_url || null,
          secondary_signature_url || null,
          hod_signature_url || null,
          qrDataUrl,
          verificationUrl,
          resolvedDate,
          citation,
          req.user.id
        );

        const record = db.prepare('SELECT * FROM certificates WHERE certificate_id = ?').get(certId);
        generatedCerts.push(record);
      }
    }

    db.prepare('INSERT INTO activity_logs (user_name, action, details) VALUES (?, ?, ?)').run(
      req.user.name,
      'EXCEL_BULK_CERTIFICATES',
      `Imported and generated ${generatedCerts.length} certificates from file: ${req.file.originalname}`
    );

    res.json({
      message: `Batch generation successful! Generated ${generatedCerts.length} certificates`,
      count: generatedCerts.length,
      certificates: generatedCerts
    });
  } catch (error) {
    console.error('Upload bulk cert error:', error);
    res.status(500).json({ error: 'Failed to generate certificates from file: ' + error.message });
  }
});

// Toggle Certificate validity (revocation)
router.patch('/:certId/status', authenticateToken, (req, res) => {
  const { certId } = req.params;
  const { is_valid } = req.body;

  try {
    db.prepare('UPDATE certificates SET is_valid = ? WHERE certificate_id = ?').run(is_valid ? 1 : 0, certId);
    res.json({ message: `Certificate ${certId} validity updated to ${is_valid ? 'Valid' : 'Revoked'}` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update certificate validity' });
  }
});

// Batch delete certificates
router.post('/batch-delete', authenticateToken, (req, res) => {
  const { certIds } = req.body;
  if (!Array.isArray(certIds) || certIds.length === 0) {
    return res.status(400).json({ error: 'Array of certificate IDs required' });
  }

  try {
    const deleteBatch = db.transaction((idList) => {
      const stmt = db.prepare('DELETE FROM certificates WHERE certificate_id = ?');
      let count = 0;
      for (const id of idList) {
        stmt.run(id);
        count++;
      }
      return count;
    });

    const deletedCount = deleteBatch(certIds);
    res.json({ message: `Successfully deleted ${deletedCount} certificates`, count: deletedCount });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete certificates batch' });
  }
});

// Delete single certificate
router.delete('/:certId', authenticateToken, (req, res) => {
  const { certId } = req.params;
  try {
    const result = db.prepare('DELETE FROM certificates WHERE certificate_id = ?').run(certId);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Certificate not found' });
    }
    res.json({ message: `Certificate ${certId} deleted successfully` });
  } catch (error) {
    console.error('Delete certificate error:', error);
    res.status(500).json({ error: 'Failed to delete certificate: ' + error.message });
  }
});

// Delete all certificates
router.delete('/', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM certificates').run();
    res.json({ message: 'All certificates deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete all certificates' });
  }
});

// Archive downloaded certificate to local disk drive
router.post('/archive-download', (req, res) => {
  try {
    const { filename, dataUrl } = req.body;
    if (!filename || !dataUrl) {
      return res.status(400).json({ error: 'Missing filename or dataUrl' });
    }

    const driveBackupDir = path.join(__dirname, '..', '..', 'uploads', 'drive_backup');
    if (!fs.existsSync(driveBackupDir)) {
      fs.mkdirSync(driveBackupDir, { recursive: true });
    }

    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid dataUrl format' });
    }

    const buffer = Buffer.from(matches[2], 'base64');
    const safeFilename = path.basename(filename);
    const targetPath = path.join(driveBackupDir, safeFilename);

    fs.writeFileSync(targetPath, buffer);

    res.json({
      message: 'Certificate backed up to server drive successfully',
      url: `/uploads/drive_backup/${safeFilename}`,
      filename: safeFilename,
      bytes: buffer.length
    });
  } catch (error) {
    console.error('Drive backup error:', error);
    res.status(500).json({ error: 'Failed to archive certificate on server drive' });
  }
});

module.exports = router;

