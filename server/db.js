const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// Enable WAL mode for high performance
db.pragma('journal_mode = WAL');

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'faculty',
    employee_id TEXT,
    department TEXT,
    designation TEXT,
    signature_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS faculty (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    employee_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    designation TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    signature_url TEXT,
    is_coordinator INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    roll_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    course TEXT NOT NULL,
    year TEXT NOT NULL,
    department TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    event_date TEXT NOT NULL,
    department TEXT NOT NULL,
    description TEXT,
    organization TEXT NOT NULL,
    coordinator_name TEXT NOT NULL,
    coordinator_title TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    student_id INTEGER,
    name TEXT NOT NULL,
    roll_number TEXT,
    email TEXT,
    department TEXT,
    participant_type TEXT DEFAULT 'individual',
    team_name TEXT,
    team_members TEXT,
    participation_status TEXT DEFAULT 'Participant',
    award_type TEXT DEFAULT 'Participation',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS certificates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    certificate_id TEXT UNIQUE NOT NULL,
    recipient_name TEXT NOT NULL,
    recipient_email TEXT,
    roll_number TEXT,
    department TEXT,
    course TEXT,
    event_id INTEGER,
    event_name TEXT NOT NULL,
    event_date TEXT NOT NULL,
    organization TEXT NOT NULL,
    certificate_type TEXT NOT NULL DEFAULT 'participation',
    rank_or_role TEXT DEFAULT 'Participant',
    template_id TEXT NOT NULL DEFAULT 'classic',
    coordinator_name TEXT NOT NULL,
    coordinator_title TEXT NOT NULL,
    hod_name TEXT,
    hod_title TEXT DEFAULT 'Head of Department (HOD)',
    authority_name TEXT NOT NULL,
    authority_title TEXT NOT NULL,
    logo_url TEXT,
    signature_url TEXT,
    secondary_signature_url TEXT,
    hod_signature_url TEXT,
    seal_url TEXT,
    qr_code_data TEXT,
    verification_url TEXT,
    issue_date TEXT NOT NULL,
    is_valid INTEGER DEFAULT 1,
    citation_text TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE SET NULL,
    FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name TEXT,
    action TEXT NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Safe column migrations for existing databases
try {
  db.exec("ALTER TABLE certificates ADD COLUMN seal_url TEXT");
} catch (e) {
  // column already exists
}
try {
  db.exec("ALTER TABLE certificates ADD COLUMN hod_name TEXT");
} catch (e) {
  // column already exists
}
try {
  db.exec("ALTER TABLE certificates ADD COLUMN hod_title TEXT DEFAULT 'Head of Department (HOD)'");
} catch (e) {
  // column already exists
}
try {
  db.exec("ALTER TABLE certificates ADD COLUMN hod_signature_url TEXT");
} catch (e) {
  // column already exists
}

// Seed default users if empty
const countUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (countUsers.count === 0) {
  const hashAdmin = bcrypt.hashSync('admin123', 10);
  const hashFaculty = bcrypt.hashSync('faculty123', 10);

  const insertUser = db.prepare(`
    INSERT INTO users (email, password, name, role, employee_id, department, designation)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const adminResult = insertUser.run(
    'admin@college.edu',
    hashAdmin,
    'Dr. Rajesh Sharma',
    'admin',
    'EMP-ADM-001',
    'Administration',
    'Dean & Principal'
  );

  const facultyResult = insertUser.run(
    'faculty@college.edu',
    hashFaculty,
    'Prof. Ananya Sen',
    'faculty',
    'FAC-CSE-104',
    'Computer Science and Engineering',
    'Associate Professor & Event Coordinator'
  );

  // Seed Faculty Table
  const insertFaculty = db.prepare(`
    INSERT INTO faculty (user_id, employee_id, name, department, designation, email, phone, is_coordinator)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertFaculty.run(adminResult.lastInsertRowid, 'EMP-ADM-001', 'Dr. Rajesh Sharma', 'Administration', 'Dean & Principal', 'admin@college.edu', '+91 98765 43210', 1);
  insertFaculty.run(facultyResult.lastInsertRowid, 'FAC-CSE-104', 'Prof. Ananya Sen', 'Computer Science and Engineering', 'Associate Professor & Event Coordinator', 'faculty@college.edu', '+91 98765 12345', 1);
  insertFaculty.run(null, 'FAC-ECE-202', 'Dr. Vikram Malhotra', 'Electronics and Communication Engineering', 'Head of Department', 'vikram.m@college.edu', '+91 98111 22334', 1);
  insertFaculty.run(null, 'FAC-ME-305', 'Prof. Sunita Deshmukh', 'Mechanical Engineering', 'Assistant Professor', 'sunita.d@college.edu', '+91 98222 33445', 1);

  // Remove mock students, events, participants, and certificates.
  // The system starts with a clean slate for real data, only keeping the initial faculty accounts for login.


  // Log initial seeding
  db.prepare(`INSERT INTO activity_logs (user_name, action, details) VALUES (?, ?, ?)`).run(
    'System',
    'DATABASE_INITIALIZED',
    'Pre-seeded admin, faculty.'
  );
}

module.exports = db;
