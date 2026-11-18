import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  X,
  Folder,
  Key,
  HelpCircle,
  LogOut,
  RefreshCw,
  FolderOpen,
  Sparkles,
  ShieldCheck,
  FileCheck,
  Globe
} from 'lucide-react';
import {
  getOneDriveClientId,
  setOneDriveClientId,
  getOneDriveTenantId,
  setOneDriveTenantId,
  isAutoSaveToOneDriveEnabled,
  setAutoSaveToOneDrive,
  getOneDriveFolderName,
  setOneDriveFolderName,
  getStoredAccessToken,
  getConnectedOneDriveUser,
  authorizeOneDrive,
  disconnectOneDrive,
  getRecentOneDriveUploads
} from '../services/oneDrive';

// Microsoft OneDrive authentic dual-cloud SVG icon
export function OneDriveIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20.25 10.5C19.78 8.01 17.61 6 15 6C12.72 6 10.77 7.49 10.04 9.55C9.4 9.22 8.68 9.03 7.91 9.03C5.16 9.03 2.92 11.23 2.87 13.97C1.19 15.34 0 17.47 0 20C0 24.14 3.36 27.5 7.5 27.5H23.5C28.2 27.5 32 23.7 32 19C32 14.65 28.73 11.05 24.52 10.56C23.55 7.84 20.98 6 18 6"
        fill="none"
      />
      {/* Back cloud shape - Microsoft Deep Blue */}
      <path
        d="M20.6 8.5C19.8 6.5 17.8 5 15.5 5C13.2 5 11.3 6.4 10.5 8.4C9.8 8.1 9 7.9 8.2 7.9C5.3 7.9 3 10.2 3 13.1C3 13.8 3.1 14.4 3.4 15C1.4 16.5 0 18.9 0 21.6C0 25.7 3.3 29 7.4 29H23.5C27.6 29 31 25.6 31 21.5C31 17.7 28.1 14.5 24.5 14.1C24.1 11.6 22.6 9.5 20.6 8.5Z"
        fill="#0364B8"
      />
      {/* Front primary cloud shape - Microsoft OneDrive Blue */}
      <path
        d="M23.5 13C27.6 13 31 16.4 31 20.5C31 24.6 27.6 28 23.5 28H8.5C4.4 28 1 24.6 1 20.5C1 16.9 3.6 13.8 7 13.2C7.3 10.3 9.8 8 12.8 8C14.7 8 16.3 8.9 17.4 10.4C18.3 9.5 19.6 9 21 9C23.6 9 25.8 11 26 13.6C25.2 13.2 24.4 13 23.5 13Z"
        fill="#0078D4"
      />
      {/* Front overlapping cloud accent */}
      <path
        d="M17.5 15C15 15 13 17 13 19.5C13 22 15 24 17.5 24H25.5C27.4 24 29 22.4 29 20.5C29 18.6 27.4 17 25.5 17C25.2 17 24.9 17 24.6 17.1C24.1 15.3 22.5 14 20.5 14C19.9 14 19.3 14.2 18.8 14.4C18.4 14.8 18 15 17.5 15Z"
        fill="#1490DF"
      />
      {/* Highlight glow */}
      <path
        d="M23.5 14.5C22.6 14.5 21.8 14.8 21.1 15.3C20.5 14.5 19.5 14 18.5 14C16.9 14 15.6 15.1 15.2 16.6C14.7 16.2 14.1 16 13.5 16C12.1 16 11 17.1 11 18.5C11 18.9 11.1 19.3 11.3 19.6C9.9 20.1 9 21.4 9 22.9C9 24.8 10.5 26.3 12.4 26.3H23.5C26.5 26.3 29 23.8 29 20.8C29 17.8 26.5 15.3 23.5 15.3L23.5 14.5Z"
        fill="#28A8EA"
      />
    </svg>
  );
}

