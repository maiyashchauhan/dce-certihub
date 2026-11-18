const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });

// Get all students with search and filter
router.get('/', authenticateToken, (req, res) => {
  const { search, department, year } = req.query;

  try {
    let query = 'SELECT * FROM students WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (name LIKE ? OR roll_number LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (department && department !== 'All') {
      query += ' AND department = ?';
      params.push(department);
    }

    if (year && year !== 'All') {
      query += ' AND year = ?';
      params.push(year);
    }

    query += ' ORDER BY roll_number ASC';

    const students = db.prepare(query).all(...params);
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Add single student
router.post('/', authenticateToken, (req, res) => {
  const { roll_number, name, course, year, department, email, phone } = req.body;

  if (!roll_number || !name || !department || !email) {
    return res.status(400).json({ error: 'Roll number, Name, Department, and Email are required' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO students (roll_number, name, course, year, department, email, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      roll_number.trim().toUpperCase(),
      name.trim(),
      course || 'B.Tech',
      year || '1st Year',
      department.trim(),
      email.trim(),
      phone || ''
    );

    res.status(201).json({ id: result.lastInsertRowid, message: 'Student added successfully' });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Student with this roll number already exists' });
    }
    res.status(500).json({ error: 'Failed to add student' });
  }
});

// Update student
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { roll_number, name, course, year, department, email, phone } = req.body;

  try {
    const stmt = db.prepare(`
      UPDATE students
      SET roll_number = COALESCE(?, roll_number),
          name = COALESCE(?, name),
          course = COALESCE(?, course),
          year = COALESCE(?, year),
          department = COALESCE(?, department),
          email = COALESCE(?, email),
          phone = COALESCE(?, phone)
      WHERE id = ?
    `);

    stmt.run(roll_number ? roll_number.toUpperCase() : null, name, course, year, department, email, phone, id);
    res.json({ message: 'Student updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// Delete student
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM students WHERE id = ?').run(id);
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// Batch delete students
router.post('/batch-delete', authenticateToken, (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Array of student IDs required' });
  }

  try {
    const deleteBatch = db.transaction((idList) => {
      const stmt = db.prepare('DELETE FROM students WHERE id = ?');
      let count = 0;
      for (const id of idList) {
        stmt.run(id);
        count++;
      }
      return count;
    });

    const deletedCount = deleteBatch(ids);
    res.json({ message: `Successfully deleted ${deletedCount} students`, count: deletedCount });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete students batch' });
  }
});

// Delete all students
router.delete('/', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM students').run();
    res.json({ message: 'All students deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete all students' });
  }
});

// Bulk upload students via CSV or Excel
router.post('/import-file', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No CSV or Excel file uploaded' });
  }

  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (!rows || rows.length === 0) {
      return res.status(400).json({ error: 'The uploaded file contains no data rows' });
    }

    const insertStmt = db.prepare(`
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

    let importedCount = 0;
    const insertTransaction = db.transaction((studentList) => {
      for (const row of studentList) {
        // Support flexible column names
        const roll = row['Roll Number'] || row['roll_number'] || row['RollNo'] || row['Roll_No'] || row['Roll'];
        const name = row['Name'] || row['Student Name'] || row['student_name'];
        const course = row['Course'] || row['course'] || 'B.Tech';
        const year = row['Year'] || row['year'] || '1st Year';
        const department = row['Department'] || row['department'] || row['Branch'] || 'Engineering';
        const email = row['Email'] || row['email'] || row['Student Email'] || `${roll ? roll.toLowerCase() : 'student'}@college.edu`;
        const phone = row['Phone'] || row['phone'] || row['Contact'] || '';

        if (roll && name) {
          insertStmt.run(String(roll).trim().toUpperCase(), String(name).trim(), String(course).trim(), String(year).trim(), String(department).trim(), String(email).trim(), String(phone).trim());
          importedCount++;
        }
      }
    });

    insertTransaction(rows);

    res.json({
      message: `Successfully processed file and imported/updated ${importedCount} students`,
      count: importedCount
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Failed to process student import file: ' + error.message });
  }
});

module.exports = router;
