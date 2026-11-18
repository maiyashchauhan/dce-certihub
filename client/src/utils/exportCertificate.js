import jsPDF from 'jspdf';
import * as htmlToImage from 'html-to-image';
import html2canvas from 'html2canvas';
import {
  isAutoSaveToOneDriveEnabled,
  getStoredAccessToken,
  uploadCertificateToOneDrive,
  getOneDriveClientId,
  authorizeOneDrive
} from '../services/oneDrive';

/**
 * Robustly captures a certificate element to a high-resolution data URL.
 * Combines html-to-image (with skipFonts & error suppression) and an
 * oklch-sanitized html2canvas fallback for 100% reliable cross-browser exports.
 */
export async function captureElementToDataUrl(elementId, { format = 'png', quality = 0.98, pixelRatio = 2 } = {}) {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Target certificate element "#${elementId}" was not found in the DOM.`);
  }

  // Temporarily reset zoom/scale on the container so capture happens at exact native resolution (1122x793)
  const zoomParent = element.closest('[style*="scale"]') || element.parentElement;
  let originalTransform = '';
  let originalTransition = '';
  if (zoomParent && zoomParent.style && zoomParent.style.transform && zoomParent.style.transform.includes('scale')) {
    originalTransform = zoomParent.style.transform;
    originalTransition = zoomParent.style.transition;
    zoomParent.style.transition = 'none';
    zoomParent.style.transform = 'scale(1)';
  }

  // Allow browser a frame to layout at scale(1)
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  let dataUrl = null;

  try {
    // Tier 1: html-to-image with skipFonts (avoids external font/CSSOM CORS rejection)
    try {
      const options = {
        quality,
        pixelRatio,
        backgroundColor: '#ffffff',
        skipFonts: true,
        cacheBust: false,
        onImageErrorHandler: () => ''
      };

      if (format === 'jpeg' || format === 'jpg') {
        dataUrl = await htmlToImage.toJpeg(element, options);
      } else {
        dataUrl = await htmlToImage.toPng(element, options);
      }
    } catch (primaryErr) {
      console.warn('html-to-image capture encountered an issue, trying sanitized html2canvas:', primaryErr);
    }

    // Tier 2: html2canvas with dynamic oklch sanitization in onclone
    if (!dataUrl) {
      const canvas = await html2canvas(element, {
        scale: pixelRatio,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          try {
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');

            // Sanitize all style tags containing oklch
            const styleTags = clonedDoc.querySelectorAll('style');
            styleTags.forEach(styleTag => {
              if (styleTag.textContent && styleTag.textContent.includes('oklch')) {
                styleTag.textContent = styleTag.textContent.replace(/oklch\([^)]+\)/gi, (match) => {
                  try {
                    tempCtx.fillStyle = '#000000';
                    tempCtx.fillStyle = match;
                    return tempCtx.fillStyle || '#000000';
                  } catch {
                    return '#000000';
                  }
                });
              }
            });

            // Sanitize inline style attributes containing oklch
            const elementsWithOklch = clonedDoc.querySelectorAll('[style*="oklch"]');
            elementsWithOklch.forEach(el => {
              const raw = el.getAttribute('style');
              if (raw) {
                el.setAttribute('style', raw.replace(/oklch\([^)]+\)/gi, (match) => {
                  try {
                    tempCtx.fillStyle = '#000000';
                    tempCtx.fillStyle = match;
                    return tempCtx.fillStyle || '#000000';
                  } catch {
                    return '#000000';
                  }
                }));
              }
            });
          } catch (sanitizeErr) {
            console.warn('oklch sanitization warning:', sanitizeErr);
          }
        }
      });

      dataUrl = canvas.toDataURL(format === 'jpeg' || format === 'jpg' ? 'image/jpeg' : 'image/png', quality);
    }

    if (!dataUrl) {
      throw new Error('Canvas render produced an empty image. Please use "Print Certificate" to save directly via browser.');
    }

    return dataUrl;
  } finally {
    // Restore zoom transform
    if (zoomParent && originalTransform) {
      zoomParent.style.transform = originalTransform;
      zoomParent.style.transition = originalTransition;
    }
  }
}

/**
 * Background synchronizer:
 * 1. Archives a copy to local server drive via API.
 * 2. Uploads to user's Microsoft OneDrive if auto-save is enabled.
 */
async function syncToDriveAndServer({ blob, dataUrl, filename, mimeType }) {
  // 1. Silent server drive backup
  try {
    if (dataUrl) {
      fetch('/api/certificates/archive-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, dataUrl })
      }).catch(err => console.warn('Server drive archive error:', err));
    }
  } catch (e) {
    // ignore
  }

  // 2. Microsoft OneDrive Sync
  if (!isAutoSaveToOneDriveEnabled()) return;

  const token = getStoredAccessToken();
  const clientId = getOneDriveClientId();

  if (token) {
    // User already authenticated with OneDrive - upload seamlessly
    try {
      window.dispatchEvent(new CustomEvent('onedrive_upload_start', { detail: { filename } }));
      const result = await uploadCertificateToOneDrive({ blob, filename, mimeType, interactive: false });
      return result;
    } catch (err) {
      console.warn('Auto upload to OneDrive failed:', err);
      window.dispatchEvent(new CustomEvent('onedrive_upload_error', { detail: { filename, error: err.message } }));
    }
  } else {
    // User has not connected OneDrive yet - emit prompt event with blob
    window.dispatchEvent(new CustomEvent('onedrive_prompt_connect', {
      detail: {
        blob,
        filename,
        mimeType,
        hasClientId: !!clientId
      }
    }));
  }
}

/**
 * Downloads a certificate element as a print-ready A4 landscape PDF.
 * Also synchronizes to Microsoft OneDrive and server storage automatically.
 */
export async function downloadAsPDF(elementId, filename = 'certificate.pdf') {
  try {
    const dataUrl = await captureElementToDataUrl(elementId, { format: 'png', pixelRatio: 2 });

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const imgType = dataUrl.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
    pdf.addImage(dataUrl, imgType, 0, 0, 297, 210, undefined, 'FAST');
    const safeFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    
    // Save to local computer downloads
    pdf.save(safeFilename);

    // Save copy to Microsoft OneDrive & server drive in background
    const pdfBlob = pdf.output('blob');
    syncToDriveAndServer({
      blob: pdfBlob,
      dataUrl,
      filename: safeFilename,
      mimeType: 'application/pdf'
    });

    return { success: true, filename: safeFilename, blob: pdfBlob };
  } catch (err) {
    const msg = err?.message || (err?.type ? `Canvas event error: ${err.type}` : String(err || 'Failed to generate PDF'));
    throw new Error(msg);
  }
}

/**
 * Downloads a certificate element as a high-resolution PNG.
 * Also synchronizes to Microsoft OneDrive and server storage automatically.
 */
export async function downloadAsPNG(elementId, filename = 'certificate.png') {
  try {
    const dataUrl = await captureElementToDataUrl(elementId, { format: 'png', pixelRatio: 2 });
    const safeFilename = filename.endsWith('.png') ? filename : `${filename}.png`;

    const link = document.createElement('a');
    link.download = safeFilename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Get blob and sync to OneDrive
    const res = await fetch(dataUrl);
    const pngBlob = await res.blob();
    syncToDriveAndServer({
      blob: pngBlob,
      dataUrl,
      filename: safeFilename,
      mimeType: 'image/png'
    });

    return { success: true, filename: safeFilename, blob: pngBlob };
  } catch (err) {
    const msg = err?.message || (err?.type ? `Canvas event error: ${err.type}` : String(err || 'Failed to download PNG'));
    throw new Error(msg);
  }
}

/**
 * Downloads a certificate element as a high-resolution JPG.
 * Also synchronizes to Microsoft OneDrive and server storage automatically.
 */
export async function downloadAsJPG(elementId, filename = 'certificate.jpg') {
  try {
    const dataUrl = await captureElementToDataUrl(elementId, { format: 'jpeg', quality: 0.95, pixelRatio: 2 });
    const safeFilename = filename.endsWith('.jpg') ? filename : `${filename}.jpg`;

    const link = document.createElement('a');
    link.download = safeFilename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Get blob and sync to OneDrive
    const res = await fetch(dataUrl);
    const jpgBlob = await res.blob();
    syncToDriveAndServer({
      blob: jpgBlob,
      dataUrl,
      filename: safeFilename,
      mimeType: 'image/jpeg'
    });

    return { success: true, filename: safeFilename, blob: jpgBlob };
  } catch (err) {
    const msg = err?.message || (err?.type ? `Canvas event error: ${err.type}` : String(err || 'Failed to download JPG'));
    throw new Error(msg);
  }
}

/**
 * Explicitly save certificate to Microsoft OneDrive (interactive auth if needed)
 */
export async function saveCertificateToOneDrive(elementId, filename = 'certificate.pdf', format = 'pdf') {
  let blob = null;
  let mimeType = 'application/pdf';
  let safeFilename = filename;

  if (format === 'pdf') {
    const dataUrl = await captureElementToDataUrl(elementId, { format: 'png', pixelRatio: 2 });
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    pdf.addImage(dataUrl, 'PNG', 0, 0, 297, 210, undefined, 'FAST');
    safeFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    blob = pdf.output('blob');
    mimeType = 'application/pdf';
  } else {
    const isJpeg = format === 'jpg' || format === 'jpeg';
    const dataUrl = await captureElementToDataUrl(elementId, {
      format: isJpeg ? 'jpeg' : 'png',
      quality: 0.95,
      pixelRatio: 2
    });
    const res = await fetch(dataUrl);
    blob = await res.blob();
    mimeType = isJpeg ? 'image/jpeg' : 'image/png';
    const ext = isJpeg ? '.jpg' : '.png';
    safeFilename = filename.endsWith(ext) ? filename : `${filename}${ext}`;
  }

  return await uploadCertificateToOneDrive({
    blob,
    filename: safeFilename,
    mimeType,
    interactive: true
  });
}

// Backward-compatible alias
export const saveCertificateToDrive = saveCertificateToOneDrive;

/**
 * Direct print of the certificate
 */
export function printCertificate() {
  window.print();
}
