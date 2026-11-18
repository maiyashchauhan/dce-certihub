/**
 * Microsoft OneDrive Integration Service for DCE CertiHub
 * 
 * Provides:
 * - Microsoft Identity Platform (OAuth 2.0 PKCE / Implicit) authorization
 * - Microsoft Graph API v1.0 OneDrive integration
 * - Automatic folder organization ("DCE CertiHub Certificates")
 * - Direct stream upload of PDF/PNG/JPG certificate blobs via Microsoft Graph
 * - Persistent configuration (Application/Client ID, Tenant ID, auto-save preference, recent uploads history)
 */

const GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0';

/**
 * Get configured Microsoft Azure Application (Client) ID
 */
export function getOneDriveClientId() {
  return (
    localStorage.getItem('onedrive_client_id') ||
    import.meta.env.VITE_ONEDRIVE_CLIENT_ID ||
    import.meta.env.VITE_MICROSOFT_CLIENT_ID ||
    ''
  ).trim();
}

/**
 * Save custom Microsoft Azure Application (Client) ID
 */
export function setOneDriveClientId(clientId) {
  if (clientId) {
    localStorage.setItem('onedrive_client_id', clientId.trim());
  } else {
    localStorage.removeItem('onedrive_client_id');
  }
}

/**
 * Get Microsoft Tenant ID (defaults to 'common' for personal + work/school accounts)
 */
export function getOneDriveTenantId() {
  return (
    localStorage.getItem('onedrive_tenant_id') ||
    'common'
  ).trim();
}

/**
 * Set Microsoft Tenant ID ('common', 'consumers', 'organizations', or tenant GUID)
 */
export function setOneDriveTenantId(tenantId) {
  localStorage.setItem('onedrive_tenant_id', (tenantId || 'common').trim());
}

/**
 * Check if auto-saving to OneDrive is enabled on certificate download
 */
export function isAutoSaveToOneDriveEnabled() {
  const val = localStorage.getItem('onedrive_auto_save');
  // Default to enabled (true)
  return val === null || val === 'true';
}

/**
 * Toggle auto-save to OneDrive
 */
export function setAutoSaveToOneDrive(enabled) {
  localStorage.setItem('onedrive_auto_save', enabled ? 'true' : 'false');
}

/**
 * Get custom folder name in OneDrive
 */
export function getOneDriveFolderName() {
  return localStorage.getItem('onedrive_folder_name') || 'DCE CertiHub Certificates';
}

/**
 * Set custom folder name
 */
export function setOneDriveFolderName(name) {
  localStorage.setItem('onedrive_folder_name', (name || 'DCE CertiHub Certificates').trim());
}

/**
 * Get current OneDrive access token from sessionStorage
 */
export function getStoredAccessToken() {
  const token = sessionStorage.getItem('onedrive_access_token');
  const expiry = sessionStorage.getItem('onedrive_token_expiry');
  if (token && expiry && Date.now() < Number(expiry)) {
    return token;
  }
  return null;
}

/**
 * Store OneDrive access token
 */
export function storeAccessToken(token, expiresInSec = 3599) {
  sessionStorage.setItem('onedrive_access_token', token);
  // Give 2 min safety margin before expiration
  const expiryTime = Date.now() + Math.max(0, (expiresInSec - 120)) * 1000;
  sessionStorage.setItem('onedrive_token_expiry', String(expiryTime));
}

/**
 * Clear stored token
 */
export function clearStoredAccessToken() {
  sessionStorage.removeItem('onedrive_access_token');
  sessionStorage.removeItem('onedrive_token_expiry');
  localStorage.removeItem('onedrive_user_profile');
}

/**
 * Get cached user profile
 */
