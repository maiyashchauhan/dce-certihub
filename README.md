# 🎓 EduCert Pro - College Certificate Generation & QR Verification System

A complete full-stack web application designed for colleges and universities to create, manage, bulk generate, and verify high-resolution **Printable Landscape A4 PDF & Image certificates** for hackathons, workshops, conferences, academic merit, and internships.

---

## 🌟 Key Features

### 1. 🖨️ Printable Landscape Format (A4 Standard)
- Tailored for high-density **A4 Landscape (297mm × 210mm)** printing.
- **Export Formats**:
  - **High-Definition PDF**: Ready-to-print vector-accurate PDF with custom filenames.
  - **High-Resolution PNG**: Crisp lossless image download.
  - **JPG Format**: Standard lightweight image.
  - **Direct Browser Print**: Native print stylesheet support.

### 2. 👁️ Interactive Real-Time Live Preview Studio
- Preview every change in real time as you type recipient names, roll numbers, events, and citations.
- Zoom controls (**Fit, 75%, 100%**) for pixel-perfect inspection.
- Auto-generate or custom unique Certificate ID (`CERT-2026-XXXXX`).
- Fast Citation Presets for:
  - 🏆 **1st Place Winner**
  - 🥈 **2nd Place Winner**
  - 🥉 **3rd Place Winner**
  - 🎖️ **Participation**
  - 💼 **Internship Completion**
  - ⭐ **Academic Merit**

### 3. 🎨 5 Professional Landscape Templates
1. **Classic Academic**: Traditional ornate borders, gold foil seal graphic, serif typography, dual signature lines.
2. **Modern Tech & Hackathon**: Cyber geometric borders, neon accents, futuristic badge, and tech styling.
3. **Prestige Gold / Achievement**: Deep navy parchment, metallic gold gradient rules, luxury honor crest.
4. **Minimalist Corporate / Internship**: Clean Swiss layout, modern typography, subtle borders for corporate internships.
5. **Vibrant Cultural & Sports**: Rich burgundy/crimson and gold festivity borders, celebratory laurels.

### 4. 🔍 Live QR Code Verification Portal
- Every generated certificate embeds a **live dynamic QR code**.
- Scanning the QR code or visiting `/verify/:certId` opens the public verification report:
  - 🛡️ **Verified Authenticity Badge** (Green verified tick or Red alert if revoked/invalid).
  - Recipient Name, Roll Number, Department, and Course.
  - Event Name, Date, and Issuing College.
  - Award Tier (1st/2nd/3rd Place, Winner, Participant).
  - Issuing Authorities (Dean, Principal, Coordinator).
  - Live Certificate Rendering + Download Verified PDF button.

### 5. ⚡ Bulk Certificate Generation
- **Method A: From Excel / CSV File**:
  - Upload `.xlsx` or `.csv` spreadsheets.
  - Live table preview of parsed records before creation.
  - 1-Click batch generation: generates certificates, stores in database, assigns unique IDs & QR codes.
  - Pre-packaged sample CSV download button.
- **Method B: From Event Participants**:
  - Select any event from the system.
  - Filter: "All Participants" or "Winners Only (1st, 2nd, 3rd place)".
  - Batch generate certificates in seconds.

### 6. 🏛️ Complete Campus Management Modules
- **Faculty Management**:
  - Employee ID, Name, Department, Designation, Coordinator Authorization, and Digital Signatures.
- **Student Database**:
  - Roll Number, Name, Course, Academic Year, Department, Email, and Phone.
  - Add manually or bulk import via Excel/CSV.
  - 1-Click "Issue Certificate" shortcut per student.
- **Events & Hackathons**:
  - Manage competitions, dates, categories, and coordinators.
  - Register Individual or Team participants (with team members).
  - Designate Winners: **1st Place, 2nd Place, 3rd Place, Runner-up, Special Category Award**.
  - Participant CSV import.
- **Certificate Registry & Audit**:
  - Searchable master table of all issued certificates.
  - Real-time validity toggling (Revoke / Revalidate).

---

## 🚀 Quick Start Guide

### 1. Start the Application
In your terminal, run:
```bash
npm start
```
The application will start on: **[http://localhost:5000](http://localhost:5000)**

### 2. Pre-Seeded Accounts
You can log in manually or use the **1-Click Quick Fill buttons** on the sign-in page:

| Role | Email | Password | Name |
|---|---|---|---|
| **Admin / Dean** | `admin@college.edu` | `admin123` | Dr. Rajesh Sharma |
| **Faculty Coordinator** | `faculty@college.edu` | `faculty123` | Prof. Ananya Sen |

---

## 📁 Sample Spreadsheets Included
Ready-to-use CSV files are included in `uploads/samples/`:
- `bulk-certificates-sample.csv`: Sample for bulk certificate generation.
- `students-sample.csv`: Sample for student database bulk import.
- `participants-sample.csv`: Sample for event participant bulk registration.

---

## 🛠️ Technology Stack
- **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons, jsPDF, html2canvas, canvas-confetti.
- **Backend**: Node.js, Express, Better-SQLite3, Multer, QRCode, XLSX, JWT, BCrypt.
- **Database**: SQLite with foreign keys and WAL mode for persistence.
