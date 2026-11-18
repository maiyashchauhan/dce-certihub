import React from 'react';
import {
  DEFAULT_COLLEGE_LOGO,
  DEFAULT_HOD_SIGNATURE,
  DEFAULT_PRINCIPAL_SIGNATURE,
  DEFAULT_COORDINATOR_SIGNATURE
} from '../../utils/defaultAssets';

export default function CertificateRenderer({
  data = {},
  elementId = 'certificate-canvas',
  scale = 1
}) {
  const {
    certificate_id = 'CERT-2026-0001',
    recipient_name = '',
    roll_number = '',
    department = '',
    course = '',
    event_name = '',
    event_date = '',
    organization = 'Dronacharya College of Engineering',
    certificate_type = 'participation',
    rank_or_role = '',
    template_id = 'classic',
    coordinator_name = '',
    coordinator_title = 'Event Coordinator',
    hod_name = '',
    hod_title = 'Head of Department (HOD)',
    authority_name = '',
    authority_title = 'Principal',
    logo_url = DEFAULT_COLLEGE_LOGO,
    signature_url = DEFAULT_COORDINATOR_SIGNATURE,
    secondary_signature_url = DEFAULT_PRINCIPAL_SIGNATURE,
    hod_signature_url = DEFAULT_HOD_SIGNATURE,
    tertiary_signature_url,
    qr_code_data = '',
    issue_date = new Date().toISOString().split('T')[0],
    citation_text = ''
  } = data;

  const resolvedLogo = logo_url || DEFAULT_COLLEGE_LOGO;
  const resolvedCoordSig = signature_url || DEFAULT_COORDINATOR_SIGNATURE;
  const resolvedHodSig = hod_signature_url || tertiary_signature_url || DEFAULT_HOD_SIGNATURE;
  const resolvedAuthSig = secondary_signature_url || DEFAULT_PRINCIPAL_SIGNATURE;

  // Title calculation based on type
  const getCertificateTitle = () => {
    switch (certificate_type) {
      case 'winner':
        return 'CERTIFICATE OF EXCELLENCE';
      case 'achievement':
        return 'CERTIFICATE OF ACHIEVEMENT';
      case 'internship':
        return 'CERTIFICATE OF INTERNSHIP';
      case 'merit':
        return 'CERTIFICATE OF MERIT';
      case 'completion':
        return 'CERTIFICATE OF COMPLETION';
      case 'participation':
      default:
        return 'CERTIFICATE OF PARTICIPATION';
    }
  };

  const getSubTitle = () => {
    switch (certificate_type) {
      case 'winner':
        return `PROUDLY PRESENTED FOR OUTSTANDING MERIT & SECURING ${(rank_or_role || 'FIRST PLACE').toUpperCase()}`;
      case 'achievement':
        return 'PROUDLY CONFERRED FOR EXCEPTIONAL ACCOMPLISHMENT AND INNOVATION';
      case 'internship':
        return 'CERTIFYING THE SUCCESSFUL COMPLETION OF INDUSTRIAL INTERNSHIP TRAINING';
      case 'merit':
        return 'AWARDED FOR DEMONSTRATING ACADEMIC AND TECHNICAL DISTINCTION';
      case 'completion':
        return 'CONFERRED IN RECOGNITION OF SUCCESSFUL COURSE COMPLETION';
      case 'participation':
      default:
        return 'THIS IS TO CERTIFY THAT';
    }
  };

  const defaultCitation = () => {
    if (citation_text) return citation_text;
    const ev = event_name || 'the official collegiate event';
    const org = organization || 'Dronacharya College of Engineering';
    const dt = event_date ? ` held on ${event_date}` : '';
    const rk = rank_or_role || 'distinction';
    if (certificate_type === 'winner') {
      return `has demonstrated remarkable technical innovation and secured ${rk} in ${ev}${dt} organized by ${org}.`;
    }
    if (certificate_type === 'internship') {
      return `has successfully completed ${ev} as an intern from ${org}, demonstrating remarkable proficiency, dedication, and professional conduct.`;
    }
    return `has actively participated and contributed to the successful execution of ${ev}${dt} organized by ${org}.`;
  };

  // Dimensions of standard A4 Landscape: 297mm x 210mm (~1122px x 793px at 96 DPI)
  // We use 1122 x 793 for high-density rendering
  return (
    <div
      id={elementId}
      className="relative select-none text-slate-800 bg-white shadow-2xl mx-auto overflow-hidden"
      style={{
        width: '1122px',
        height: '793px',
        minWidth: '1122px',
        minHeight: '793px',
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top center'
      }}
    >
      {/* TEMPLATE 1: CLASSIC ACADEMIC */}
      {template_id === 'classic' && (
        <div className="w-full h-full p-8 relative flex flex-col justify-between bg-gradient-to-br from-amber-50/40 via-white to-amber-50/30">
          {/* Ornate Outer & Inner Borders */}
          <div className="absolute inset-4 border-[6px] border-amber-800/80 pointer-events-none" />
          <div className="absolute inset-6 border border-amber-600/40 pointer-events-none" />
          <div className="absolute inset-7 border-[2px] border-amber-700/60 pointer-events-none" />

          {/* Corner Flourishes */}
          <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-amber-700 pointer-events-none" />
          <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-amber-700 pointer-events-none" />
          <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-amber-700 pointer-events-none" />
          <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-amber-700 pointer-events-none" />

          {/* Background Watermark Crest */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none">
            <img src={resolvedLogo} alt="Watermark" className="w-[500px] h-[500px] object-contain" />
          </div>

          {/* Header */}
          <div className="relative z-10 text-center pt-3">
            <div className="relative flex items-center justify-center mb-2 min-h-16">
              <img src={resolvedLogo} alt="Logo" className="absolute left-8 w-16 h-16 object-contain" />
              <div className="w-full text-center px-24">
                <h2 className="font-serif tracking-widest text-xl font-bold uppercase text-slate-800">
                  {organization}
                </h2>
                <p className="text-xs tracking-wider text-amber-900/80 uppercase font-medium">
                  Autonomous Institution • Accredited & Recognized
                </p>
              </div>
            </div>

            <div className="my-2 flex items-center justify-center gap-4">
              <div className="h-[1.5px] w-24 bg-gradient-to-r from-transparent to-amber-600" />
              <div className="w-2 h-2 rotate-45 bg-amber-600" />
              <div className="h-[1.5px] w-24 bg-gradient-to-l from-transparent to-amber-600" />
            </div>

            <h1 className="font-serif text-3xl font-bold tracking-wider text-amber-900 uppercase">
              {getCertificateTitle()}
            </h1>
            <p className="font-serif text-xs italic tracking-widest text-slate-600 mt-1 uppercase">
              {getSubTitle()}
            </p>
          </div>

          {/* Recipient & Citation */}
          <div className="relative z-10 text-center px-16 my-auto">
            <div className="my-3">
              <span className="font-serif text-4xl font-extrabold text-slate-900 tracking-wide border-b-2 border-amber-700/60 pb-1 px-8 inline-block">
                {recipient_name || '[RECIPIENT FULL NAME]'}
              </span>
            </div>

            <div className="flex items-center justify-center gap-6 text-sm text-slate-700 font-medium mb-3">
              {roll_number && (
                <span>
                  <strong className="text-slate-900">Roll No:</strong> {roll_number}
                </span>
              )}
              {department && (
                <span>
                  <strong className="text-slate-900">Dept:</strong> {department}
                </span>
              )}
              {course && (
                <span>
                  <strong className="text-slate-900">Course:</strong> {course}
                </span>
              )}
            </div>

            <p className="font-serif text-base text-slate-700 leading-relaxed max-w-3xl mx-auto px-4 italic">
              {defaultCitation()}
            </p>

            {rank_or_role && rank_or_role !== 'Participant' && (
              <div className="mt-3 inline-block bg-amber-100/80 border border-amber-300 text-amber-950 font-serif font-bold text-sm px-6 py-1 rounded-full uppercase tracking-wider">
                ★ {rank_or_role} ★
              </div>
            )}
          </div>

          {/* Footer with Signatures & QR Code */}
          <div className="relative z-10 px-10 pb-4 pt-2 flex items-end justify-between">
            {/* Left Authority: Coordinator */}
            <div className="text-center w-52">
              <div className="h-16 flex items-end justify-center mb-1">
                {resolvedCoordSig && (
                  <img src={resolvedCoordSig} alt="Coordinator Signature" className="max-h-14 max-w-full object-contain" />
                )}
              </div>
              <div className="w-full border-t border-slate-700 pt-1">
                <p className="font-serif font-bold text-xs text-black uppercase min-h-[1.1rem]">{coordinator_name || ''}</p>
                <p className="text-[10px] text-black font-semibold">{coordinator_title}</p>
              </div>
            </div>

            {/* Center Authority: Head of Department (HOD) */}
            <div className="text-center w-52">
              <div className="h-16 flex items-end justify-center mb-1">
                {resolvedHodSig && (
                  <img src={resolvedHodSig} alt="HOD Signature" className="max-h-14 max-w-full object-contain" />
                )}
              </div>
              <div className="w-full border-t border-slate-700 pt-1">
                <p className="font-serif font-bold text-xs text-black uppercase min-h-[1.1rem]">{hod_name || ''}</p>
                <p className="text-[10px] text-black font-semibold">{hod_title || 'Head of Department (HOD)'}</p>
              </div>
            </div>

            {/* Right Authority & QR Code */}
            <div className="flex items-end gap-4">
              {/* QR Code & ID Info */}
              {qr_code_data && (
                <div className="text-center flex flex-col items-center">
                  <div className="p-1 bg-white border border-slate-300 rounded shadow-sm">
                    <img src={qr_code_data} alt="Verification QR Code" className="w-14 h-14" />
                  </div>
                  <span className="text-[7.5px] text-slate-500 font-mono tracking-tighter mt-0.5">SCAN TO VERIFY</span>
                  <span className="text-[7.5px] text-slate-500 font-mono">ID: {certificate_id}</span>
                </div>
              )}

              {/* Right Signature (Principal) */}
              <div className="text-center w-52">
                <div className="h-16 flex items-end justify-center mb-1">
                  {resolvedAuthSig && (
                    <img src={resolvedAuthSig} alt="Authority Signature" className="max-h-14 max-w-full object-contain" />
                  )}
                </div>
                <div className="w-full border-t border-slate-700 pt-1">
                  <p className="font-serif font-bold text-xs text-black uppercase min-h-[1.1rem]">{authority_name || ''}</p>
                  <p className="text-[10px] text-black font-semibold">{authority_title}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TEMPLATE 2: NSS */}
      {template_id === 'nss' && (
        <div className="w-full h-full p-8 relative flex flex-col justify-between bg-blue-50 text-slate-800">
          {/* NSS Styled Borders */}
          <div className="absolute inset-4 border-[4px] border-blue-800/80 pointer-events-none" />
          <div className="absolute inset-6 border border-blue-600/40 pointer-events-none" />

          {/* Header */}
          <div className="relative z-10 text-center pt-2">
            <div className="relative flex items-center justify-center mb-2 min-h-16">
              <img src={resolvedLogo} alt="Logo" className="absolute left-8 w-16 h-16 object-contain" />
              <div className="w-full text-center px-24">
                <h2 className="font-serif tracking-widest text-lg font-extrabold uppercase text-blue-900">
                  {organization}
                </h2>
                <p className="text-[11px] tracking-wider text-blue-700 uppercase font-semibold">
                  NATIONAL SERVICE SCHEME
                </p>
              </div>
            </div>

            <div className="my-2 flex items-center justify-center gap-3">
              <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-blue-800 to-transparent" />
              <span className="text-blue-800 text-xs">✦ ✦ ✦</span>
              <div className="h-[1px] w-32 bg-gradient-to-l from-transparent via-blue-800 to-transparent" />
            </div>

            <h1 className="font-serif text-3xl font-bold tracking-widest text-blue-900 uppercase">
              {getCertificateTitle()}
            </h1>
            <p className="font-serif text-xs italic tracking-widest text-blue-700 mt-1 uppercase">
              {getSubTitle()}
            </p>
          </div>

          {/* Recipient & Details */}
          <div className="relative z-10 text-center px-16 my-auto">
            <div className="my-3">
              <span className="font-serif text-4xl font-bold text-slate-900 tracking-wider border-b-2 border-blue-800/80 pb-1 px-8 inline-block">
                {recipient_name || '[RECIPIENT FULL NAME]'}
              </span>
            </div>

            <div className="flex items-center justify-center gap-6 text-xs text-blue-900 font-serif mb-2">
              {roll_number && <span>Enrollment ID: <strong>{roll_number}</strong></span>}
              {department && <span>Department: <strong>{department}</strong></span>}
              {course && <span>Program: <strong>{course}</strong></span>}
            </div>

            <p className="font-serif text-base text-slate-700 leading-relaxed max-w-3xl mx-auto px-4 italic">
              {defaultCitation()}
            </p>

            {rank_or_role && (
              <div className="mt-3 inline-block bg-blue-100 text-blue-900 font-serif font-black text-xs px-6 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                ★ {rank_or_role} ★
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="relative z-10 px-10 pb-4 pt-2 flex items-end justify-between">
            {/* Coordinator */}
            <div className="text-center w-52">
              <div className="h-14 flex items-end justify-center mb-1">
                {resolvedCoordSig && (
                  <img src={resolvedCoordSig} alt="Coordinator Signature" className="max-h-12 max-w-full object-contain" />
                )}
              </div>
              <div className="border-t border-blue-800/50 pt-1">
                <p className="font-serif font-bold text-xs text-black uppercase min-h-[1.1rem]">{coordinator_name || ''}</p>
                <p className="text-[10px] text-black font-semibold">{coordinator_title}</p>
              </div>
            </div>

            {/* Center Authority: HOD */}
            <div className="text-center w-52">
              <div className="h-14 flex items-end justify-center mb-1">
                {resolvedHodSig && (
                  <img src={resolvedHodSig} alt="HOD Signature" className="max-h-12 max-w-full object-contain" />
                )}
              </div>
              <div className="border-t border-blue-800/50 pt-1">
                <p className="font-serif font-bold text-xs text-black uppercase min-h-[1.1rem]">{hod_name || ''}</p>
                <p className="text-[10px] text-black font-semibold">{hod_title || 'Head of Department (HOD)'}</p>
              </div>
            </div>

            {/* Right: QR & Principal */}
            <div className="flex items-end gap-4">
              {qr_code_data && (
                <div className="text-center flex flex-col items-center">
                  <div className="p-1 bg-white rounded shadow-sm border border-blue-200">
                    <img src={qr_code_data} alt="QR Code" className="w-14 h-14" />
                  </div>
                  <span className="text-[7.5px] text-blue-800 font-mono mt-0.5">SCAN & VERIFY</span>
                  <span className="text-[7.5px] text-blue-900 font-mono">REG: {certificate_id}</span>
                </div>
              )}

              <div className="text-center w-52">
                <div className="h-14 flex items-end justify-center mb-1">
                  {resolvedAuthSig && (
                    <img src={resolvedAuthSig} alt="Authority Signature" className="max-h-12 max-w-full object-contain" />
                  )}
                </div>
                <div className="border-t border-blue-800/50 pt-1">
                  <p className="font-serif font-bold text-xs text-black uppercase min-h-[1.1rem]">{authority_name || ''}</p>
                  <p className="text-[10px] text-black font-semibold">{authority_title}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* TEMPLATE 4: MINIMAL CORPORATE / INTERNSHIP */}
      {template_id === 'minimal' && (
        <div className="w-full h-full p-10 relative flex flex-col justify-between bg-white text-slate-800 border-[16px] border-slate-100">
          {/* Subtle Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600" />

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between border-b border-slate-200 pb-4 min-h-20">
            <div className="flex items-center">
              <img src={resolvedLogo} alt="Logo" className="w-12 h-12 object-contain" />
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 w-[65%] text-center">
              <h2 className="font-bold text-base text-slate-900 tracking-tight">{organization}</h2>
              <p className="text-[11px] text-slate-500 font-medium">Official Certificate of Verification</p>
            </div>
            <div className="text-right">
              <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded">
                Ref: {certificate_id}
              </span>
              <p className="text-[10px] text-slate-400 mt-1">Date: {issue_date}</p>
            </div>
          </div>

          {/* Center */}
          <div className="relative z-10 text-center px-12 my-auto">
            <p className="text-xs font-semibold tracking-widest text-indigo-600 uppercase mb-2">
              {getSubTitle()}
            </p>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight uppercase">
              {getCertificateTitle()}
            </h1>

            <div className="my-4">
              <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                {recipient_name || '[RECIPIENT FULL NAME]'}
              </span>
            </div>

            <div className="flex items-center justify-center gap-6 text-xs text-slate-600 font-medium mb-3">
              {roll_number && <span>ID: <strong className="text-slate-800">{roll_number}</strong></span>}
              {department && <span>Department: <strong className="text-slate-800">{department}</strong></span>}
              {course && <span>Course: <strong className="text-slate-800">{course}</strong></span>}
            </div>

            <p className="text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
              {defaultCitation()}
            </p>

            {rank_or_role && (
              <div className="mt-4 inline-block bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs px-4 py-1 rounded-full uppercase tracking-wide">
                Role / Status: {rank_or_role}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="relative z-10 flex items-end justify-between border-t border-slate-200 pt-4">
            <div className="text-left w-48">
              <div className="h-12 flex items-end mb-1">
                {resolvedCoordSig && (
                  <img src={resolvedCoordSig} alt="Coordinator Signature" className="max-h-12 object-contain" />
                )}
              </div>
              <div className="border-t border-slate-300 pt-1">
                <p className="font-bold text-xs text-black uppercase min-h-[1.1rem]">{coordinator_name || ''}</p>
                <p className="text-[10px] text-black font-semibold">{coordinator_title}</p>
              </div>
            </div>

            <div className="text-center w-48">
              <div className="h-12 flex items-end justify-center mb-1">
                {resolvedHodSig && (
                  <img src={resolvedHodSig} alt="HOD Signature" className="max-h-12 object-contain" />
                )}
              </div>
              <div className="border-t border-slate-300 pt-1">
                <p className="font-bold text-xs text-black uppercase min-h-[1.1rem]">{hod_name || ''}</p>
                <p className="text-[10px] text-black font-semibold">{hod_title || 'Head of Department (HOD)'}</p>
              </div>
            </div>

            {/* QR Code */}
            {qr_code_data && (
              <div className="flex items-center gap-2">
                <img src={qr_code_data} alt="QR Code" className="w-12 h-12 border border-slate-200 p-0.5 rounded" />
                <div className="text-left text-[8px] text-slate-500 font-mono">
                  <div className="font-bold text-slate-700">Scan to Verify</div>
                  <div>Official</div>
                </div>
              </div>
            )}

            <div className="text-right w-48">
              <div className="h-12 flex items-end justify-end mb-1">
                {resolvedAuthSig && (
                  <img src={resolvedAuthSig} alt="Authority Signature" className="max-h-12 object-contain" />
                )}
              </div>
              <div className="border-t border-slate-300 pt-1">
                <p className="font-bold text-xs text-black uppercase min-h-[1.1rem]">{authority_name || ''}</p>
                <p className="text-[10px] text-black font-semibold">{authority_title}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TEMPLATE 5: VIBRANT CULTURAL / SPORTS */}
      {template_id === 'cultural' && (
        <div className="w-full h-full p-8 relative flex flex-col justify-between bg-gradient-to-br from-rose-50 via-white to-amber-50 text-slate-800">
          {/* Ornate Crimson & Gold Border */}
          <div className="absolute inset-4 border-[6px] border-rose-900 pointer-events-none" />
          <div className="absolute inset-6 border-[2px] border-amber-500 pointer-events-none" />

          {/* Header */}
          <div className="relative z-10 text-center pt-2">
            <div className="relative flex items-center justify-center mb-2 min-h-16">
              <img src={resolvedLogo} alt="Logo" className="absolute left-8 w-16 h-16 object-contain" />
              <div className="w-full text-center px-24">
                <h2 className="font-serif tracking-widest text-lg font-black uppercase text-rose-950">
                  {organization}
                </h2>
                <p className="text-[11px] tracking-widest text-amber-700 uppercase font-bold">
                  ANNUAL CULTURAL & SPORTS MEET
                </p>
              </div>
            </div>

            <div className="my-1 flex items-center justify-center gap-3">
              <div className="h-[2px] w-28 bg-gradient-to-r from-transparent to-rose-700" />
              <span className="text-rose-700 text-sm">✦</span>
              <div className="h-[2px] w-28 bg-gradient-to-l from-transparent to-rose-700" />
            </div>

            <h1 className="font-serif text-3xl font-black tracking-wider text-rose-900 uppercase">
              {getCertificateTitle()}
            </h1>
            <p className="font-serif text-xs italic tracking-widest text-slate-600 mt-1 uppercase">
              {getSubTitle()}
            </p>
          </div>

          {/* Recipient */}
          <div className="relative z-10 text-center px-16 my-auto">
            <div className="my-2">
              <span className="font-serif text-4xl font-black text-rose-950 tracking-wide border-b-2 border-rose-800 pb-1 px-8 inline-block">
                {recipient_name || '[RECIPIENT FULL NAME]'}
              </span>
            </div>

            <div className="flex items-center justify-center gap-6 text-xs text-slate-700 font-serif mb-2">
              {roll_number && <span>Participant ID: <strong>{roll_number}</strong></span>}
              {department && <span>Department: <strong>{department}</strong></span>}
              {course && <span>Course: <strong>{course}</strong></span>}
            </div>

            <p className="font-serif text-base text-slate-700 leading-relaxed max-w-3xl mx-auto px-4 italic">
              {defaultCitation()}
            </p>

            {rank_or_role && (
              <div className="mt-3 inline-block bg-rose-100 border border-rose-300 text-rose-900 font-serif font-black text-xs px-6 py-1.5 rounded-full uppercase tracking-wider">
                🏆 {rank_or_role} 🏆
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="relative z-10 px-10 pb-4 pt-2 flex items-end justify-between">
            <div className="text-center w-52">
              <div className="h-14 flex items-end justify-center mb-1">
                {resolvedCoordSig && (
                  <img src={resolvedCoordSig} alt="Coordinator Signature" className="max-h-12 max-w-full object-contain" />
                )}
              </div>
              <div className="border-t border-rose-900 pt-1">
                <p className="font-serif font-bold text-xs text-black uppercase min-h-[1.1rem]">{coordinator_name || ''}</p>
                <p className="text-[10px] text-black font-semibold">{coordinator_title}</p>
              </div>
            </div>

            {/* Center Authority: HOD */}
            <div className="text-center w-52">
              <div className="h-14 flex items-end justify-center mb-1">
                {resolvedHodSig && (
                  <img src={resolvedHodSig} alt="HOD Signature" className="max-h-12 max-w-full object-contain" />
                )}
              </div>
              <div className="border-t border-rose-900 pt-1">
                <p className="font-serif font-bold text-xs text-black uppercase min-h-[1.1rem]">{hod_name || ''}</p>
                <p className="text-[10px] text-black font-semibold">{hod_title || 'Head of Department (HOD)'}</p>
              </div>
            </div>

            {/* QR & Authority */}
            <div className="flex items-end gap-4">
              {qr_code_data && (
                <div className="text-center flex flex-col items-center">
                  <div className="p-1 bg-white border border-rose-200 rounded shadow-sm">
                    <img src={qr_code_data} alt="QR Code" className="w-14 h-14" />
                  </div>
                  <span className="text-[7.5px] text-slate-500 font-mono mt-0.5">SCAN TO VERIFY</span>
                  <span className="text-[7.5px] text-slate-500 font-mono">ID: {certificate_id}</span>
                </div>
              )}

              <div className="text-center w-52">
                <div className="h-14 flex items-end justify-center mb-1">
                  {resolvedAuthSig && (
                    <img src={resolvedAuthSig} alt="Authority Signature" className="max-h-12 max-w-full object-contain" />
                  )}
                </div>
                <div className="border-t border-rose-900 pt-1">
                  <p className="font-serif font-bold text-xs text-black uppercase min-h-[1.1rem]">{authority_name || ''}</p>
                  <p className="text-[10px] text-black font-semibold">{authority_title}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