export function getConnectedOneDriveUser() {
  try {
    const raw = localStorage.getItem('onedrive_user_profile');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Fetch and store Microsoft user profile (displayName, mail/userPrincipalName)
 */
export async function fetchOneDriveUserProfile(accessToken) {
  try {
    const res = await fetch(`${GRAPH_BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (res.ok) {
      const data = await res.json();
      const profile = {
        name: data.displayName || 'Microsoft User',
        email: data.mail || data.userPrincipalName || '',
        id: data.id
      };

      // Try fetching profile photo as well (if available)
      try {
        const photoRes = await fetch(`${GRAPH_BASE_URL}/me/photo/$value`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (photoRes.ok) {
          const photoBlob = await photoRes.blob();
          profile.picture = URL.createObjectURL(photoBlob);
        }
      } catch {
        // Photo is optional, ignore if user has no avatar
      }

      localStorage.setItem('onedrive_user_profile', JSON.stringify(profile));
      return profile;
    }
  } catch (err) {
    console.warn('Could not fetch Microsoft user profile:', err);
  }
  return null;
}

/**
 * Authorize with Microsoft OneDrive using Microsoft Identity Platform
 * Opens a clean OAuth popup to Microsoft login and retrieves an access token.
 */
export async function authorizeOneDrive({ prompt = 'select_account' } = {}) {
  const clientId = getOneDriveClientId();

  if (!clientId) {
    throw new Error('Microsoft Application (Client) ID is missing. Please enter your Azure Client ID in OneDrive Settings.');
  }

  const tenant = getOneDriveTenantId();
  const redirectUri = window.location.origin;
  const scopes = 'Files.ReadWrite User.Read offline_access';
  
  // State parameter to prevent CSRF
  const state = Math.random().toString(36).substring(2) + Date.now().toString(36);
  sessionStorage.setItem('onedrive_auth_state', state);

  const authUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?` +
    new URLSearchParams({
      client_id: clientId,
      response_type: 'token',
      redirect_uri: redirectUri,
      scope: scopes,
      response_mode: 'fragment',
      state: state,
      prompt: prompt
    }).toString();

  const width = 540;
  const height = 680;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  return new Promise((resolve, reject) => {
    const popup = window.open(
      authUrl,
      'onedrive_oauth_popup',
      `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no,location=no`
    );

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      reject(new Error('Popup blocked! Please allow popups for this site to authenticate with OneDrive.'));
      return;
    }

    let resolved = false;

    // Listen for postMessage from redirect callback
    const messageListener = async (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'ONEDRIVE_AUTH_CALLBACK') {
        cleanup();
        resolved = true;

        const hash = event.data.hash || '';
        const params = new URLSearchParams(hash.startsWith('#') ? hash.substring(1) : hash);
        
        const error = params.get('error') || params.get('error_description');
        if (error) {
          reject(new Error(params.get('error_description') || error));
          return;
        }

        const accessToken = params.get('access_token');
        const expiresIn = Number(params.get('expires_in')) || 3599;

        if (!accessToken) {
          reject(new Error('No access token received from Microsoft login.'));
          return;
        }

        storeAccessToken(accessToken, expiresIn);
        const profile = await fetchOneDriveUserProfile(accessToken);

        window.dispatchEvent(new CustomEvent('onedrive_auth_change', {
          detail: { connected: true, profile, token: accessToken }
        }));

        resolve({
          accessToken,
          profile
        });
      }
    };

    // Poller to detect if popup was manually closed
    const timer = setInterval(() => {
      if (popup.closed && !resolved) {
        cleanup();
        reject(new Error('OneDrive login window was closed before completing authorization.'));
      }
    }, 500);

    const cleanup = () => {
      clearInterval(timer);
      window.removeEventListener('message', messageListener);
    };

    window.addEventListener('message', messageListener);
  });
}

/**
 * Disconnect Microsoft OneDrive account
 */
export function disconnectOneDrive() {
  clearStoredAccessToken();
  window.dispatchEvent(new CustomEvent('onedrive_auth_change', {
    detail: { connected: false, profile: null }
  }));
}

/**
 * Upload a certificate file (Blob or File) directly to Microsoft OneDrive
 * Uses Microsoft Graph API path-based upload:
 * PUT https://graph.microsoft.com/v1.0/me/drive/root:/{folderName}/{filename}:/content
 * 
 * @param {Object} options
 * @param {Blob|File} options.blob - File blob to upload
 * @param {string} options.filename - Name of the file
 * @param {string} options.mimeType - MIME type ('application/pdf', 'image/png', 'image/jpeg')
 * @param {boolean} [options.interactive=true] - If true, prompts OAuth popup if not logged in
 */
export async function uploadCertificateToOneDrive({
  blob,
  filename,
  mimeType = 'application/pdf',
  interactive = true
}) {
  let accessToken = getStoredAccessToken();

  if (!accessToken) {
    if (!interactive) {
      throw new Error('Not connected to OneDrive');
    }
    const authResult = await authorizeOneDrive();
    accessToken = authResult.accessToken;
  }

  const folderName = getOneDriveFolderName();
  const safeFilename = filename.replace(/[/\\?%*:|"<>]/g, '_');
  const safeFolderName = folderName.replace(/[/\\?%*:|"<>]/g, '_');

  // Microsoft Graph API direct path-based content upload
  const uploadUrl = `${GRAPH_BASE_URL}/me/drive/root:/${encodeURIComponent(safeFolderName)}/${encodeURIComponent(safeFilename)}:/content`;

  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': mimeType
    },
    body: blob
  });

  if (!uploadRes.ok) {
    if (uploadRes.status === 401) {
      // Token expired, clear and retry once if interactive
      clearStoredAccessToken();
      if (interactive) {
        return uploadCertificateToOneDrive({ blob, filename: safeFilename, mimeType, interactive: false });
      }
    }
    const errorText = await uploadRes.text();
    let parsedMessage = errorText;
    try {
      const errObj = JSON.parse(errorText);
      parsedMessage = errObj?.error?.message || errorText;
    } catch {
      // ignore
    }
    throw new Error(`OneDrive upload failed (${uploadRes.status}): ${parsedMessage}`);
  }

  const uploadedItem = await uploadRes.json();

  // Save to recent upload history
  recordRecentUpload({
    id: uploadedItem.id,
    name: uploadedItem.name || safeFilename,
    link: uploadedItem.webUrl,
    folderName: safeFolderName,
    time: new Date().toISOString()
  });

  // Notify listeners
  window.dispatchEvent(new CustomEvent('onedrive_upload_success', {
    detail: {
      file: uploadedItem,
      filename: safeFilename,
      folderName: safeFolderName
    }
  }));

  return {
    success: true,
    fileId: uploadedItem.id,
    name: uploadedItem.name,
    webUrl: uploadedItem.webUrl,
    folderName: safeFolderName
  };
}

/**
 * Record recent upload in localStorage
 */
function recordRecentUpload(item) {
  try {
    const raw = localStorage.getItem('onedrive_recent_uploads');
    let list = raw ? JSON.parse(raw) : [];
    list.unshift(item);
    list = list.slice(0, 10); // keep last 10
    localStorage.setItem('onedrive_recent_uploads', JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to record recent upload:', e);
  }
}

/**
 * Get recent OneDrive uploads
 */
export function getRecentOneDriveUploads() {
  try {
    const raw = localStorage.getItem('onedrive_recent_uploads');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// -------------------------------------------------------------
// Backward compatibility aliases for seamless drop-in replacement
// -------------------------------------------------------------
export const getGoogleClientId = getOneDriveClientId;
export const setGoogleClientId = setOneDriveClientId;
export const isAutoSaveToDriveEnabled = isAutoSaveToOneDriveEnabled;
export const setAutoSaveToDrive = setAutoSaveToOneDrive;
export const getDriveFolderName = getOneDriveFolderName;
export const setDriveFolderName = setOneDriveFolderName;
export const getConnectedGoogleUser = getConnectedOneDriveUser;
export const authorizeGoogleDrive = authorizeOneDrive;
export const disconnectGoogleDrive = disconnectOneDrive;
export const uploadCertificateToDrive = uploadCertificateToOneDrive;
export const getRecentDriveUploads = getRecentOneDriveUploads;

