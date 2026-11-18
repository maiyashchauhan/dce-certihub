import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Search,
  Award,
  Calendar,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  ShieldCheck,
  Copy,
  ExternalLink,
  Printer,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Building,
  User,
  X,
  FileText,
  Lock,
  RotateCcw,
  Home,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';
import { getStudentCertificates } from '../services/api';
import CertificateRenderer from '../components/templates/CertificateRenderer';
import { downloadAsPDF, downloadAsPNG, printCertificate } from '../utils/exportCertificate';

export default function StudentPortalView({ onVerifyCertificate, onOpenAdminLogin }) {
  const [rollNumber, setRollNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [searchedRoll, setSearchedRoll] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [studentInfo, setStudentInfo] = useState(null);
  const [certificates, setCertificates] = useState([]);

  // Modal Preview state
  const [previewCert, setPreviewCert] = useState(null);
  const [modalZoom, setModalZoom] = useState(0.62);

  const calculateFitZoom = () => {
    if (typeof window === 'undefined') return 0.62;
    const availableW = Math.min(window.innerWidth - 64, 1020);
    const availableH = window.innerHeight * 0.72 - 60;
    const scaleW = availableW / 1122;
    const scaleH = availableH / 793;
    const bestScale = Math.min(scaleW, scaleH);
    return Number(Math.max(0.35, Math.min(0.85, bestScale)).toFixed(2));
  };

  useEffect(() => {
    if (previewCert) {
      setModalZoom(calculateFitZoom());
      const handleResize = () => setModalZoom(calculateFitZoom());
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [previewCert]);

  // Background download state
  const [downloadingCertId, setDownloadingCertId] = useState(null);
  const [downloadTargetCert, setDownloadTargetCert] = useState(null);

  // Feedback states
  const [copiedId, setCopiedId] = useState(null);

  // Check URL query parameters or path for initial search
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryRoll = params.get('roll') || params.get('rollNo') || params.get('roll_number');
    const queryName = params.get('name') || '';
    if (queryRoll) {
      setRollNumber(queryRoll);
      if (queryName) setFullName(queryName);
      performSearch(queryRoll, queryName);
    } else {
      const parts = window.location.pathname.split('/');
      if (parts[1] === 'student' && parts[2]) {
        setRollNumber(parts[2]);
        performSearch(parts[2], '');
      }
    }
  }, []);

  const performSearch = async (targetRoll, targetName) => {
    const cleanRoll = (targetRoll !== undefined ? targetRoll : rollNumber).trim().toUpperCase();
    const cleanName = (targetName !== undefined ? targetName : fullName).trim();

    if (!cleanRoll) {
      setErrorMsg('Please enter your Roll Number.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSearchPerformed(true);
    setSearchedRoll(cleanRoll);

    try {
      const res = await getStudentCertificates(cleanRoll, cleanName);
      if (res.data && res.data.success) {
        setStudentInfo(res.data.student || null);
        setCertificates(res.data.certificates || []);
      } else {
        setStudentInfo(null);
        setCertificates([]);
      }
    } catch (err) {
      console.error('Student certificate search error:', err);
      if (err.response?.status === 404) {
        setStudentInfo(null);
        setCertificates([]);
      } else {
        setErrorMsg(err.response?.data?.error || 'Failed to search certificates. Please check your connection and try again.');
        setCertificates([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    performSearch(rollNumber, fullName);
  };

  const handleReset = () => {
    setRollNumber('');
    setFullName('');
    setSearchPerformed(false);
    setErrorMsg(null);
    setStudentInfo(null);
    setCertificates([]);
  };

  const handleCopyCertId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDirectDownload = async (cert, format = 'pdf') => {
    setDownloadingCertId(cert.certificate_id);
    setDownloadTargetCert(cert);

    setTimeout(async () => {
      try {
        const safeName = `${cert.recipient_name || 'Certificate'}_${cert.certificate_id}`.replace(/\s+/g, '_');
        if (format === 'png') {
          await downloadAsPNG('student-download-canvas', `${safeName}.png`);
        } else {
          await downloadAsPDF('student-download-canvas', `${safeName}.pdf`);
        }
      } catch (err) {
        console.error('Download error:', err);
        alert('Download failed: ' + (err.message || 'Please try clicking Preview first.'));
      } finally {
        setDownloadingCertId(null);
        setDownloadTargetCert(null);
      }
    }, 120);
  };

  const handleModalDownloadPDF = async () => {
    if (!previewCert) return;
    try {
      const safeName = `${previewCert.recipient_name || 'Certificate'}_${previewCert.certificate_id}`.replace(/\s+/g, '_');
      await downloadAsPDF('student-modal-cert-canvas', `${safeName}.pdf`);
    } catch (err) {
      console.error('Modal PDF download error:', err);
      alert('PDF generation failed: ' + err.message);
    }
  };

  const handleModalDownloadPNG = async () => {
    if (!previewCert) return;
    try {
      const safeName = `${previewCert.recipient_name || 'Certificate'}_${previewCert.certificate_id}`.replace(/\s+/g, '_');
      await downloadAsPNG('student-modal-cert-canvas', `${safeName}.png`);
    } catch (err) {
      console.error('Modal PNG download error:', err);
      alert('PNG download failed: ' + err.message);
    }
  };

  const handleVerify = (certId) => {
    if (onVerifyCertificate) {
      onVerifyCertificate(certId);
    } else {
      window.open(`/verify/${certId}`, '_blank');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* Top Banner - Official Dronacharya College Header */}
      <div className="bg-[#004b93] text-white rounded-2xl shadow-md overflow-hidden relative">
        {/* Top Navbar Row with Admin login button on upper-right */}
        <div className="px-6 sm:px-10 pt-4 pb-2 flex justify-end">
          {onOpenAdminLogin && (
            <button
              type="button"
              onClick={onOpenAdminLogin}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold backdrop-blur-sm border border-white/20 transition cursor-pointer shadow-sm"
              title="Admin & Faculty Login"
            >
              <Lock className="w-3.5 h-3.5 text-amber-300" />
              <span>Admin Login</span>
            </button>
          )}
        </div>

        {/* Centered College Branding & Title */}
        <div className="max-w-5xl mx-auto px-6 pt-2 pb-10 sm:pb-14 flex flex-col items-center justify-center text-center">
          {/* DRONACHARYA College of Engineering centered */}
          <div className="flex flex-col items-center justify-center select-none mb-5">
            <span className="font-black text-3xl sm:text-5xl tracking-tight text-white uppercase font-sans leading-none drop-shadow-md">
              DRONACHARYA
            </span>
            <span className="text-lg sm:text-2xl font-serif font-medium text-white/95 tracking-wide leading-tight mt-1.5">
              College of Engineering
            </span>
          </div>

          <div className="w-20 h-0.5 bg-amber-400/80 rounded-full mb-4" />

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm font-sans">
            Certificates
          </h1>

          <div className="flex items-center gap-2 mt-2 text-xs sm:text-sm text-blue-100 font-medium">
            <span className="flex items-center gap-1 text-white/90">
              <Home className="w-3.5 h-3.5 text-amber-300" />
              <span>Home</span>
            </span>
            <span className="text-white/60">/</span>
            <span className="text-amber-300 font-semibold">Student Certificate Portal</span>
          </div>
        </div>
      </div>

      {/* Main "Get Certificate" Container Card (Matching Dronacharya portal layout) */}
      <div className="max-w-4xl mx-auto -mt-8 sm:-mt-10 relative z-20 px-4 sm:px-0">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200/90 p-6 sm:p-10">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight mb-6 pb-2 border-b border-slate-100">
            Get Certificate
          </h2>

          <form onSubmit={handleSearchSubmit} className="space-y-6">
            {/* Exactly 2 fields: Roll Number & Full Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Roll Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={rollNumber}
                  onChange={(e) => {
                    setRollNumber(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Roll Number"
                  className="w-full text-sm font-medium border border-slate-300 rounded-md px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full text-sm font-medium border border-slate-300 rounded-md px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition"
                />
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Action Buttons: Get Certificate and Reset */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-2.5 bg-[#0d6efd] hover:bg-[#0b5ed7] text-white font-semibold text-sm rounded-lg shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2 min-w-[150px] cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <span>Get Certificate</span>
                )}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="px-8 py-2.5 bg-[#0d6efd] hover:bg-[#0b5ed7] text-white font-semibold text-sm rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 min-w-[100px] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* RESULTS DISPLAY SECTION */}
      {loading && (
        <div className="max-w-4xl mx-auto bg-white rounded-xl border border-slate-200 p-8 shadow-sm space-y-4 animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
          <div className="h-4 bg-slate-100 rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div className="h-40 bg-slate-100 rounded-xl"></div>
            <div className="h-40 bg-slate-100 rounded-xl"></div>
          </div>
        </div>
      )}

      {!loading && searchPerformed && (
        <div className="max-w-4xl mx-auto px-4 sm:px-0 animate-fadeIn space-y-6">
          {certificates.length > 0 ? (
            /* CERTIFICATES FOUND */
            <div className="space-y-6">
              {/* Student Header Strip */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-bold flex items-center justify-center text-lg">
                    {studentInfo?.name ? studentInfo.name.charAt(0) : 'S'}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {studentInfo?.name || fullName || 'Student Record'}
                    </h3>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 font-mono">
                      <span>Roll No: {searchedRoll}</span>
                      {studentInfo?.department && <span>• {studentInfo.department}</span>}
                      {studentInfo?.course && <span>• {studentInfo.course}</span>}
                    </div>
                  </div>
                </div>

                <div className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold self-end sm:self-auto">
                  {certificates.length} Certificate{certificates.length > 1 ? 's' : ''} Issued
                </div>
              </div>

              {/* Certificate Cards */}
              <div className="space-y-4">
                {certificates.map((cert) => {
                  const isValid = cert.is_valid === 1;
                  const isDownloading = downloadingCertId === cert.certificate_id;

                  return (
                    <div
                      key={cert.certificate_id}
                      className="bg-white rounded-xl border border-slate-200 hover:border-blue-300 p-5 sm:p-6 shadow-sm transition space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                              {cert.rank_or_role || cert.certificate_type}
                            </span>

                            {isValid ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                <span>Valid & Authentic</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                                <XCircle className="w-3 h-3 text-rose-600" />
                                <span>Revoked</span>
                              </span>
                            )}
                          </div>

                          <h4 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                            {cert.event_name}
                          </h4>
                          <p className="text-xs text-slate-500 italic">
                            "{cert.citation_text || cert.organization}"
                          </p>
                        </div>

                        <div className="text-right sm:self-start">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Certificate ID</span>
                          <div className="flex items-center gap-1 justify-end font-mono font-bold text-xs text-slate-800">
                            <span>{cert.certificate_id}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyCertId(cert.certificate_id)}
                              className="text-slate-400 hover:text-blue-600 transition"
                              title="Copy Certificate ID"
                            >
                              {copiedId === cert.certificate_id ? (
                                <span className="text-[9px] text-emerald-600">Copied</span>
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Details row */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Recipient Name</span>
                          <span className="font-semibold text-slate-800 block truncate mt-0.5">{cert.recipient_name}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Roll Number</span>
                          <span className="font-mono font-semibold text-slate-800 block truncate mt-0.5">{cert.roll_number || searchedRoll}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Issue Date</span>
                          <span className="text-slate-700 flex items-center gap-1 mt-0.5 font-medium">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {cert.issue_date || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Organization</span>
                          <span className="text-slate-700 block truncate mt-0.5 font-medium">{cert.organization}</span>
                        </div>
                      </div>

                      {/* Actions: Preview, Download, Verify */}
                      <div className="pt-2 flex items-center justify-end gap-2.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setPreviewCert(cert)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDirectDownload(cert, 'pdf')}
                          disabled={isDownloading}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-[#004b93] hover:bg-[#003870] text-white rounded-md text-xs font-semibold transition disabled:opacity-50 cursor-pointer shadow-sm"
                        >
                          {isDownloading ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" />
                              <span>Downloading...</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5 text-amber-300" />
                              <span>Download PDF</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleVerify(cert.certificate_id)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-md text-xs font-semibold transition cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Verify</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* NO RECORDS FOUND */
            <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 text-center space-y-4 shadow-sm">
              <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                <FileText className="w-7 h-7 text-slate-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">
                No Certificate Found
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                We could not find any certificates issued for Roll Number{' '}
                <span className="font-mono font-bold text-slate-800">{searchedRoll}</span>
                {fullName ? ` and Name "${fullName}"` : ''}.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md transition"
                >
                  Try Another Search
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewCert && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl max-w-5xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-3.5 sm:p-4 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/70">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-100 line-clamp-1">
                    {previewCert.event_name}
                  </h4>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {previewCert.certificate_id} • {previewCert.recipient_name}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Responsive Zoom Controls */}
                <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 px-2 py-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setModalZoom(prev => Math.max(0.35, Number((prev - 0.08).toFixed(2))))}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-mono text-slate-300 min-w-[36px] text-center">
                    {Math.round(modalZoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setModalZoom(prev => Math.min(1.15, Number((prev + 0.08).toFixed(2))))}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalZoom(calculateFitZoom())}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition text-[10px] font-bold px-1.5 uppercase"
                    title="Fit to Screen"
                  >
                    Fit
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewCert(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 p-3 sm:p-6 overflow-auto flex flex-col items-center bg-slate-950/95 scrollbar-thin">
              <div
                className="my-auto shrink-0 shadow-2xl rounded-lg overflow-hidden border border-slate-800/80 bg-white transition-all duration-150"
                style={{
                  width: `${1122 * modalZoom}px`,
                  height: `${793 * modalZoom}px`,
                  position: 'relative'
                }}
              >
                <div
                  style={{
                    width: '1122px',
                    height: '793px',
                    transform: `scale(${modalZoom})`,
                    transformOrigin: 'top left',
                    position: 'absolute',
                    top: 0,
                    left: 0
                  }}
                >
                  <CertificateRenderer
                    data={previewCert}
                    elementId="student-modal-cert-canvas"
                    scale={1}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-400 font-mono">
                A4 Landscape • {previewCert.is_valid === 1 ? 'Valid & Authentic' : 'Revoked'}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleModalDownloadPDF}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition shadow"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleModalDownloadPNG}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition"
                >
                  PNG
                </button>

                <button
                  type="button"
                  onClick={() => printCertificate()}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
                  title="Print"
                >
                  <Printer className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const id = previewCert.certificate_id;
                    setPreviewCert(null);
                    handleVerify(id);
                  }}
                  className="flex items-center gap-1 px-3 py-2 bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-700/60 text-emerald-300 text-xs font-bold rounded-lg transition"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OFFSCREEN CONTAINER FOR BACKGROUND DOWNLOADS */}
      {downloadTargetCert && (
        <div
          style={{
            position: 'fixed',
            left: '-9999px',
            top: '-9999px',
            width: '1122px',
            height: '793px',
            pointerEvents: 'none',
            opacity: 0,
            zIndex: -100
          }}
        >
          <CertificateRenderer
            data={downloadTargetCert}
            elementId="student-download-canvas"
            scale={1}
          />
        </div>
      )}
    </div>
  );
}
