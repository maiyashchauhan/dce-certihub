import React, { useState, useEffect, useRef } from 'react';
import {
  Award,
  Download,
  Printer,
  Sparkles,
  RefreshCw,
  Upload,
  Save,
  CheckCircle,
  QrCode,
  FileText,
  UserCheck,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Copy,
  ExternalLink,
  PenTool
} from 'lucide-react';
import confetti from 'canvas-confetti';
import CertificateRenderer from '../components/templates/CertificateRenderer';
import SignaturePadModal from '../components/SignaturePadModal';
import {
  downloadAsPDF,
  downloadAsPNG,
  downloadAsJPG,
  saveCertificateToOneDrive,
  saveCertificateToDrive,
  printCertificate
} from '../utils/exportCertificate';
import { OneDriveIcon } from '../components/OneDriveModal';
import {
  generateSingleCertificate,
  getStudentsList,
  getEventsList,
  uploadFile
} from '../services/api';
import {
  DEFAULT_COLLEGE_LOGO,
  DEFAULT_HOD_SIGNATURE,
  DEFAULT_PRINCIPAL_SIGNATURE,
  DEFAULT_COORDINATOR_SIGNATURE
} from '../utils/defaultAssets';
import { COLLEGE_DEPARTMENTS } from '../constants/departments';

