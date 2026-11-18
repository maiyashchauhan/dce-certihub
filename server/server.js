const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static directory for uploaded logos and signatures
const uploadsDir = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Fallback handlers for /uploads/signatures and /uploads/logos
app.get('/uploads/signatures/:filename', (req, res, next) => {
  const p1 = path.join(uploadsDir, 'signatures', req.params.filename);
  if (fs.existsSync(p1)) return res.sendFile(p1);
  const p2 = path.join(uploadsDir, req.params.filename);
  if (fs.existsSync(p2)) return res.sendFile(p2);
  next();
});

app.get('/uploads/logos/:filename', (req, res, next) => {
  const p1 = path.join(uploadsDir, 'logos', req.params.filename);
  if (fs.existsSync(p1)) return res.sendFile(p1);
  const p2 = path.join(uploadsDir, req.params.filename);
  if (fs.existsSync(p2)) return res.sendFile(p2);
  next();
});

// Multer storage for images (logos and signatures)
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const prefix = req.body.type || file.fieldname || 'img';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${prefix}-${uniqueSuffix}${ext}`);
  }
});

const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Single image upload endpoint (logo or signature)
app.post('/api/upload', uploadImage.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;

  res.json({
    message: 'File uploaded successfully',
    url: fileUrl,
    filename: req.file.filename
  });
});

// Sample template download route
app.get('/api/samples/:filename', (req, res) => {
  const samplePath = path.join(uploadsDir, 'samples', req.params.filename);
  if (fs.existsSync(samplePath)) {
    res.download(samplePath);
  } else {
    res.status(404).json({ error: 'Sample file not found' });
  }
});

// Mount Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/faculty', require('./routes/faculty'));
app.use('/api/students', require('./routes/students'));
app.use('/api/events', require('./routes/events'));
app.use('/api/certificates', require('./routes/certificates'));
app.use('/api/verify', require('./routes/verify'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/data', require('./routes/data'));
app.use('/api/student', require('./routes/student'));

// Serve client in production if built
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      return res.sendFile(path.join(clientDist, 'index.html'));
    }
    next();
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🎓 College Certificate Generator Backend Online`);
  console.log(`🚀 Port: http://localhost:${PORT}`);
  console.log(`📋 Admin Login: admin@college.edu / admin123`);
  console.log(`📋 Faculty Login: faculty@college.edu / faculty123`);
  console.log(`===============================================`);
});
