const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const crypto = require('crypto');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Helper to generate unique certificate ID
function generateCertificateId(prefix = 'CERT') {
  const year = new Date().getFullYear();
  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${year}-${randomHex}`;
}

// Helper to generate QR code data URL
async function generateQRCode(certId, req) {
  const protocol = req.protocol || 'http';
  const host = req.get('host') || 'localhost:5000';
  const verificationUrl = `${protocol}://${host}/verify/${certId}`;
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 260,
    color: { dark: '#0f172a', light: '#ffffff' }
  });
  return { qrDataUrl, verificationUrl };
}

// Get overview of all database tables and counts
router.get('/overview', authenticateToken, (req, res) => {
  try {
    const studentsCount = db.prepare('SELECT COUNT(*) as count FROM students').get().count;
    const facultyCount = db.prepare('SELECT COUNT(*) as count FROM faculty').get().count;
    const eventsCount = db.prepare('SELECT COUNT(*) as count FROM events').get().count;
    const participantsCount = db.prepare('SELECT COUNT(*) as count FROM participants').get().count;
    const certificatesCount = db.prepare('SELECT COUNT(*) as count FROM certificates').get().count;
    const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const logsCount = db.prepare('SELECT COUNT(*) as count FROM activity_logs').get().count;

    res.json({
      students: studentsCount,
      faculty: facultyCount,
      events: eventsCount,
      participants: participantsCount,
      certificates: certificatesCount,
      users: usersCount,
      logs: logsCount
    });
  } catch (error) {
    console.error('Data overview error:', error);
    res.status(500).json({ error: 'Failed to fetch database overview' });
  }
});

// Export all database tables as JSON
router.get('/export', authenticateToken, (req, res) => {
  try {
    const students = db.prepare('SELECT * FROM students').all();
    const faculty = db.prepare('SELECT * FROM faculty').all();
    const events = db.prepare('SELECT * FROM events').all();
    const participants = db.prepare('SELECT * FROM participants').all();
    const certificates = db.prepare('SELECT * FROM certificates').all();
    const activityLogs = db.prepare('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 100').all();

    const exportData = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      exported_by: req.user ? req.user.name : 'User',
      tables: {
        students,
        faculty,
        events,
        participants,
        certificates,
        activityLogs
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=educert-database-export-${Date.now()}.json`);
    res.json(exportData);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export database: ' + error.message });
  }
});

// Import database tables from JSON
router.post('/import', authenticateToken, (req, res) => {
  const { tables, mode = 'merge' } = req.body;

  if (!tables) {
    return res.status(400).json({ error: 'No valid tables data provided in payload' });
  }

  try {
    const importTransaction = db.transaction(() => {
      // If replace mode, clear tables first
      if (mode === 'replace') {
        db.prepare('DELETE FROM certificates').run();
        db.prepare('DELETE FROM participants').run();
        db.prepare('DELETE FROM events').run();
        db.prepare('DELETE FROM students').run();
      }

      let studentsImported = 0;
      if (Array.isArray(tables.students)) {
        const insertStudent = db.prepare(`
          INSERT INTO students (roll_number, name, course, year, department, email, phone)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(roll_number) DO UPDATE SET
            name = excluded.name,
            course = excluded.course,
            year = excluded.year,
            department = excluded.department,
            email = excluded.email,
            phone = excluded.phone
        `);
        for (const s of tables.students) {
          if (s.roll_number && s.name) {
            insertStudent.run(s.roll_number, s.name, s.course || 'B.Tech', s.year || '1st Year', s.department || 'General', s.email || '', s.phone || '');
            studentsImported++;
          }
        }
      }

      let eventsImported = 0;
      if (Array.isArray(tables.events)) {
        const insertEvent = db.prepare(`
          INSERT INTO events (title, category, event_date, department, description, organization, coordinator_name, coordinator_title)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const e of tables.events) {
          if (e.title) {
            insertEvent.run(e.title, e.category || 'Event', e.event_date || new Date().toISOString().split('T')[0], e.department || 'General', e.description || '', e.organization || 'College', e.coordinator_name || 'Coordinator', e.coordinator_title || 'Convener');
            eventsImported++;
          }
        }
      }

      let certsImported = 0;
      if (Array.isArray(tables.certificates)) {
        const insertCert = db.prepare(`
          INSERT INTO certificates (
            certificate_id, recipient_name, recipient_email, roll_number, department, course,
            event_id, event_name, event_date, organization, certificate_type, rank_or_role,
            template_id, coordinator_name, coordinator_title, authority_name, authority_title,
            logo_url, signature_url, secondary_signature_url, qr_code_data, verification_url,
            issue_date, is_valid, citation_text, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(certificate_id) DO UPDATE SET
            recipient_name = excluded.recipient_name,
            is_valid = excluded.is_valid
        `);
        for (const c of tables.certificates) {
          if (c.certificate_id && c.recipient_name) {
            insertCert.run(
              c.certificate_id, c.recipient_name, c.recipient_email || null, c.roll_number || null,
              c.department || null, c.course || null, c.event_id || null, c.event_name || 'Event',
              c.event_date || new Date().toISOString().split('T')[0], c.organization || 'College',
              c.certificate_type || 'participation', c.rank_or_role || 'Participant',
              c.template_id || 'classic', c.coordinator_name || 'Coordinator',
              c.coordinator_title || 'Convener', c.authority_name || 'Principal',
              c.authority_title || 'Head', c.logo_url || null, c.signature_url || null,
              c.secondary_signature_url || null, c.qr_code_data || null, c.verification_url || null,
              c.issue_date || new Date().toISOString().split('T')[0], c.is_valid !== undefined ? c.is_valid : 1,
              c.citation_text || null, req.user ? req.user.id : null
            );
            certsImported++;
          }
        }
      }

      // Log activity
      db.prepare('INSERT INTO activity_logs (user_name, action, details) VALUES (?, ?, ?)').run(
        req.user ? req.user.name : 'User',
        'DATABASE_RESTORE',
        `Imported: ${studentsImported} students, ${eventsImported} events, ${certsImported} certificates`
      );

      return { studentsImported, eventsImported, certsImported };
    });

    const results = importTransaction();
    res.json({
      message: 'Database imported successfully',
      ...results
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Failed to import database: ' + error.message });
  }
});

