import React, { useState, useEffect } from 'react';
import {
  Database,
  Download,
  Upload,
  Sparkles,
  Trash2,
  HardDrive,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  X,
  Layers,
  FileJson
} from 'lucide-react';
import {
  getDataOverview,
  exportDatabaseData,
  importDatabaseData,
  seedSampleData,
  clearDatabaseTables
} from '../services/api';

export default function DataHubModal({ isOpen, onClose, onDataChanged }) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [localStorageSize, setLocalStorageSize] = useState('0 KB');
  const [hasStudioDraft, setHasStudioDraft] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadOverview();
      checkLocalStorage();
    }
  }, [isOpen]);

  const loadOverview = async () => {
    try {
      setLoading(true);
      const res = await getDataOverview();
      setOverview(res.data);
    } catch (err) {
      console.error('Failed to load data overview:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkLocalStorage = () => {
    try {
      let total = 0;
      for (let x in localStorage) {
        if (localStorage.hasOwnProperty(x)) {
          total += ((localStorage[x].length + x.length) * 2);
        }
      }
      setLocalStorageSize((total / 1024).toFixed(1) + ' KB');
      setHasStudioDraft(!!localStorage.getItem('cert_studio_draft'));
    } catch (e) {
      setLocalStorageSize('Unknown');
    }
  };

  const handleSeedSample = async () => {
    try {
      setLoading(true);
      setMessage(null);
      const res = await seedSampleData();
      setMessage({ type: 'success', text: res.data.message });
      loadOverview();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to seed sample data: ' + (err.response?.data?.error || err.message) });
    } finally {
      setLoading(false);
    }
  };

  const handleExportJSON = async () => {
    try {
      setLoading(true);
      const res = await exportDatabaseData();
      const jsonBlob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(jsonBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `educert-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'Local database backup file downloaded successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to export backup: ' + (err.response?.data?.error || err.message) });
    } finally {
      setLoading(false);
    }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      setMessage(null);
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (!parsed.tables) {
            throw new Error('Invalid backup file structure: missing tables object');
          }
          const res = await importDatabaseData({ tables: parsed.tables, mode: 'merge' });
          setMessage({ type: 'success', text: res.data.message });
          loadOverview();
          if (onDataChanged) onDataChanged();
        } catch (err) {
          setMessage({ type: 'error', text: 'Import failed: ' + (err.response?.data?.error || err.message) });
        } finally {
          setLoading(false);
        }
      };
      reader.readAsText(file);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to read file: ' + err.message });
      setLoading(false);
    }
  };

  const handleClearTables = async (tableType) => {
    const target = tableType === 'all'
      ? ['certificates', 'participants', 'events', 'students']
      : [tableType];

    const confirmMsg = tableType === 'all'
      ? 'WARNING: This will wipe all Students, Events, and Certificates from the database. Are you sure?'
      : `Wipe all records in ${tableType}?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      setLoading(true);
      setMessage(null);
      const res = await clearDatabaseTables(target);
      setMessage({ type: 'success', text: res.data.message });
      loadOverview();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to clear data: ' + (err.response?.data?.error || err.message) });
    } finally {
      setLoading(false);
    }
  };

  const handleClearLocalStorageDraft = () => {
    localStorage.removeItem('cert_studio_draft');
    checkLocalStorage();
    setMessage({ type: 'success', text: 'Certificate studio local draft cleared.' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                Database & Local Storage Manager
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  SQLite + Local Cache
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Manage backend database records, local storage drafts, seed realistic demo data, and export/import backups.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Notification Alert */}
          {message && (
            <div className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 border ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Table Counts Overview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                Live Database Tables
              </span>
              <button
                onClick={loadOverview}
                disabled={loading}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                Refresh Counts
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="text-[11px] text-slate-500 font-medium block">🎓 Students</span>
                <span className="text-xl font-black text-slate-900">{overview?.students ?? '-'}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="text-[11px] text-slate-500 font-medium block">👨‍🏫 Faculty</span>
                <span className="text-xl font-black text-slate-900">{overview?.faculty ?? '-'}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="text-[11px] text-slate-500 font-medium block">🏆 Events</span>
                <span className="text-xl font-black text-slate-900">{overview?.events ?? '-'}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="text-[11px] text-slate-500 font-medium block">📜 Certificates</span>
                <span className="text-xl font-black text-amber-600">{overview?.certificates ?? '-'}</span>
              </div>
            </div>
          </div>

          {/* 1-Click Fast Seeder */}
          <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-amber-500 text-slate-950">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
                <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide">
                  1-Click Sample College Data
                </h4>
              </div>
              <p className="text-[11px] text-amber-800/80 mt-1 max-w-md">
                Instantly populate database with 6 realistic students, 3 college events, event participants, and 3 pre-verified sample certificates with QR codes.
              </p>
            </div>
            <button
              onClick={handleSeedSample}
              disabled={loading}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition whitespace-nowrap flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Seed Sample Data</span>
            </button>
          </div>

          {/* Local Storage & Cache */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold text-slate-900">Local Browser Storage & Drafts</h4>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                {localStorageSize} used
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-600">
              <div>
                <span>Certificate Studio Draft: </span>
                <strong className={hasStudioDraft ? 'text-emerald-700' : 'text-slate-500'}>
                  {hasStudioDraft ? 'Saved in Local Storage' : 'No active draft'}
                </strong>
              </div>
              {hasStudioDraft && (
                <button
                  onClick={handleClearLocalStorageDraft}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
                >
                  Clear Studio Draft
                </button>
              )}
            </div>
          </div>

          {/* Export & Import Backup */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Export */}
            <div className="p-4 border border-slate-200 rounded-2xl flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                  <Download className="w-4 h-4 text-indigo-600" />
                  <span>Download Local Backup (JSON)</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Save all SQLite tables (students, events, certificates) directly to a local JSON file on your computer.
                </p>
              </div>
              <button
                onClick={handleExportJSON}
                disabled={loading}
                className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON File</span>
              </button>
            </div>

            {/* Import */}
            <div className="p-4 border border-slate-200 rounded-2xl flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                  <Upload className="w-4 h-4 text-indigo-600" />
                  <span>Restore from Local Backup</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Upload a previously exported JSON backup file to restore records back into the database.
                </p>
              </div>
              <label className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 transition flex items-center justify-center gap-1.5 cursor-pointer text-center">
                <Upload className="w-3.5 h-3.5" />
                <span>Select JSON Backup</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Wipe Database Tables */}
          <div className="p-4 bg-rose-50/50 border border-rose-200/70 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                Clear Database Tables
              </span>
              <span className="text-[10px] text-rose-600 font-semibold">Irreversible Operations</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleClearTables('certificates')}
                disabled={loading}
                className="px-3 py-1.5 bg-white hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-xs font-semibold transition"
              >
                Clear Certificates
              </button>
              <button
                onClick={() => handleClearTables('students')}
                disabled={loading}
                className="px-3 py-1.5 bg-white hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-xs font-semibold transition"
              >
                Clear Students
              </button>
              <button
                onClick={() => handleClearTables('events')}
                disabled={loading}
                className="px-3 py-1.5 bg-white hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-xs font-semibold transition"
              >
                Clear Events
              </button>
              <button
                onClick={() => handleClearTables('all')}
                disabled={loading}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
              >
                Clear All Tables
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition shadow"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