export default function OneDriveModal({ isOpen, onClose }) {
  const [clientId, setClientId] = useState('');
  const [tenantId, setTenantId] = useState('common');
  const [autoSave, setAutoSave] = useState(true);
  const [folderName, setFolderName] = useState('DCE CertiHub Certificates');
  const [userProfile, setUserProfile] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [recentUploads, setRecentUploads] = useState([]);
  const [showGuide, setShowGuide] = useState(false);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setClientId(getOneDriveClientId());
      setTenantId(getOneDriveTenantId());
      setAutoSave(isAutoSaveToOneDriveEnabled());
      setFolderName(getOneDriveFolderName());
      setRecentUploads(getRecentOneDriveUploads());

      const token = getStoredAccessToken();
      const user = getConnectedOneDriveUser();
      setIsConnected(!!token);
      setUserProfile(user);
    }
  }, [isOpen]);

  // Listen for background auth changes
  useEffect(() => {
    const handleAuthChange = (e) => {
      setIsConnected(e.detail.connected);
      setUserProfile(e.detail.profile);
      setRecentUploads(getRecentOneDriveUploads());
    };
    window.addEventListener('onedrive_auth_change', handleAuthChange);
    window.addEventListener('onedrive_upload_success', () => setRecentUploads(getRecentOneDriveUploads()));
    return () => {
      window.removeEventListener('onedrive_auth_change', handleAuthChange);
    };
  }, []);

  if (!isOpen) return null;

  const handleSavePreferences = () => {
    setOneDriveClientId(clientId);
    setOneDriveTenantId(tenantId);
    setAutoSaveToOneDrive(autoSave);
    setOneDriveFolderName(folderName);
    setSavedSuccessMsg('OneDrive preferences saved successfully!');
    setTimeout(() => setSavedSuccessMsg(null), 3000);
  };

  const handleConnect = async () => {
    setErrorMsg(null);
    setConnecting(true);
    try {
      if (!clientId.trim()) {
        setShowGuide(true);
        throw new Error('Please enter a Microsoft Azure Application (Client) ID below before connecting.');
      }
      setOneDriveClientId(clientId);
      setOneDriveTenantId(tenantId);
      const res = await authorizeOneDrive({ prompt: 'select_account' });
      setIsConnected(true);
      setUserProfile(res.profile);
      setSavedSuccessMsg('Successfully connected to Microsoft OneDrive!');
      setTimeout(() => setSavedSuccessMsg(null), 3500);
    } catch (err) {
      console.error('OneDrive connection error:', err);
      setErrorMsg(err.message || 'Failed to authenticate with Microsoft OneDrive.');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnectOneDrive();
    setIsConnected(false);
    setUserProfile(null);
    setSavedSuccessMsg('Disconnected from Microsoft OneDrive.');
    setTimeout(() => setSavedSuccessMsg(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-blue-900 via-sky-900 to-slate-900 text-white border-b border-sky-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner flex items-center justify-center">
              <OneDriveIcon className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold tracking-tight">Microsoft OneDrive Cloud Storage</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-400/20 text-sky-300 border border-sky-400/30">
                  Instant Auto-Save
                </span>
              </div>
              <p className="text-xs text-sky-200/90">
                Automatically backup and organize certificates in your Microsoft OneDrive on every download.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-sky-300 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800">
          {/* Status Message Alerts */}
          {savedSuccessMsg && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{savedSuccessMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMsg}</div>
            </div>
          )}

          {/* Connection Card */}
          <div className="p-5 rounded-2xl bg-sky-50/60 border border-sky-100 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {userProfile?.picture ? (
                  <img
                    src={userProfile.picture}
                    alt={userProfile.name}
                    className="w-12 h-12 rounded-full border-2 border-sky-500 shadow-sm object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                    {userProfile?.name ? userProfile.name.charAt(0) : <Cloud className="w-6 h-6 text-white" />}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {userProfile?.name || (isConnected ? 'Microsoft Account' : 'Not Connected')}
                    </span>
                    {isConnected ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Connected
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-600">
                        Disconnected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {userProfile?.email || 'Connect your OneDrive to automatically sync downloads.'}
                  </p>
                </div>
              </div>

              <div>
                {isConnected ? (
                  <button
                    onClick={handleDisconnect}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Disconnect</span>
                  </button>
                ) : (
                  <button
                    onClick={handleConnect}
                    disabled={connecting}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-md shadow-blue-600/25 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {connecting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <>
                        <OneDriveIcon className="w-4 h-4" />
                        <span>Connect OneDrive</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Auto-Save & Folder Settings */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Download & Sync Options
            </h3>

            {/* Toggle switch for auto save */}
            <label className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition cursor-pointer shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-500" />
                  <span className="text-sm font-bold text-slate-900">
                    Auto-Save to OneDrive on Download
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  When you click <strong>Download PDF, PNG, or JPG</strong>, the file will automatically be uploaded to your Microsoft OneDrive in addition to saving locally.
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoSave}
                onChange={(e) => {
                  setAutoSave(e.target.checked);
                  setAutoSaveToOneDrive(e.target.checked);
                }}
                className="w-5 h-5 mt-1 accent-blue-600 rounded cursor-pointer shrink-0"
              />
            </label>

            {/* Folder Name Input */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-sm">
              <label className="block text-xs font-bold text-slate-700">
                <Folder className="w-3.5 h-3.5 inline mr-1.5 text-blue-600" />
                Target OneDrive Folder
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="e.g. DCE CertiHub Certificates"
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Certificates will be neatly stored inside this folder in your personal or school OneDrive. Created automatically on first upload.
              </p>
            </div>
          </div>

          {/* Microsoft Azure App Configuration */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Microsoft Azure Application (Client) ID
              </label>
              <button
                type="button"
                onClick={() => setShowGuide(!showGuide)}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{showGuide ? 'Hide Setup Guide' : 'How to get a free Client ID (2 mins)'}</span>
              </button>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="e.g. 00000000-0000-0000-0000-000000000000"
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                />
              </div>

              {/* Account Type / Tenant ID */}
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 shrink-0">
                  <Globe className="w-3.5 h-3.5 text-slate-400" /> Account Type:
                </span>
                <select
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="common">Personal & Work/School Accounts (common)</option>
                  <option value="consumers">Personal Microsoft Accounts only (consumers)</option>
                  <option value="organizations">Work/School Accounts only (organizations)</option>
                </select>
              </div>

              <p className="text-[11px] text-slate-500">
                Enables secure browser-to-OneDrive synchronization via Microsoft Graph API. Stored safely in your browser's local settings.
              </p>
            </div>

            {/* Collapsible Setup Guide */}
            {showGuide && (
              <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/90 text-xs text-blue-950 space-y-2.5 animate-fade-in">
                <div className="font-bold flex items-center gap-1.5 text-blue-900">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Quick Microsoft Azure Setup (Takes 2 minutes):
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-700 pl-1 leading-relaxed">
                  <li>
                    Open{' '}
                    <a
                      href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-blue-700 underline inline-flex items-center gap-0.5"
                    >
                      Azure Portal App Registrations <ExternalLink className="w-3 h-3" />
                    </a>{' '}
                    and click <strong>New registration</strong>.
                  </li>
                  <li>
                    Name it <strong>DCE CertiHub</strong>.
                  </li>
                  <li>
                    Under <strong>Supported account types</strong>, choose:{' '}
                    <em>Accounts in any organizational directory and personal Microsoft accounts</em>.
                  </li>
                  <li>
                    Under <strong>Redirect URI</strong>, select <strong>Single-page application (SPA)</strong> or <strong>Web</strong>, and enter:
                    <div className="mt-1 font-mono text-[11px] bg-white p-1.5 rounded-lg border border-blue-200 select-all">
                      {window.location.origin}
                    </div>
                  </li>
                  <li>
                    Under <strong>API permissions</strong>, ensure <strong>Files.ReadWrite</strong> and <strong>User.Read</strong> are granted.
                  </li>
                  <li>
                    Under <strong>Authentication</strong>, check <strong>Access tokens (used for implicit and hybrid flows)</strong>.
                  </li>
                  <li>
                    Copy your <strong>Application (client) ID</strong>, paste it into the box above, and click <strong>Connect OneDrive</strong>!
                  </li>
                </ol>
              </div>
            )}
          </div>

          {/* Recent Uploads Section */}
          {recentUploads.length > 0 && (
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                Recent OneDrive Uploads
              </h3>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden bg-white max-h-40 overflow-y-auto">
                {recentUploads.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 text-xs hover:bg-slate-50 transition">
                    <div className="truncate pr-2">
                      <div className="font-medium text-slate-800 truncate">{item.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {item.folderName || 'OneDrive'} • {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 text-[11px] font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition inline-flex items-center gap-1 shrink-0"
                      >
                        <span>Open in OneDrive</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
          <div className="text-[11px] text-slate-500">
            {isConnected ? '🟢 Auto-sync active on download' : '⚪ Connect account to activate auto-sync'}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSavePreferences}
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition shadow-sm cursor-pointer"
            >
              Save Settings
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition shadow-sm cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Backward-compatible alias for any residual imports
export const GoogleDriveIcon = OneDriveIcon;