export default function CertificateStudioView({
  initialData = null,
  onCertificateSaved
}) {
  const [formData, setFormData] = useState({
    certificate_id: 'CERT-2026-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
    recipient_name: '',
    recipient_email: '',
    roll_number: '',
    department: '',
    course: '',
    event_id: null,
    event_name: '',
    event_date: new Date().toISOString().split('T')[0],
    organization: 'Dronacharya College of Engineering',
    certificate_type: 'participation',
    rank_or_role: '',
    template_id: 'classic',
    coordinator_name: '',
    coordinator_title: 'Event Coordinator',
    hod_name: '',
    hod_title: 'Head of Department (HOD)',
    authority_name: '',
    authority_title: 'Principal',
    logo_url: DEFAULT_COLLEGE_LOGO,
    signature_url: DEFAULT_COORDINATOR_SIGNATURE,
    hod_signature_url: DEFAULT_HOD_SIGNATURE,
    secondary_signature_url: DEFAULT_PRINCIPAL_SIGNATURE,
    qr_code_data: '',
    issue_date: new Date().toISOString().split('T')[0],
    citation_text: ''
  });

  const [students, setStudents] = useState([]);
  const [events, setEvents] = useState([]);
  const [zoom, setZoom] = useState(0.72); // Optimal scale to fit nicely in 2-column layout
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(null);
  const [lastSavedDraft, setLastSavedDraft] = useState(null);
  const [hasDraftRestored, setHasDraftRestored] = useState(false);

  const [signatureModal, setSignatureModal] = useState({
    isOpen: false,
    field: null,
    title: '',
    signerName: ''
  });

  const openDrawSignature = (field, title, signerName) => {
    setSignatureModal({
      isOpen: true,
      field,
      title,
      signerName
    });
  };

  const handleSaveDrawnSignature = (url) => {
    if (signatureModal.field) {
      setFormData(prev => ({
        ...prev,
        [signatureModal.field]: url
      }));
    }
  };

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
      generateLocalQRCode(initialData.certificate_id || formData.certificate_id);
    } else {
      // Check for locally saved draft
      const savedDraft = localStorage.getItem('cert_studio_draft');
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          // If draft contains old dummy names, clear it out to keep fresh
          if (parsed.recipient_name === 'Aarav Patel' || parsed.recipient_name === 'Pooja Hegde' || (parsed.organization && parsed.organization.includes('Apex'))) {
            localStorage.removeItem('cert_studio_draft');
            generateLocalQRCode(formData.certificate_id);
          } else {
            setFormData(prev => ({ ...prev, ...parsed, organization: parsed.organization || 'Dronacharya College of Engineering' }));
            setHasDraftRestored(true);
            generateLocalQRCode(parsed.certificate_id || formData.certificate_id);
          }
        } catch (e) {
          console.error('Failed to parse local draft:', e);
          generateLocalQRCode(formData.certificate_id);
        }
      } else {
        generateLocalQRCode(formData.certificate_id);
      }
    }
    loadAutofillOptions();
  }, []);

  // Auto-save form data to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem('cert_studio_draft', JSON.stringify(formData));
      setLastSavedDraft(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) {
      console.warn('LocalStorage save warning:', e);
    }
  }, [formData]);

  const handleClearDraft = () => {
    localStorage.removeItem('cert_studio_draft');
    setHasDraftRestored(false);
    handleRegenerateId();
    alert('Local certificate draft cleared.');
  };

  const handleQuickFillSampleCertificate = () => {
    const newId = 'CERT-2026-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    const sample = {
      certificate_id: newId,
      recipient_name: 'Pooja Hegde',
      recipient_email: 'pooja.hegde@student.college.edu',
      roll_number: '23BCS108',
      department: 'Computer Science & Engineering',
      course: 'B.Tech CSE',
      event_id: null,
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
      issue_date: new Date().toISOString().split('T')[0],
      citation_text: 'For securing First Position in the 36-hour National Hackathon CodeMatrix 2026 with an innovative AI healthcare solution.'
    };
    setFormData(prev => ({ ...prev, ...sample }));
    generateLocalQRCode(newId);
  };

  const loadAutofillOptions = async () => {
    try {
      const [studRes, evRes] = await Promise.all([
        getStudentsList(),
        getEventsList()
      ]);
      setStudents(studRes.data || []);
      setEvents(evRes.data || []);
    } catch (err) {
      console.error('Failed to load autofill data:', err);
    }
  };

  // Generate a local QR code using canvas or api for live preview
  const generateLocalQRCode = (certId) => {
    import('qrcode').then(QRCode => {
      const verifyUrl = `${window.location.origin}/verify/${certId}`;
      QRCode.toDataURL(verifyUrl, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 250,
        color: { dark: '#0f172a', light: '#ffffff' }
      }).then(url => {
        setFormData(prev => ({ ...prev, qr_code_data: url, verification_url: verifyUrl }));
      });
    }).catch(err => {
      console.warn('QR code generator note:', err);
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'certificate_id') {
      generateLocalQRCode(value);
    }
  };

  const handleRegenerateId = () => {
    const newId = 'CERT-2026-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    setFormData(prev => ({ ...prev, certificate_id: newId }));
    generateLocalQRCode(newId);
  };

  const handleAutofillStudent = (e) => {
    const studentId = e.target.value;
    if (!studentId) return;
    const student = students.find(s => s.id === Number(studentId));
    if (student) {
      setFormData(prev => ({
        ...prev,
        recipient_name: student.name,
        roll_number: student.roll_number,
        department: student.department,
        course: student.course,
        recipient_email: student.email
      }));
    }
  };

  const handleAutofillEvent = (e) => {
    const eventId = e.target.value;
    if (!eventId) return;
    const ev = events.find(item => item.id === Number(eventId));
    if (ev) {
      setFormData(prev => ({
        ...prev,
        event_id: ev.id,
        event_name: ev.title,
        event_date: ev.event_date,
        organization: ev.organization,
        coordinator_name: ev.coordinator_name || prev.coordinator_name,
        coordinator_title: ev.coordinator_title || prev.coordinator_title
      }));
    }
  };

  const applyPresetCitation = (presetType) => {
    let citation = '';
    let certType = 'participation';
    let role = 'Participant';

    switch (presetType) {
      case 'winner1':
        certType = 'winner';
        role = '1st Place Winner';
        citation = `For securing First Position in ${formData.event_name || 'the collegiate event'} organized by ${formData.organization || 'Dronacharya College of Engineering'}.`;
        break;
      case 'winner2':
        certType = 'winner';
        role = '2nd Place Winner';
        citation = `For securing Second Position in ${formData.event_name || 'the collegiate event'} organized by ${formData.organization || 'Dronacharya College of Engineering'}.`;
        break;
      case 'winner3':
        certType = 'winner';
        role = '3rd Place Winner';
        citation = `For securing Third Position in ${formData.event_name || 'the collegiate event'} organized by ${formData.organization || 'Dronacharya College of Engineering'}.`;
        break;
      case 'internship':
        certType = 'internship';
        role = 'Research & Engineering Intern';
        citation = `For successfully completing the industrial internship training program at ${formData.organization || 'Dronacharya College of Engineering'} with exemplary performance and dedication.`;
        break;
      case 'merit':
        certType = 'merit';
        role = 'Academic Honor';
        citation = `Conferred for demonstrating outstanding academic excellence, technical leadership, and scholarly merit.`;
        break;
      case 'participation':
      default:
        certType = 'participation';
        role = 'Participant';
        citation = `In recognition of active participation and notable contribution to ${formData.event_name || 'the event'} organized by ${formData.organization || 'Dronacharya College of Engineering'}.`;
        break;
    }

    setFormData(prev => ({
      ...prev,
      certificate_type: certType,
      rank_or_role: role,
      citation_text: citation
    }));
  };

  const handleFileUpload = (e, fieldType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant local preview so certificate updates with 0ms lag
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target.result;
      setFormData(prev => ({ ...prev, [fieldType]: dataUrl }));
    };
    reader.readAsDataURL(file);

    // Upload to server in background
    uploadFile(file, fieldType === 'logo_url' ? 'logo' : 'signature')
      .then(res => {
        if (res?.data?.url) {
          setFormData(prev => ({ ...prev, [fieldType]: res.data.url }));
        }
      })
      .catch(err => {
        console.warn('Backend upload note (instant preview active):', err);
      });
  };

  // Save to backend database
  const handleSaveToDatabase = async () => {
    setSaving(true);
    try {
      const res = await generateSingleCertificate(formData);
      setSavedSuccess(res.data.certificate);

      // Auto-regenerate ID so the next certificate is ready
      handleRegenerateId();

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });

      if (onCertificateSaved) {
        onCertificateSaved(res.data.certificate);
      }
    } catch (err) {
      alert('Error saving certificate: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  // Export handlers
  const handleDownloadPDF = async () => {
    setExporting(true);
    try {
      const timestamp = new Date().getTime();
      const rawName = (formData.recipient_name || 'Certificate').trim().replace(/\s+/g, '_');
      const filename = `${rawName}_${formData.certificate_id}_${timestamp}.pdf`;
      await downloadAsPDF('certificate-canvas', filename);
    } catch (err) {
      console.error('PDF generation error:', err);
      const msg = err?.message || (err?.type ? `Canvas event error: ${err.type}` : String(err || 'Unknown error'));
      alert('PDF generation failed: ' + msg);
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadPNG = async () => {
    setExporting(true);
    try {
      const timestamp = new Date().getTime();
      const rawName = (formData.recipient_name || 'Certificate').trim().replace(/\s+/g, '_');
      const filename = `${rawName}_${formData.certificate_id}_${timestamp}.png`;
      await downloadAsPNG('certificate-canvas', filename);
    } catch (err) {
      console.error('PNG download error:', err);
      const msg = err?.message || (err?.type ? `Canvas event error: ${err.type}` : String(err || 'Unknown error'));
      alert('PNG download failed: ' + msg);
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadJPG = async () => {
    setExporting(true);
    try {
      const timestamp = new Date().getTime();
      const rawName = (formData.recipient_name || 'Certificate').trim().replace(/\s+/g, '_');
      const filename = `${rawName}_${formData.certificate_id}_${timestamp}.jpg`;
      await downloadAsJPG('certificate-canvas', filename);
    } catch (err) {
      console.error('JPG download error:', err);
      const msg = err?.message || (err?.type ? `Canvas event error: ${err.type}` : String(err || 'Unknown error'));
      alert('JPG download failed: ' + msg);
    } finally {
      setExporting(false);
    }
  };

  const [savingToDrive, setSavingToDrive] = useState(false);

  const handleSaveToDriveDirect = async () => {
    setSavingToDrive(true);
    try {
      const timestamp = new Date().getTime();
      const rawName = (formData.recipient_name || 'Certificate').trim().replace(/\s+/g, '_');
      const filename = `${rawName}_${formData.certificate_id}_${timestamp}.pdf`;
      await saveCertificateToOneDrive('certificate-canvas', filename, 'pdf');
    } catch (err) {
      console.error('Direct OneDrive save error:', err);
      const msg = err?.message || String(err || 'Failed to save to Microsoft OneDrive');
      alert('OneDrive save: ' + msg);
    } finally {
      setSavingToDrive(false);
    }
  };

  const templatesList = [
    { id: 'classic', name: 'Classic Academic', desc: 'Regal ornate border, gold foil accents' },
    { id: 'nss', name: 'NSS Template', desc: 'Light theme for NSS events' },
    { id: 'minimal', name: 'Minimal Corporate', desc: 'Swiss layout, clean lines, internship' },
    { id: 'cultural', name: 'Vibrant Cultural & Sports', desc: 'Burgundy & gold festive border' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Certificate Studio & Designer</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
              Live Preview Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Design, customize details, inspect live in A4 Landscape, and export instant printable PDF & image formats.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleSaveToDatabase}
            disabled={saving}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Registering...' : 'Save & Register Certificate'}</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={exporting}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-md transition active:scale-95 disabled:opacity-50"
            title="Download PDF to computer and auto-save to Microsoft OneDrive"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>{exporting ? 'Downloading...' : 'Download PDF'}</span>
          </button>
          <button
            onClick={handleSaveToDriveDirect}
            disabled={savingToDrive || exporting}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Directly save PDF to your personal Microsoft OneDrive"
          >
            <OneDriveIcon className="w-4 h-4" />
            <span className="hidden md:inline">{savingToDrive ? 'Saving...' : 'OneDrive'}</span>
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={handleDownloadPNG}
              disabled={exporting}
              className="p-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition font-semibold text-xs"
              title="Download PNG Image"
            >
              PNG
            </button>
            <button
              onClick={handleDownloadJPG}
              disabled={exporting}
              className="p-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition font-semibold text-xs"
              title="Download JPG Image"
            >
              JPG
            </button>
            <button
              onClick={printCertificate}
              className="p-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              title="Print Certificate"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Save Success Alert */}
      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-emerald-900 animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold">
                Certificate Successfully Saved & Registered in Database!
              </p>
              <p className="text-xs text-emerald-700 font-mono mt-0.5">
                Certificate ID: <strong>{savedSuccess.certificate_id}</strong> • Verification URL is now officially active.
              </p>
            </div>
          </div>
          <a
            href={`/verify/${savedSuccess.certificate_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition"
          >
            <span>Verify Live</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Local Storage Draft & Quick Fill Status Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-slate-200 rounded-2xl p-3 sm:px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>
            <strong className="text-white">Local Draft:</strong> Auto-saved to browser storage
            {lastSavedDraft && <span className="text-slate-400 font-mono ml-1.5">({lastSavedDraft})</span>}
          </span>
          {hasDraftRestored && (
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 font-bold text-[10px]">
              Draft Restored
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleQuickFillSampleCertificate}
            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>⚡ Fill Sample Certificate</span>
          </button>
          <button
            type="button"
            onClick={handleClearDraft}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
          >
            Clear Draft
          </button>
        </div>
      </div>

      {/* Main Studio 2-Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Controls & Form (5 Cols) */}
        <div className="xl:col-span-5 space-y-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm max-h-[88vh] overflow-y-auto">
          {/* Template Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              1. Choose Landscape Template Design
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {templatesList.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => setFormData(prev => ({ ...prev, template_id: tpl.id }))}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    formData.template_id === tpl.id
                      ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="font-bold text-xs text-slate-900">{tpl.name}</div>
                  <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{tpl.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              2. Fast Award Citation Presets
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => applyPresetCitation('winner1')}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300"
              >
                🏆 1st Place
              </button>
              <button
                type="button"
                onClick={() => applyPresetCitation('winner2')}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300"
              >
                🥈 2nd Place
              </button>
              <button
                type="button"
                onClick={() => applyPresetCitation('winner3')}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-orange-100 hover:bg-orange-200 text-orange-800 border border-orange-300"
              >
                🥉 3rd Place
              </button>
              <button
                type="button"
                onClick={() => applyPresetCitation('participation')}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300"
              >
                🎖️ Participation
              </button>
              <button
                type="button"
                onClick={() => applyPresetCitation('internship')}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-100 hover:bg-indigo-200 text-indigo-800 border border-indigo-300"
              >
                💼 Internship
              </button>
              <button
                type="button"
                onClick={() => applyPresetCitation('merit')}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-purple-100 hover:bg-purple-200 text-purple-800 border border-purple-300"
              >
                ⭐ Merit Honor
              </button>
            </div>
          </div>

          {/* Recipient Details */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                3. Recipient Information
              </label>
              {students.length > 0 && (
                <select
                  onChange={handleAutofillStudent}
                  defaultValue=""
                  className="text-[11px] border border-slate-300 rounded-lg px-2 py-1 bg-slate-50 text-slate-700"
                >
                  <option value="" disabled>Autofill from Student DB</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.roll_number})</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600">Student / Recipient Full Name *</label>
              <input
                type="text"
                name="recipient_name"
                value={formData.recipient_name}
                onChange={handleInputChange}
                className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="e.g. Aarav Patel"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Roll Number / ID</label>
                <input
                  type="text"
                  name="roll_number"
                  value={formData.roll_number}
                  onChange={handleInputChange}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="e.g. 22BCS101"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Course / Program</label>
                <input
                  type="text"
                  name="course"
                  value={formData.course}
                  onChange={handleInputChange}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="e.g. B.Tech CSE"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600">Department / Branch</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white text-slate-800"
              >
                <option value="">Select Department...</option>
                {formData.department && !COLLEGE_DEPARTMENTS.includes(formData.department) && (
                  <option value={formData.department}>{formData.department}</option>
                )}
                {COLLEGE_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Event & Organization Details */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                4. Event & College Details
              </label>
              {events.length > 0 && (
                <select
                  onChange={handleAutofillEvent}
                  defaultValue=""
                  className="text-[11px] border border-slate-300 rounded-lg px-2 py-1 bg-slate-50 text-slate-700 max-w-[200px] truncate"
                >
                  <option value="" disabled>Autofill from Events</option>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.title}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600">College / Organization Name *</label>
              <input
                type="text"
                name="organization"
                value={formData.organization}
                onChange={handleInputChange}
                className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="e.g. Dronacharya College of Engineering"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600">Event / Hackathon Title *</label>
              <input
                type="text"
                name="event_name"
                value={formData.event_name}
                onChange={handleInputChange}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="e.g. National Hackathon 2026: CodeMatrix"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Event Date</label>
                <input
                  type="date"
                  name="event_date"
                  value={formData.event_date}
                  onChange={handleInputChange}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Certificate Issue Date</label>
                <input
                  type="date"
                  name="issue_date"
                  value={formData.issue_date}
                  onChange={handleInputChange}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Certificate Type</label>
                <select
                  name="certificate_type"
                  value={formData.certificate_type}
                  onChange={handleInputChange}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="participation">Participation</option>
                  <option value="winner">Winner / Excellence</option>
                  <option value="internship">Internship Completion</option>
                  <option value="achievement">Achievement</option>
                  <option value="merit">Academic Merit</option>
                  <option value="completion">Course Completion</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Award Rank / Role</label>
                <input
                  type="text"
                  name="rank_or_role"
                  value={formData.rank_or_role}
                  onChange={handleInputChange}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="e.g. 1st Place Winner"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600">Citation / Commendation Text</label>
              <textarea
                name="citation_text"
                rows={3}
                value={formData.citation_text}
                onChange={handleInputChange}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="Enter customized citation..."
              />
            </div>
          </div>

          {/* Signatories & Logo Upload */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              5. Signatories & Brand Assets
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Coordinator Name</label>
                <input
                  type="text"
                  name="coordinator_name"
                  value={formData.coordinator_name}
                  onChange={handleInputChange}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="(Blank / Optional)"
                />
                <input
                  type="text"
                  name="coordinator_title"
                  value={formData.coordinator_title}
                  onChange={handleInputChange}
                  className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-xl mt-1 text-slate-500"
                  placeholder="Designation (e.g. Coordinator)"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600">HOD Name</label>
                <input
                  type="text"
                  name="hod_name"
                  value={formData.hod_name || ''}
                  onChange={handleInputChange}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="(Blank / Optional)"
                />
                <input
                  type="text"
                  name="hod_title"
                  value={formData.hod_title || 'Head of Department (HOD)'}
                  onChange={handleInputChange}
                  className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-xl mt-1 text-slate-500"
                  placeholder="Designation (e.g. HOD)"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Principal Name</label>
                <input
                  type="text"
                  name="authority_name"
                  value={formData.authority_name}
                  onChange={handleInputChange}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="(Blank / Optional)"
                />
                <input
                  type="text"
                  name="authority_title"
                  value={formData.authority_title}
                  onChange={handleInputChange}
                  className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-xl mt-1 text-slate-500"
                  placeholder="Designation"
                />
              </div>
            </div>

            {/* Upload buttons for Logo and 3 Signatures */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div>
                <label className="text-[10px] font-medium text-slate-600 block mb-1 truncate">College Logo</label>
                <label className="flex items-center justify-center gap-1 px-2 py-1.5 border border-slate-300 hover:border-slate-400 rounded-lg text-[10px] cursor-pointer bg-slate-50 hover:bg-slate-100 transition shadow-xs">
                  <Upload className="w-3 h-3 text-slate-500" />
                  <span>Upload Logo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'logo_url')} />
                </label>
                {formData.logo_url && (
                  <div className="mt-1.5 flex items-center justify-between p-1 bg-slate-50 rounded-md border border-slate-200">
                    <img src={formData.logo_url} alt="Logo" className="w-6 h-6 object-contain bg-white rounded p-0.5 border" />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, logo_url: DEFAULT_COLLEGE_LOGO }))}
                      className="text-[9px] text-slate-400 hover:text-red-500 px-1 font-semibold"
                      title="Reset to default"
                    >
                      Reset
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="text-[10px] font-medium text-slate-600 block mb-1 truncate">Coordinator Sig</label>
                <div className="flex gap-1">
                  <label className="flex-1 flex items-center justify-center gap-1 px-1.5 py-1.5 border border-slate-300 hover:border-slate-400 rounded-lg text-[10px] cursor-pointer bg-slate-50 hover:bg-slate-100 transition" title="Upload image file">
                    <Upload className="w-3 h-3 text-slate-500" />
                    <span>Upload</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'signature_url')} />
                  </label>
                  <button
                    type="button"
                    onClick={() => openDrawSignature('signature_url', 'Draw Coordinator Signature', formData.coordinator_name || formData.coordinator_title)}
                    className="flex-1 flex items-center justify-center gap-1 px-1.5 py-1.5 border border-amber-300 hover:border-amber-400 rounded-lg text-[10px] cursor-pointer bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold transition"
                    title="Draw signature on canvas"
                  >
                    <PenTool className="w-3 h-3 text-amber-600" />
                    <span>Draw</span>
                  </button>
                </div>
                {formData.signature_url && (
                  <div className="mt-1.5 flex items-center justify-between p-1 bg-slate-50 rounded-md border border-slate-200">
                    <img src={formData.signature_url} alt="Sig" className="h-6 max-w-[50px] object-contain bg-white rounded p-0.5 border" />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, signature_url: DEFAULT_COORDINATOR_SIGNATURE }))}
                      className="text-[9px] text-slate-400 hover:text-red-500 px-1 font-semibold"
                      title="Reset to default"
                    >
                      Reset
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="text-[10px] font-medium text-slate-600 block mb-1 truncate">HOD Signature</label>
                <div className="flex gap-1">
                  <label className="flex-1 flex items-center justify-center gap-1 px-1.5 py-1.5 border border-slate-300 hover:border-slate-400 rounded-lg text-[10px] cursor-pointer bg-slate-50 hover:bg-slate-100 transition" title="Upload image file">
                    <Upload className="w-3 h-3 text-slate-500" />
                    <span>Upload</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'hod_signature_url')} />
                  </label>
                  <button
                    type="button"
                    onClick={() => openDrawSignature('hod_signature_url', 'Draw HOD Signature', formData.hod_name || formData.hod_title || 'Head of Department (HOD)')}
                    className="flex-1 flex items-center justify-center gap-1 px-1.5 py-1.5 border border-amber-300 hover:border-amber-400 rounded-lg text-[10px] cursor-pointer bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold transition"
                    title="Draw signature on canvas"
                  >
                    <PenTool className="w-3 h-3 text-amber-600" />
                    <span>Draw</span>
                  </button>
                </div>
                {formData.hod_signature_url && (
                  <div className="mt-1.5 flex items-center justify-between p-1 bg-slate-50 rounded-md border border-slate-200">
                    <img src={formData.hod_signature_url} alt="Sig" className="h-6 max-w-[50px] object-contain bg-white rounded p-0.5 border" />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, hod_signature_url: DEFAULT_HOD_SIGNATURE }))}
                      className="text-[9px] text-slate-400 hover:text-red-500 px-1 font-semibold"
                      title="Reset to default"
                    >
                      Reset
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="text-[10px] font-medium text-slate-600 block mb-1 truncate">Principal Sig</label>
                <div className="flex gap-1">
                  <label className="flex-1 flex items-center justify-center gap-1 px-1.5 py-1.5 border border-slate-300 hover:border-slate-400 rounded-lg text-[10px] cursor-pointer bg-slate-50 hover:bg-slate-100 transition" title="Upload image file">
                    <Upload className="w-3 h-3 text-slate-500" />
                    <span>Upload</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'secondary_signature_url')} />
                  </label>
                  <button
                    type="button"
                    onClick={() => openDrawSignature('secondary_signature_url', 'Draw Principal Signature', formData.authority_name || formData.authority_title)}
                    className="flex-1 flex items-center justify-center gap-1 px-1.5 py-1.5 border border-amber-300 hover:border-amber-400 rounded-lg text-[10px] cursor-pointer bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold transition"
                    title="Draw signature on canvas"
                  >
                    <PenTool className="w-3 h-3 text-amber-600" />
                    <span>Draw</span>
                  </button>
                </div>
                {formData.secondary_signature_url && (
                  <div className="mt-1.5 flex items-center justify-between p-1 bg-slate-50 rounded-md border border-slate-200">
                    <img src={formData.secondary_signature_url} alt="Sig" className="h-6 max-w-[50px] object-contain bg-white rounded p-0.5 border" />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, secondary_signature_url: DEFAULT_PRINCIPAL_SIGNATURE }))}
                      className="text-[9px] text-slate-400 hover:text-red-500 px-1 font-semibold"
                      title="Reset to default"
                    >
                      Reset
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Certificate ID & QR Code */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                6. Unique ID & QR Code
              </label>
              <button
                type="button"
                onClick={handleRegenerateId}
                className="text-[11px] text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Regenerate ID</span>
              </button>
            </div>
            <input
              type="text"
              name="certificate_id"
              value={formData.certificate_id}
              onChange={handleInputChange}
              className="w-full text-xs font-mono font-bold px-3 py-2 border border-slate-300 rounded-xl mt-1.5 uppercase bg-slate-50"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              QR Code links automatically to verification endpoint: /verify/{formData.certificate_id}
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Live Canvas Preview (7 Cols) */}
        <div className="xl:col-span-7 bg-slate-900 rounded-2xl p-4 sm:p-6 shadow-xl border border-slate-800 flex flex-col items-center">
          {/* Zoom and Preview Toolbar */}
          <div className="w-full flex items-center justify-between mb-4 pb-3 border-b border-slate-800 text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-slate-200">Interactive Live Landscape Preview (A4 Printable)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom(prev => Math.max(0.4, Number((prev - 0.1).toFixed(2))))}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-mono text-slate-400 min-w-[45px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(prev => Math.min(1.1, Number((prev + 0.1).toFixed(2))))}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoom(0.72)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
                title="Reset Zoom"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Certificate Canvas Area */}
          <div
            className="w-full flex justify-center overflow-auto py-2 px-1 max-h-[78vh] scrollbar-thin"
            style={{ minHeight: `${793 * zoom}px` }}
          >
            <div
              style={{
                width: '1122px',
                height: '793px',
                transform: `scale(${zoom})`,
                transformOrigin: 'top center',
                marginBottom: `${-(793 * (1 - zoom))}px`,
                marginRight: `${-(1122 * (1 - zoom)) / 2}px`,
                marginLeft: `${-(1122 * (1 - zoom)) / 2}px`
              }}
            >
              <CertificateRenderer
                data={formData}
                elementId="certificate-canvas"
                scale={1}
              />
            </div>
          </div>

          <div className="w-full mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Format: <strong className="text-slate-200">A4 Landscape (297mm × 210mm)</strong>
            </div>
            <div className="font-mono text-[11px] text-amber-400">
              Unique ID: {formData.certificate_id}
            </div>
          </div>
        </div>
      </div>

      <SignaturePadModal
        isOpen={signatureModal.isOpen}
        onClose={() => setSignatureModal(prev => ({ ...prev, isOpen: false }))}
        onSave={handleSaveDrawnSignature}
        title={signatureModal.title}
        signerName={signatureModal.signerName}
      />
    </div>
  );
}
