const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get all faculty members
router.get('/', authenticateToken, (req, res) => {
  try {
    const list = db.prepare(`
      SELECT f.*, u.email as user_email
      FROM faculty f
      LEFT JOIN users u ON f.user_id = u.id
      ORDER BY f.name ASC
    `).all();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch faculty list' });
  }
});

// Add new faculty
router.post('/', authenticateToken, (req, res) => {
  const { employee_id, name, department, designation, email, phone, signature_url, is_coordinator } = req.body;

  if (!employee_id || !name || !department || !email) {
    return res.status(400).json({ error: 'Employee ID, Name, Department, and Email are required' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO faculty (employee_id, name, department, designation, email, phone, signature_url, is_coordinator)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      employee_id.trim(),
      name.trim(),
      department.trim(),
      designation || 'Faculty Member',
      email.trim(),
      phone || '',
      signature_url || null,
      is_coordinator ? 1 : 0
    );

    // Record activity log
    db.prepare('INSERT INTO activity_logs (user_name, action, details) VALUES (?, ?, ?)').run(
      req.user.name,
      'FACULTY_ADDED',
      `Added faculty member ${name} (${employee_id}) in ${department}`
    );

    res.status(201).json({ id: result.lastInsertRowid, message: 'Faculty member added successfully' });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Faculty with this Employee ID already exists' });
    }
    res.status(500).json({ error: 'Failed to add faculty member' });
  }
});

// Update faculty member
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { employee_id, name, department, designation, email, phone, signature_url, is_coordinator } = req.body;

  try {
    const stmt = db.prepare(`
      UPDATE faculty
      SET employee_id = COALESCE(?, employee_id),
          name = COALESCE(?, name),
          department = COALESCE(?, department),
          designation = COALESCE(?, designation),
          email = COALESCE(?, email),
          phone = COALESCE(?, phone),
          signature_url = COALESCE(?, signature_url),
          is_coordinator = COALESCE(?, is_coordinator)
      WHERE id = ?
    `);

    stmt.run(employee_id, name, department, designation, email, phone, signature_url, is_coordinator, id);
    res.json({ message: 'Faculty updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update faculty member' });
  }
});

// Batch delete faculty members
router.post('/batch-delete', authenticateToken, (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Array of faculty IDs required' });
  }

  try {
    const deleteBatch = db.transaction((idList) => {
      const stmt = db.prepare('DELETE FROM faculty WHERE id = ?');
      let count = 0;
      for (const id of idList) {
        stmt.run(id);
        count++;
      }
      return count;
    });

    const deletedCount = deleteBatch(ids);
    res.json({ message: `Successfully deleted ${deletedCount} faculty members`, count: deletedCount });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete faculty batch' });
  }
});

// Delete faculty member
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM faculty WHERE id = ?').run(id);
    res.json({ message: 'Faculty removed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete faculty member' });
  }
});

// Delete all faculty
router.delete('/', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM faculty').run();
    res.json({ message: 'All faculty removed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete all faculty' });
  }
});

module.exports = router;
