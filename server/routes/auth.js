const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        employee_id: user.employee_id,
        designation: user.designation
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        employee_id: user.employee_id,
        designation: user.designation,
        signature_url: user.signature_url
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Register new faculty (accessible by admin or registration)
router.post('/register', (req, res) => {
  const { email, password, name, employee_id, department, designation, role } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const assignedRole = role === 'admin' ? 'admin' : 'faculty';

    const insertUser = db.prepare(`
      INSERT INTO users (email, password, name, role, employee_id, department, designation)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertUser.run(
      email.toLowerCase().trim(),
      hashedPassword,
      name.trim(),
      assignedRole,
      employee_id || `EMP-${Date.now().toString().slice(-4)}`,
      department || 'General',
      designation || (assignedRole === 'admin' ? 'Administrator' : 'Faculty Member')
    );

    // Also register in faculty table if faculty
    if (assignedRole === 'faculty') {
      db.prepare(`
        INSERT INTO faculty (user_id, employee_id, name, department, designation, email)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        result.lastInsertRowid,
        employee_id || `EMP-${Date.now().toString().slice(-4)}`,
        name.trim(),
        department || 'General',
        designation || 'Faculty Member',
        email.toLowerCase().trim()
      );
    }

    res.status(201).json({ message: 'User registered successfully', userId: result.lastInsertRowid });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Get current user profile
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, email, name, role, employee_id, department, designation, signature_url FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update profile
router.put('/profile', authenticateToken, (req, res) => {
  const { name, department, designation, signature_url } = req.body;
  try {
    db.prepare(`
      UPDATE users
      SET name = COALESCE(?, name),
          department = COALESCE(?, department),
          designation = COALESCE(?, designation),
          signature_url = COALESCE(?, signature_url)
      WHERE id = ?
    `).run(name, department, designation, signature_url, req.user.id);

    const updated = db.prepare('SELECT id, email, name, role, employee_id, department, designation, signature_url FROM users WHERE id = ?').get(req.user.id);
    res.json({ message: 'Profile updated', user: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Verify email for password reset
router.post('/verify-reset-email', (req, res) => {
  const { email } = req.body;
  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'College email is required' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const user = db.prepare('SELECT id, name, email, department, role, employee_id FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))').get(cleanEmail);
    if (!user) {
      return res.status(404).json({ error: `No registered user found with email "${cleanEmail}"` });
    }

    res.json({
      exists: true,
      name: user.name,
      department: user.department,
      role: user.role,
      maskedEmployeeId: user.employee_id ? `${user.employee_id.slice(0, 3)}••••` : null
    });
  } catch (error) {
    console.error('Verify reset email error:', error);
    res.status(500).json({ error: 'Failed to verify account: ' + error.message });
  }
});

// Reset password
router.post('/reset-password', (req, res) => {
  const { email, newPassword, confirmPassword, employee_id, department } = req.body;

  if (!email || !email.trim() || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required' });
  }

  const cleanEmail = email.trim().toLowerCase();

  if (confirmPassword && newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'New password and confirmation password do not match' });
  }

  if (newPassword.length < 4) {
    return res.status(400).json({ error: 'New password must be at least 4 characters long' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))').get(cleanEmail);
    if (!user) {
      return res.status(404).json({ error: `No account found with email "${cleanEmail}". Please check your email or create an account.` });
    }

    if (department && department.trim() && user.department && user.department.toLowerCase() !== department.trim().toLowerCase()) {
      return res.status(400).json({ error: 'Department does not match registered profile' });
    }

    if (employee_id && employee_id.trim() && user.employee_id && user.employee_id.toLowerCase() !== employee_id.trim().toLowerCase()) {
      return res.status(400).json({ error: 'Employee ID does not match registered profile' });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, user.id);

    try {
      db.prepare('INSERT INTO activity_logs (user_name, action, details) VALUES (?, ?, ?)').run(
        user.name,
        'PASSWORD_RESET',
        `User ${user.email} successfully updated their password`
      );
    } catch (e) {
      // non-fatal
    }

    res.json({
      success: true,
      message: 'Password reset successfully! You can now sign in with your new password.',
      email: user.email
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password: ' + error.message });
  }
});

module.exports = router;
