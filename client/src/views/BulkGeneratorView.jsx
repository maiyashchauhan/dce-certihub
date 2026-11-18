import React, { useState, useEffect } from 'react';
import {
  Layers,
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  Eye,
  FileDown,
  RefreshCw,
  AlertCircle,
  Trophy,
  Medal,
  Check
} from 'lucide-react';
import * as xlsx from 'xlsx';
import confetti from 'canvas-confetti';
import {
  getEventsList,
  bulkGenerateForEvent,
  bulkGenerateFromUpload
} from '../services/api';
import { downloadAsPDF } from '../utils/exportCertificate';
import CertificateRenderer from '../components/templates/CertificateRenderer';

export default function BulkGeneratorView({
  onSelectCertificateForPreview
}) {
  const [tab, setTab] = useState('excel'); // 'excel' or 'event'
  const [events, setEvents] = useState([]);

  // Mode 1: Excel/CSV state
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [showDecideWinnersModal, setShowDecideWinnersModal] = useState(false);
  const [winnerSelection, setWinnerSelection] = useState({
    firstIdx: '',
    secondIdx: '',
    thirdIdx: '',
    runnerIdx: '',
    specialIdx: ''
  });
  const [uploadOptions, setUploadOptions] = useState({
    organization: 'Dronacharya College of Engineering',
    event_name: '',
    event_date: new Date().toISOString().split('T')[0],
    template_id: 'classic',
    coordinator_name: '',
    coordinator_title: 'Event Coordinator',
    hod_name: '',
    hod_title: 'Head of Department (HOD)',
    authority_name: '',
    authority_title: 'Principal'
  });

  // Mode 2: Event Bulk state
  const [selectedEventId, setSelectedEventId] = useState('');
  const [onlyWinners, setOnlyWinners] = useState(false);
  const [eventTemplateId, setEventTemplateId] = useState('classic');

  // Generation status
  const [loading, setLoading] = useState(false);
  const [generationResult, setGenerationResult] = useState(null);
  const [previewCert, setPreviewCert] = useState(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const res = await getEventsList();
      setEvents(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedEventId(res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    }
  };

  // Handle Excel file parse on client
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setGenerationResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = xlsx.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
        setParsedRows(rows);
      } catch (err) {
        alert('Failed to parse file: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  // Update rank for an individual row in parsedRows
  const handleRowRankChange = (rowIndex, newRank) => {
    const updated = [...parsedRows];
    const isWinner = ['1st Place', '2nd Place', '3rd Place', 'Runner-up', 'Special Mention'].includes(newRank);
    updated[rowIndex] = {
      ...updated[rowIndex],
      'Rank': newRank,
      'Certificate Type': isWinner ? 'winner' : 'participation'
    };
    setParsedRows(updated);
  };

  // Open Decide Winners modal for the uploaded students
  const handleOpenDecideWinners = () => {
    if (parsedRows.length === 0) {
      alert('Please upload a student list first.');
      return;
    }

    const first = parsedRows.findIndex(r => (r['Rank'] || '') === '1st Place');
    const second = parsedRows.findIndex(r => (r['Rank'] || '') === '2nd Place');
    const third = parsedRows.findIndex(r => (r['Rank'] || '') === '3rd Place');
    const runner = parsedRows.findIndex(r => (r['Rank'] || '') === 'Runner-up');
    const special = parsedRows.findIndex(r => (r['Rank'] || '') === 'Special Mention');

    setWinnerSelection({
      firstIdx: first >= 0 ? String(first) : '',
      secondIdx: second >= 0 ? String(second) : '',
      thirdIdx: third >= 0 ? String(third) : '',
      runnerIdx: runner >= 0 ? String(runner) : '',
      specialIdx: special >= 0 ? String(special) : ''
    });
    setShowDecideWinnersModal(true);
  };

  // Apply winners decision to all rows
  const handleApplyDecideWinners = (e) => {
    e.preventDefault();
    const updated = parsedRows.map((row, idx) => {
      let rank = 'Participant';
      let certType = 'participation';

      if (String(idx) === String(winnerSelection.firstIdx)) {
        rank = '1st Place';
        certType = 'winner';
      } else if (String(idx) === String(winnerSelection.secondIdx)) {
        rank = '2nd Place';
        certType = 'winner';
      } else if (String(idx) === String(winnerSelection.thirdIdx)) {
        rank = '3rd Place';
        certType = 'winner';
      } else if (String(idx) === String(winnerSelection.runnerIdx)) {
        rank = 'Runner-up';
        certType = 'winner';
      } else if (String(idx) === String(winnerSelection.specialIdx)) {
        rank = 'Special Mention';
        certType = 'winner';
      }

      return {
        ...row,
        'Rank': rank,
        'Certificate Type': certType
      };
    });

    setParsedRows(updated);
    setShowDecideWinnersModal(false);
  };

  // Execute Excel batch generation
  const handleGenerateExcel = async () => {
    if (!file || parsedRows.length === 0) {
      alert('Please upload an Excel or CSV file with student data first');
      return;
    }

    setLoading(true);
    setGenerationResult(null);

    try {
      let fileToSend = file;

      try {
        // Build updated workbook from parsedRows so newly assigned ranks and certificate types are used
        const ws = xlsx.utils.json_to_sheet(parsedRows);
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, 'Certificates');
        const wbout = xlsx.write(wb, { bookType: 'xlsx', type: 'array' });
        const updatedBlob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        fileToSend = new File([updatedBlob], file.name.endsWith('.xlsx') ? file.name : `${file.name.replace(/\.[^/.]+$/, '')}.xlsx`, {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
      } catch (wbErr) {
        console.warn('Using original file fallback:', wbErr);
        fileToSend = file;
      }

      const formData = new FormData();
      formData.append('file', fileToSend);
      formData.append('organization', uploadOptions.organization);
      formData.append('event_name', uploadOptions.event_name);
      formData.append('event_date', uploadOptions.event_date);
      formData.append('template_id', uploadOptions.template_id);
      formData.append('coordinator_name', uploadOptions.coordinator_name);
      formData.append('coordinator_title', uploadOptions.coordinator_title || 'Event Coordinator');
      formData.append('hod_name', uploadOptions.hod_name || '');
      formData.append('hod_title', uploadOptions.hod_title || 'Head of Department (HOD)');
      formData.append('authority_name', uploadOptions.authority_name);
      formData.append('authority_title', uploadOptions.authority_title || 'Principal');

      const res = await bulkGenerateFromUpload(formData);
      setGenerationResult(res.data);

      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      alert('Bulk generation failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Execute Event batch generation
  const handleGenerateFromEvent = async () => {
    if (!selectedEventId) {
      alert('Please select an event');
      return;
    }

    setLoading(true);
    setGenerationResult(null);

    try {
      const payload = {
        event_id: Number(selectedEventId),
        template_id: eventTemplateId,
        only_winners: onlyWinners
      };

      const res = await bulkGenerateForEvent(payload);
      setGenerationResult(res.data);

      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      alert('Event bulk generation failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSampleCSV = () => {
    window.open('/uploads/samples/bulk-certificates-sample.csv', '_blank');
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Bulk Certificate Generator</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
              Batch Processing Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Generate dozens or hundreds of verified student certificates in one click from an Excel/CSV file or directly from an Event's participant list.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setTab('excel')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition ${
              tab === 'excel'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Upload Excel / CSV</span>
          </button>
          <button
            onClick={() => setTab('event')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition ${
              tab === 'event'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>From Event Participants</span>
          </button>
        </div>
      </div>

      {/* MODE 1: EXCEL / CSV BULK GENERATION */}
      {tab === 'excel' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Configuration Form (5 cols) */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase text-slate-800 tracking-wider">
                1. Upload Spreadsheet File
              </h2>
              <button
                type="button"
                onClick={handleDownloadSampleCSV}
                className="text-[11px] text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample CSV</span>
              </button>
            </div>

            {/* Dropzone */}
            <div className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-2xl p-6 text-center cursor-pointer transition bg-slate-50/50">
              <input
                type="file"
                id="excel-file-input"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="excel-file-input" className="cursor-pointer block">
                <FileSpreadsheet className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-800">
                  {file ? file.name : 'Click to select Excel (.xlsx) or CSV file'}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Columns: Name, Roll Number, Email, Department, Event, Certificate Type, Rank
                </p>
              </label>
            </div>

            {/* Template & Metadata options */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase text-slate-800 tracking-wider">
                2. Batch Certificate Configuration
              </h3>

              <div>
                <label className="text-[11px] font-semibold text-slate-600">Template Style</label>
                <select
                  value={uploadOptions.template_id}
                  onChange={(e) => setUploadOptions({ ...uploadOptions, template_id: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white mt-1 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="classic">Classic Academic (Traditional Ornate)</option>
                  <option value="nss">NSS Template (Light Theme)</option>
                  <option value="minimal">Minimal Corporate / Internship</option>
                  <option value="cultural">Vibrant Cultural & Sports</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600">Default College / Org Name</label>
                <input
                  type="text"
                  value={uploadOptions.organization}
                  onChange={(e) => setUploadOptions({ ...uploadOptions, organization: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl mt-1 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">Event Coordinator</label>
                  <input
                    type="text"
                    value={uploadOptions.coordinator_name}
                    onChange={(e) => setUploadOptions({ ...uploadOptions, coordinator_name: e.target.value })}
                    placeholder="(Blank / Optional)"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl mt-1 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">HOD Name</label>
                  <input
                    type="text"
                    value={uploadOptions.hod_name || ''}
                    onChange={(e) => setUploadOptions({ ...uploadOptions, hod_name: e.target.value })}
                    placeholder="(Blank / Optional)"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl mt-1 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">Principal</label>
                  <input
                    type="text"
                    value={uploadOptions.authority_name}
                    onChange={(e) => setUploadOptions({ ...uploadOptions, authority_name: e.target.value })}
                    placeholder="(Blank / Optional)"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl mt-1 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Launch Button */}
            <button
              onClick={handleGenerateExcel}
              disabled={loading || !file}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {loading ? 'Batch Generating Certificates...' : `Generate All (${parsedRows.length} rows detected)`}
              </span>
            </button>
          </div>

          {/* Parsed Rows Preview / Results (7 cols) */}
          <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm min-h-[400px]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-xs font-bold uppercase text-slate-800 tracking-wider">
                  Spreadsheet Preview ({parsedRows.length} Students)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Step 1: Upload student data &nbsp;•&nbsp; Step 2: Decide winners & ranks below
                </p>
              </div>

              {parsedRows.length > 0 && (
                <button
                  type="button"
                  onClick={handleOpenDecideWinners}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Trophy className="w-3.5 h-3.5 text-slate-950" />
                  <span>Decide Winners & Ranks</span>
                </button>
              )}
            </div>

            {parsedRows.length > 0 ? (
              <div className="overflow-x-auto max-h-[460px] border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3">Roll No</th>
                      <th className="py-2.5 px-3">Event</th>
                      <th className="py-2.5 px-3">Rank / Award (Step 2)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row, idx) => {
                      const currentRank = row['Rank'] || row['Certificate Type'] || 'Participant';
                      const isWinner = ['1st Place', '2nd Place', '3rd Place', 'Runner-up', 'Special Mention'].includes(currentRank);

                      return (
                        <tr key={idx} className="hover:bg-slate-50 transition">
                          <td className="py-2 px-3 text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900">
                            {row['Name'] || row['Student Name'] || row['Recipient Name'] || row['name']}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-600">
                            {row['Roll Number'] || row['RollNo'] || row['roll_number'] || '-'}
                          </td>
                          <td className="py-2 px-3 text-slate-600 truncate max-w-[140px]">
                            {row['Event'] || row['event_name'] || uploadOptions.event_name}
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={currentRank}
                              onChange={(e) => handleRowRankChange(idx, e.target.value)}
                              className={`text-[11px] font-semibold px-2 py-1 rounded-lg border focus:outline-none transition ${
                                currentRank === '1st Place'
                                  ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                                  : currentRank === '2nd Place'
                                  ? 'bg-slate-200 text-slate-900 border-slate-300 font-bold'
                                  : currentRank === '3rd Place'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200 font-bold'
                                  : isWinner
                                  ? 'bg-purple-100 text-purple-900 border-purple-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              <option value="Participant">Participant</option>
                              <option value="1st Place">🥇 1st Place</option>
                              <option value="2nd Place">🥈 2nd Place</option>
                              <option value="3rd Place">🥉 3rd Place</option>
                              <option value="Runner-up">🏅 Runner-Up</option>
                              <option value="Special Mention">⭐ Special Mention</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                <FileSpreadsheet className="w-12 h-12 text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-500">No file uploaded yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Upload a CSV or Excel file of students first, then decide winners</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DECIDE WINNERS MODAL FOR UPLOADED CSV */}
      {showDecideWinnersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <span>Decide Winners & Ranks</span>
                </h3>
                <p className="text-xs text-slate-500">Step 2: Assign ranks from uploaded student records</p>
              </div>
              <button
                type="button"
                onClick={() => setShowDecideWinnersModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleApplyDecideWinners} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-amber-700 flex items-center gap-1.5 mb-1">
                  <span>🥇 1st Place Winner</span>
                </label>
                <select
                  value={winnerSelection.firstIdx}
                  onChange={(e) => setWinnerSelection({ ...winnerSelection, firstIdx: e.target.value })}
                  className="w-full text-xs font-medium px-3 py-2 border border-amber-300 rounded-xl bg-amber-50/50 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="">-- None Selected --</option>
                  {parsedRows.map((r, idx) => {
                    const name = r['Name'] || r['Student Name'] || r['Recipient Name'] || r['name'];
                    const roll = r['Roll Number'] || r['RollNo'] || r['roll_number'] || '';
                    return (
                      <option key={idx} value={idx}>
                        {name} {roll ? `(${roll})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                  <span>🥈 2nd Place Winner</span>
                </label>
                <select
                  value={winnerSelection.secondIdx}
                  onChange={(e) => setWinnerSelection({ ...winnerSelection, secondIdx: e.target.value })}
                  className="w-full text-xs font-medium px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-slate-500 focus:outline-none"
                >
                  <option value="">-- None Selected --</option>
                  {parsedRows.map((r, idx) => {
                    const name = r['Name'] || r['Student Name'] || r['Recipient Name'] || r['name'];
                    const roll = r['Roll Number'] || r['RollNo'] || r['roll_number'] || '';
                    return (
                      <option key={idx} value={idx}>
                        {name} {roll ? `(${roll})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-amber-800 flex items-center gap-1.5 mb-1">
                  <span>🥉 3rd Place Winner</span>
                </label>
                <select
                  value={winnerSelection.thirdIdx}
                  onChange={(e) => setWinnerSelection({ ...winnerSelection, thirdIdx: e.target.value })}
                  className="w-full text-xs font-medium px-3 py-2 border border-amber-200 rounded-xl bg-amber-50/30 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="">-- None Selected --</option>
                  {parsedRows.map((r, idx) => {
                    const name = r['Name'] || r['Student Name'] || r['Recipient Name'] || r['name'];
                    const roll = r['Roll Number'] || r['RollNo'] || r['roll_number'] || '';
                    return (
                      <option key={idx} value={idx}>
                        {name} {roll ? `(${roll})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">🏅 Runner-Up</label>
                  <select
                    value={winnerSelection.runnerIdx}
                    onChange={(e) => setWinnerSelection({ ...winnerSelection, runnerIdx: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="">-- None Selected --</option>
                    {parsedRows.map((r, idx) => {
                      const name = r['Name'] || r['Student Name'] || r['Recipient Name'] || r['name'];
                      const roll = r['Roll Number'] || r['RollNo'] || r['roll_number'] || '';
                      return (
                        <option key={idx} value={idx}>
                          {name} {roll ? `(${roll})` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">⭐ Special Mention</label>
                  <select
                    value={winnerSelection.specialIdx}
                    onChange={(e) => setWinnerSelection({ ...winnerSelection, specialIdx: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="">-- None Selected --</option>
                    {parsedRows.map((r, idx) => {
                      const name = r['Name'] || r['Student Name'] || r['Recipient Name'] || r['name'];
                      const roll = r['Roll Number'] || r['RollNo'] || r['roll_number'] || '';
                      return (
                        <option key={idx} value={idx}>
                          {name} {roll ? `(${roll})` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDecideWinnersModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply Winners & Ranks</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODE 2: GENERATE FROM EVENT PARTICIPANTS */}
      {tab === 'event' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div>
            <h2 className="text-sm font-bold uppercase text-slate-800 tracking-wider">
              Batch Generate from Registered Event
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select an existing Hackathon, Workshop or Conference to generate official certificates for all participants or only winners.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Select Event</label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} ({ev.category} - {ev.event_date})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Target Group</label>
              <select
                value={onlyWinners ? 'winners' : 'all'}
                onChange={(e) => setOnlyWinners(e.target.value === 'winners')}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="all">All Participants (Participation + Winners)</option>
                <option value="winners">Winners Only (1st, 2nd, 3rd Place & Category Awards)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Landscape Template Style</label>
              <select
                value={eventTemplateId}
                onChange={(e) => setEventTemplateId(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="classic">Classic Academic</option>
                <option value="nss">NSS Template</option>
                <option value="minimal">Minimal Corporate</option>
                <option value="cultural">Vibrant Cultural & Sports</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerateFromEvent}
            disabled={loading || !selectedEventId}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Processing Batch...' : 'Generate All Certificates for Event'}</span>
          </button>
        </div>
      )}

      {/* GENERATION RESULTS SECTION */}
      {generationResult && (
        <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {generationResult.message}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  ✅ All <span className="font-bold text-slate-900">{generationResult.count} certificates</span> have been <span className="font-semibold text-emerald-700">automatically saved to the system</span> with unique certificate IDs and QR verification codes. They are immediately available in the Certificate Registry and via Student Roll Number Search.
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Certificate ID</th>
                  <th className="py-2.5 px-3">Recipient Name</th>
                  <th className="py-2.5 px-3">Roll No</th>
                  <th className="py-2.5 px-3">Event</th>
                  <th className="py-2.5 px-3">Rank / Role</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {generationResult.certificates?.map((cert) => (
                  <tr key={cert.certificate_id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                      {cert.certificate_id}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {cert.recipient_name}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      {cert.roll_number || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 truncate max-w-[160px]">
                      {cert.event_name}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-[10px] font-semibold">
                        {cert.rank_or_role || cert.certificate_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onSelectCertificateForPreview(cert.certificate_id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-[11px] transition inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View / Export</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
