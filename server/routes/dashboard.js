const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Dashboard statistics
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const totalCertificates = db.prepare('SELECT COUNT(*) as count FROM certificates').get().count;
    const totalEvents = db.prepare('SELECT COUNT(*) as count FROM events').get().count;
    const totalStudents = db.prepare('SELECT COUNT(*) as count FROM students').get().count;
    const totalFaculty = db.prepare('SELECT COUNT(*) as count FROM faculty').get().count;

    // Distribution by certificate type
    const typeDistribution = db.prepare(`
      SELECT certificate_type, COUNT(*) as count 
      FROM certificates 
      GROUP BY certificate_type
    `).all();

    // Top recent certificates
    const recentCertificates = db.prepare(`
      SELECT certificate_id, recipient_name, roll_number, event_name, certificate_type, rank_or_role, issue_date, created_at
      FROM certificates
      ORDER BY created_at DESC
      LIMIT 6
    `).all();

    // Recent activity logs
    const recentLogs = db.prepare(`
      SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 8
    `).all();

    res.json({
      stats: {
        totalCertificates,
        totalEvents,
        totalStudents,
        totalFaculty
      },
      typeDistribution,
      recentCertificates,
      recentLogs
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

module.exports = router;