// Seed realistic sample data into SQLite database
router.post('/seed-sample', authenticateToken, async (req, res) => {
  try {
    // 1. Seed Sample Students
    const sampleStudents = [
      { roll_number: '22BCS101', name: 'Aarav Patel', course: 'B.Tech CSE', year: '3rd Year', department: 'Computer Science & Engineering', email: 'aarav.patel@student.college.edu', phone: '+91 98765 11001' },
      { roll_number: '22BCS102', name: 'Diya Sharma', course: 'B.Tech CSE', year: '3rd Year', department: 'Computer Science & Engineering', email: 'diya.sharma@student.college.edu', phone: '+91 98765 11002' },
      { roll_number: '22BEC201', name: 'Rohan Mehra', course: 'B.Tech ECE', year: '3rd Year', department: 'Electronics & Communication', email: 'rohan.mehra@student.college.edu', phone: '+91 98765 11003' },
      { roll_number: '23BME301', name: 'Ananya Roy', course: 'B.Tech ME', year: '2nd Year', department: 'Mechanical Engineering', email: 'ananya.roy@student.college.edu', phone: '+91 98765 11004' },
      { roll_number: '21BCS405', name: 'Kavya Iyer', course: 'B.Tech CSE', year: '4th Year', department: 'Computer Science & Engineering', email: 'kavya.iyer@student.college.edu', phone: '+91 98765 11005' },
      { roll_number: '23BIT108', name: 'Vikram Joshi', course: 'B.Tech IT', year: '2nd Year', department: 'Information Technology', email: 'vikram.joshi@student.college.edu', phone: '+91 98765 11006' }
    ];

    const insertStudent = db.prepare(`
      INSERT INTO students (roll_number, name, course, year, department, email, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(roll_number) DO UPDATE SET
        name = excluded.name,
        course = excluded.course,
        year = excluded.year,
        department = excluded.department,
        email = excluded.email,
        phone = excluded.phone
    `);

    for (const s of sampleStudents) {
      insertStudent.run(s.roll_number, s.name, s.course, s.year, s.department, s.email, s.phone);
    }

    // 2. Seed Sample Events
    const sampleEvents = [
      {
        title: 'National Hackathon 2026: CodeMatrix',
        category: 'Hackathon',
        event_date: '2026-03-15',
        department: 'Computer Science & Engineering',
        organization: 'Dronacharya College of Engineering',
        description: '36-hour National Level collegiate Hackathon on Generative AI & Autonomous Robotics.',
        coordinator_name: '',
        coordinator_title: 'Event Coordinator'
      },
      {
        title: 'Annual Technical Symposium: InnovateTech',
        category: 'Symposium',
        event_date: '2026-02-28',
        department: 'Electronics & Communication',
        organization: 'Dronacharya College of Engineering',
        description: 'Inter-college presentation of cutting-edge IoT and VLSI design projects.',
        coordinator_name: '',
        coordinator_title: 'Event Coordinator'
      },
      {
        title: 'Robotics & AI Innovation Summit 2026',
        category: 'Workshop',
        event_date: '2026-01-20',
        department: 'Mechanical Engineering',
        organization: 'Dronacharya College of Engineering',
        description: 'Hands-on intensive bootcamp on ROS2 and autonomous mobile robots.',
        coordinator_name: '',
        coordinator_title: 'Event Coordinator'
      }
    ];

    const insertEvent = db.prepare(`
      INSERT INTO events (title, category, event_date, department, description, organization, coordinator_name, coordinator_title)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const createdEventIds = [];
    for (const e of sampleEvents) {
      // Check if already exists
      const existing = db.prepare('SELECT id FROM events WHERE title = ?').get(e.title);
      if (existing) {
        createdEventIds.push(existing.id);
      } else {
        const res = insertEvent.run(e.title, e.category, e.event_date, e.department, e.description, e.organization, e.coordinator_name, e.coordinator_title);
        createdEventIds.push(res.lastInsertRowid);
      }
    }

    // 3. Seed Participants for Event 1
    if (createdEventIds[0]) {
      const eventId = createdEventIds[0];
      const sampleParticipants = [
        { name: 'Aarav Patel', roll_number: '22BCS101', email: 'aarav.patel@student.college.edu', department: 'Computer Science & Engineering', participant_type: 'team', team_name: 'NeuralCraft', team_members: 'Aarav Patel, Diya Sharma', participation_status: 'Winner', award_type: '1st Place' },
        { name: 'Diya Sharma', roll_number: '22BCS102', email: 'diya.sharma@student.college.edu', department: 'Computer Science & Engineering', participant_type: 'team', team_name: 'NeuralCraft', team_members: 'Aarav Patel, Diya Sharma', participation_status: 'Winner', award_type: '1st Place' },
        { name: 'Rohan Mehra', roll_number: '22BEC201', email: 'rohan.mehra@student.college.edu', department: 'Electronics & Communication', participant_type: 'individual', team_name: null, team_members: null, participation_status: 'Winner', award_type: '2nd Place' },
        { name: 'Ananya Roy', roll_number: '23BME301', email: 'ananya.roy@student.college.edu', department: 'Mechanical Engineering', participant_type: 'individual', team_name: null, team_members: null, participation_status: 'Participant', award_type: 'Participation' }
      ];

      const insertPart = db.prepare(`
        INSERT INTO participants (event_id, name, roll_number, email, department, participant_type, team_name, team_members, participation_status, award_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const p of sampleParticipants) {
        const exist = db.prepare('SELECT id FROM participants WHERE event_id = ? AND roll_number = ?').get(eventId, p.roll_number);
        if (!exist) {
          insertPart.run(eventId, p.name, p.roll_number, p.email, p.department, p.participant_type, p.team_name, p.team_members, p.participation_status, p.award_type);
        }
      }
    }

    // 4. Seed 3 Sample Certificates with Real QR codes
    const sampleCerts = [
      {
        certificate_id: 'CERT-2026-WIN01',
        recipient_name: 'Aarav Patel',
        recipient_email: 'aarav.patel@student.college.edu',
        roll_number: '22BCS101',
        department: 'Computer Science & Engineering',
        course: 'B.Tech CSE',
        event_name: 'National Hackathon 2026: CodeMatrix',
        event_date: '2026-03-15',
        organization: 'Dronacharya College of Engineering',
        certificate_type: 'winner',
        rank_or_role: '1st Place Winner',
        template_id: 'classic',
        coordinator_name: '',
        coordinator_title: 'Event Coordinator',
        authority_name: '',
        authority_title: 'Principal',
        issue_date: '2026-03-16',
        citation_text: 'For securing First Position in the 36-hour National Hackathon CodeMatrix 2026 with an innovative AI healthcare solution.'
      },
      {
        certificate_id: 'CERT-2026-WIN02',
        recipient_name: 'Diya Sharma',
        recipient_email: 'diya.sharma@student.college.edu',
        roll_number: '22BCS102',
        department: 'Computer Science & Engineering',
        course: 'B.Tech CSE',
        event_name: 'National Hackathon 2026: CodeMatrix',
        event_date: '2026-03-15',
        organization: 'Dronacharya College of Engineering',
        certificate_type: 'winner',
        rank_or_role: '1st Place Winner',
        template_id: 'modern_gold',
        coordinator_name: '',
        coordinator_title: 'Event Coordinator',
        authority_name: '',
        authority_title: 'Principal',
        issue_date: '2026-03-16',
        citation_text: 'For securing First Position in the 36-hour National Hackathon CodeMatrix 2026 with an innovative AI healthcare solution.'
      },
      {
        certificate_id: 'CERT-2026-PAR01',
        recipient_name: 'Ananya Roy',
        recipient_email: 'ananya.roy@student.college.edu',
        roll_number: '23BME301',
        department: 'Mechanical Engineering',
        course: 'B.Tech ME',
        event_name: 'National Hackathon 2026: CodeMatrix',
        event_date: '2026-03-15',
        organization: 'Dronacharya College of Engineering',
        certificate_type: 'participation',
        rank_or_role: 'Participant',
        template_id: 'minimal_bold',
        coordinator_name: '',
        coordinator_title: 'Event Coordinator',
        authority_name: '',
        authority_title: 'Principal',
        issue_date: '2026-03-16',
        citation_text: 'For active and enthusiastic participation in the 36-hour National Hackathon CodeMatrix 2026.'
      }
    ];

    const insertCert = db.prepare(`
      INSERT INTO certificates (
        certificate_id, recipient_name, recipient_email, roll_number, department, course,
        event_id, event_name, event_date, organization, certificate_type, rank_or_role,
        template_id, coordinator_name, coordinator_title, authority_name, authority_title,
        logo_url, signature_url, secondary_signature_url, qr_code_data, verification_url,
        issue_date, citation_text, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(certificate_id) DO UPDATE SET recipient_name = excluded.recipient_name
    `);

    for (const c of sampleCerts) {
      const { qrDataUrl, verificationUrl } = await generateQRCode(c.certificate_id, req);
      insertCert.run(
        c.certificate_id, c.recipient_name, c.recipient_email, c.roll_number,
        c.department, c.course, createdEventIds[0] || null, c.event_name,
        c.event_date, c.organization, c.certificate_type, c.rank_or_role,
        c.template_id, c.coordinator_name, c.coordinator_title, c.authority_name,
        c.authority_title, null, null, null, qrDataUrl, verificationUrl,
        c.issue_date, c.citation_text, req.user ? req.user.id : null
      );
    }

    // Log activity
    db.prepare('INSERT INTO activity_logs (user_name, action, details) VALUES (?, ?, ?)').run(
      req.user ? req.user.name : 'System',
      'SAMPLE_DATA_SEEDED',
      'Populated database with realistic college students, events, participants, and verified certificates.'
    );

    res.json({
      message: 'Successfully populated database with realistic college sample data!',
      students: sampleStudents.length,
      events: sampleEvents.length,
      certificates: sampleCerts.length
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ error: 'Failed to seed sample data: ' + error.message });
  }
});

// Clear / Wipe tables
router.post('/clear', authenticateToken, (req, res) => {
  const { tables = ['students', 'events', 'participants', 'certificates'] } = req.body;

  try {
    const clearTransaction = db.transaction(() => {
      if (tables.includes('certificates')) {
        db.prepare('DELETE FROM certificates').run();
      }
      if (tables.includes('participants')) {
        db.prepare('DELETE FROM participants').run();
      }
      if (tables.includes('events')) {
        db.prepare('DELETE FROM events').run();
      }
      if (tables.includes('students')) {
        db.prepare('DELETE FROM students').run();
      }
      if (tables.includes('faculty')) {
        db.prepare('DELETE FROM faculty').run();
      }
    });

    clearTransaction();

    db.prepare('INSERT INTO activity_logs (user_name, action, details) VALUES (?, ?, ?)').run(
      req.user ? req.user.name : 'User',
      'DATABASE_CLEARED',
      `Cleared tables: ${tables.join(', ')}`
    );

    res.json({ message: `Successfully cleared selected database tables: ${tables.join(', ')}` });
  } catch (error) {
    console.error('Clear error:', error);
    res.status(500).json({ error: 'Failed to clear database tables: ' + error.message });
  }
});

module.exports = router;
