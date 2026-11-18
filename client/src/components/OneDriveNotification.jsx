import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Sparkles,
  CloudUpload
} from 'lucide-react';
import { OneDriveIcon } from './OneDriveModal';
import {
  authorizeOneDrive,
  uploadCertificateToOneDrive,
  getOneDriveClientId
} from '../services/oneDrive';

export default function OneDriveNotification({ onOpenSettings }) {
  const [notification, setNotification] = useState(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    // 1. Upload started
    const handleStart = (e) => {
      setNotification({
        type: 'uploading',
        filename: e.detail.filename,
        message: 'Uploading certificate to your Microsoft OneDrive...'
      });
    };

    // 2. Upload success
    const handleSuccess = (e) => {
      setNotification({
        type: 'success',
        filename: e.detail.filename,
        folderName: e.detail.folderName || 'DCE CertiHub Certificates',
        link: e.detail.file?.webUrl || e.detail.file?.webViewLink,
        message: 'Certificate saved in your Microsoft OneDrive!'
      });

      // Auto dismiss success toast after 8 seconds
      const timer = setTimeout(() => {
        setNotification((prev) => (prev?.type === 'success' ? null : prev));
      }, 8000);
      return () => clearTimeout(timer);
    };

    // 3. Prompt connect when user downloads without connected OneDrive
    const handlePrompt = (e) => {
      setNotification({
        type: 'prompt',
        blob: e.detail.blob,
        filename: e.detail.filename,
        mimeType: e.detail.mimeType,
        hasClientId: e.detail.hasClientId
      });
    };

    // 4. Upload error
    const handleError = (e) => {
      setNotification({
        type: 'error',
        filename: e.detail.filename,
        error: e.detail.error
      });
    };

    // Listen to onedrive events (and gdrive events for backward compatibility)
    window.addEventListener('onedrive_upload_start', handleStart);
    window.addEventListener('onedrive_upload_success', handleSuccess);
    window.addEventListener('onedrive_prompt_connect', handlePrompt);
    window.addEventListener('onedrive_upload_error', handleError);

    window.addEventListener('gdrive_upload_start', handleStart);
    window.addEventListener('gdrive_upload_success', handleSuccess);
    window.addEventListener('gdrive_prompt_connect', handlePrompt);
    window.addEventListener('gdrive_upload_error', handleError);

    return () => {
      window.removeEventListener('onedrive_upload_start', handleStart);
      window.removeEventListener('onedrive_upload_success', handleSuccess);
      window.removeEventListener('onedrive_prompt_connect', handlePrompt);
      window.removeEventListener('onedrive_upload_error', handleError);

      window.removeEventListener('gdrive_upload_start', handleStart);
      window.removeEventListener('gdrive_upload_success', handleSuccess);
      window.removeEventListener('gdrive_prompt_connect', handlePrompt);
      window.removeEventListener('gdrive_upload_error', handleError);
    };
  }, []);

  if (!notification) return null;

  // Handle 1-click connect & upload pending blob
  const handleConnectAndUpload = async () => {
    const { blob, filename, mimeType } = notification;
    const clientId = getOneDriveClientId();

    if (!clientId) {
      // Need Client ID first
      setNotification(null);
      if (onOpenSettings) onOpenSettings();
      return;
    }

    setConnecting(true);
    try {
      setNotification({
        type: 'uploading',
        filename,
        message: 'Connecting to Microsoft OneDrive...'
      });

      await authorizeOneDrive({ prompt: 'select_account' });

      setNotification({
        type: 'uploading',
        filename,
        message: 'Uploading certificate to your Microsoft OneDrive...'
      });

      await uploadCertificateToOneDrive({
        blob,
        filename,
        mimeType,
        interactive: false
      });
      // uploadCertificateToOneDrive fires 'onedrive_upload_success' which updates this notification!
    } catch (err) {
      console.error('OneDrive connect & upload error:', err);
      setNotification({
        type: 'error',
        filename,
        error: err.message || 'Microsoft OneDrive authorization failed.'
      });
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-bounce-subtle">
      {/* Uploading State */}
      {notification.type === 'uploading' && (
        <div className="flex items-center gap-3 p-4 bg-slate-900 text-white rounded-2xl border border-sky-800 shadow-2xl backdrop-blur-md">
          <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
            <RefreshCw className="w-5 h-5 animate-spin" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-slate-200 truncate">
              {notification.filename || 'Certificate'}
            </div>
            <div className="text-[11px] text-sky-300">
              {notification.message}
            </div>
          </div>
        </div>
      )}

      {/* Success State */}
      {notification.type === 'success' && (
        <div className="p-4 bg-slate-900 text-white rounded-2xl border border-emerald-500/50 shadow-2xl relative">
          <button
            onClick={() => setNotification(null)}
            className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-1.5">
                <OneDriveIcon className="w-4 h-4" />
                <span className="text-xs font-extrabold text-emerald-300">
                  Saved to OneDrive!
                </span>
              </div>
              <p className="text-xs text-slate-200 font-semibold truncate mt-0.5">
                {notification.filename}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Folder: <span className="text-slate-300 font-medium">{notification.folderName}</span>
              </p>

              {notification.link && (
                <div className="mt-3 flex items-center gap-2">
                  <a
                    href={notification.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-md shadow-blue-500/20"
                  >
                    <span>Open in OneDrive</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    onClick={() => setNotification(null)}
                    className="text-[11px] text-slate-400 hover:text-white px-2 py-1 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Prompt Connect State */}
      {notification.type === 'prompt' && (
        <div className="p-4 bg-slate-900 text-white rounded-2xl border border-sky-500/40 shadow-2xl relative">
          <button
            onClick={() => setNotification(null)}
            className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-400 shrink-0">
              <OneDriveIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-sky-300">
                  Certificate Downloaded!
                </span>
                <span className="text-[10px] px-1.5 py-0.2 bg-sky-400/20 text-sky-300 rounded font-bold">
                  OneDrive
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Would you also like this certificate auto-saved to your personal or work Microsoft OneDrive?
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  onClick={handleConnectAndUpload}
                  disabled={connecting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                >
                  <CloudUpload className="w-3.5 h-3.5" />
                  <span>{connecting ? 'Connecting...' : 'Save to OneDrive'}</span>
                </button>
                <button
                  onClick={() => {
                    setNotification(null);
                    if (onOpenSettings) onOpenSettings();
                  }}
                  className="text-[11px] text-slate-400 hover:text-white px-2 py-1 cursor-pointer"
                >
                  Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {notification.type === 'error' && (
        <div className="p-4 bg-slate-900 text-white rounded-2xl border border-rose-500/40 shadow-2xl relative">
          <button
            onClick={() => setNotification(null)}
            className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0 pr-4">
              <div className="text-xs font-bold text-rose-400">
                OneDrive Sync Note
              </div>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Downloaded to computer, but OneDrive sync needs attention:
              </p>
              <p className="text-[11px] text-rose-300 mt-1 line-clamp-2">
                {notification.error}
              </p>

              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => {
                    setNotification(null);
                    if (onOpenSettings) onOpenSettings();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold text-xs transition border border-slate-700 cursor-pointer"
                >
                  Configure OneDrive Settings
                </button>
                <button
                  onClick={() => setNotification(null)}
                  className="text-[11px] text-slate-400 hover:text-white px-2 py-1 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

