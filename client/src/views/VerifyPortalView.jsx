import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle,
  XCircle,
  Calendar,
  Award,
  GraduationCap,
  Building,
  UserCheck,
  Download,
  Printer,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { verifyCertificate } from '../services/api';
import CertificateRenderer from '../components/templates/CertificateRenderer';
import { downloadAsPDF, downloadAsPNG } from '../utils/exportCertificate';

export default function VerifyPortalView({ initialCertId = '' }) {
  const [certIdInput, setCertIdInput] = useState(initialCertId || 'CERT-2026-WIN-001');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    // If URL has /verify/:id or prop has ID, verify automatically
    const pathParts = window.location.pathname.split('/');
    if (pathParts[1] === 'verify' && pathParts[2]) {
      setCertIdInput(pathParts[2]);
      performVerification(pathParts[2]);
    } else if (initialCertId) {
      performVerification(initialCertId);
    }
  }, [initialCertId]);

  const performVerification = async (idToVerify) => {
    const targetId = (idToVerify || certIdInput).trim().toUpperCase();
    if (!targetId) return;

    setLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const res = await verifyCertificate(targetId);
      setResult(res.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setResult({
          verified: false,
          status: 'INVALID_OR_NOT_FOUND',
          message: 'The certificate ID was not found in the official registry. Please check for typographical errors.'
        });
      } else {
        setErrorMsg('Error contacting verification registry: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    performVerification(certIdInput);
  };

  const handleDownloadVerifiedPDF = async () => {
    if (!result?.certificate) return;
    const cert = result.certificate;
    const timestamp = new Date().getTime();
    try {
      await downloadAsPDF('verified-cert-canvas', `${cert.recipient_name}_${cert.certificate_id}_VERIFIED_${timestamp}.pdf`);
    } catch (err) {
      console.error('Verified PDF download error:', err);
      const msg = err?.message || (err?.type ? `Canvas event error: ${err.type}` : String(err || 'Export failed'));
      alert('PDF generation failed: ' + msg);
    }
  };

  const handleDownloadVerifiedPNG = async () => {
    if (!result?.certificate) return;
    const cert = result.certificate;
    const timestamp = new Date().getTime();
    try {
      await downloadAsPNG('verified-cert-canvas', `${cert.recipient_name}_${cert.certificate_id}_VERIFIED_${timestamp}.png`);
    } catch (err) {
      console.error('Verified PNG download error:', err);
      const msg = err?.message || (err?.type ? `Canvas event error: ${err.type}` : String(err || 'Export failed'));
      alert('PNG download failed: ' + msg);
    }
  };

  const cert = result?.certificate;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Search Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white text-center shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold mb-4">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Official Public Accreditation Registry</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
          Verify College Certificate Authenticity
        </h1>
        <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mx-auto mt-2">
          Verify certificates issued by the college examination and event board. Scan QR code or enter the unique certificate identifier to inspect authenticity.
        </p>

        {/* Search Input */}
        <form onSubmit={handleSubmit} className="max-w-xl mx-auto mt-6 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={certIdInput}
              onChange={(e) => setCertIdInput(e.target.value)}
              placeholder="e.g. CERT-2026-WIN-001"
              className="w-full text-sm font-mono uppercase bg-slate-800/90 border border-slate-700 text-white pl-11 pr-4 py-3 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder:text-slate-500 placeholder:normal-case font-bold"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify Now'}
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-[11px] text-slate-400">
          <span>Quick test sample:</span>
          <button
            onClick={() => { setCertIdInput('CERT-2026-WIN-001'); performVerification('CERT-2026-WIN-001'); }}
            className="text-amber-300 font-mono underline hover:text-amber-200"
          >
            CERT-2026-WIN-001
          </button>
          <span>•</span>
          <button
            onClick={() => { setCertIdInput('CERT-2026-PAR-002'); performVerification('CERT-2026-PAR-002'); }}
            className="text-amber-300 font-mono underline hover:text-amber-200"
          >
            CERT-2026-PAR-002
          </button>
        </div>
      </div>

      {/* Verification Result Card */}
      {result && (
        <div className="space-y-6">
          {result.verified ? (
            /* VERIFIED SUCCESS */
            <div className="bg-white rounded-3xl border-2 border-emerald-500/40 p-6 sm:p-8 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
                    <CheckCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-emerald-950">
                        OFFICIALLY VERIFIED & AUTHENTIC
                      </h2>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-bold text-[10px] tracking-wider uppercase">
                        Verified
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      This certificate is authentic and recorded in the college master database.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadVerifiedPDF}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm"
                  >
                    <Download className="w-4 h-4 text-amber-400" />
                    <span>Download PDF</span>
                  </button>
                  <button
                    onClick={handleDownloadVerifiedPNG}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition text-xs font-semibold"
                    title="Download PNG"
                  >
                    PNG
                  </button>
                </div>
              </div>

              {/* Credential Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Certificate ID
                  </span>
                  <p className="text-sm font-mono font-bold text-slate-900 mt-1">
                    {cert.certificate_id}
                  </p>
                  <span className="text-[10px] text-slate-500">Issued: {cert.issue_date}</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Recipient Student
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-1">
                    {cert.recipient_name}
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Roll: {cert.roll_number || 'N/A'} • {cert.course || cert.department}
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Event & Award
                  </span>
                  <p className="text-sm font-bold text-amber-800 mt-1">
                    {cert.rank_or_role || cert.certificate_type}
                  </p>
                  <span className="text-[10px] text-slate-600 block truncate">
                    {cert.event_name}
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Issuing Organization
                  </span>
                  <p className="text-xs font-bold text-slate-900 mt-1">
                    {cert.organization}
                  </p>
                  <span className="text-[10px] text-slate-500">Dept: {cert.department}</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Event Coordinator
                  </span>
                  <p className="text-xs font-bold text-slate-900 mt-1">
                    {cert.coordinator_name || 'N/A'}
                  </p>
                  <span className="text-[10px] text-slate-500">{cert.coordinator_title || 'Event Coordinator'}</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Head of Department (HOD)
                  </span>
                  <p className="text-xs font-bold text-slate-900 mt-1">
                    {cert.hod_name || 'N/A'}
                  </p>
                  <span className="text-[10px] text-slate-500">{cert.hod_title || 'Head of Department (HOD)'}</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Authority / Principal
                  </span>
                  <p className="text-xs font-bold text-slate-900 mt-1">
                    {cert.authority_name || 'N/A'}
                  </p>
                  <span className="text-[10px] text-slate-500">{cert.authority_title || 'Principal'}</span>
                </div>
              </div>

              {/* Citation */}
              <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200/60">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                  Official Citation
                </span>
                <p className="text-xs font-serif italic text-slate-800 mt-1 leading-relaxed">
                  "{cert.citation_text}"
                </p>
              </div>

              {/* Visual Certificate Preview */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                    Official Certificate Document Rendering
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    A4 Landscape • 297mm × 210mm
                  </span>
                </div>

                <div className="w-full flex justify-center bg-slate-950 p-6 rounded-2xl shadow-inner overflow-x-auto">
                  <div
                    style={{
                      width: '1122px',
                      height: '793px',
                      transform: 'scale(0.72)',
                      transformOrigin: 'top center',
                      marginBottom: `${-(793 * (1 - 0.72))}px`,
                      marginRight: `${-(1122 * (1 - 0.72)) / 2}px`,
                      marginLeft: `${-(1122 * (1 - 0.72)) / 2}px`
                    }}
                  >
                    <CertificateRenderer
                      data={cert}
                      elementId="verified-cert-canvas"
                      scale={1}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* INVALID OR REVOKED ALERT */
            <div className="bg-white rounded-3xl border-2 border-rose-300 p-8 shadow-xl text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-md">
                <XCircle className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-rose-950">
                {result.status === 'REVOKED' ? 'CERTIFICATE HAS BEEN REVOKED' : 'INVALID OR UNRECOGNIZED CERTIFICATE'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
                {result.message}
              </p>
              <div className="text-xs text-slate-400 font-mono">
                Scanned Identifier: {certIdInput.toUpperCase()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
