import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Check if this window was opened as a OneDrive OAuth popup callback
if (
  typeof window !== 'undefined' &&
  window.opener &&
  (window.location.hash.includes('access_token=') ||
   window.location.hash.includes('error=') ||
   window.location.search.includes('code='))
) {
  try {
    window.opener.postMessage(
      {
        type: 'ONEDRIVE_AUTH_CALLBACK',
        hash: window.location.hash,
        search: window.location.search
      },
      window.location.origin
    );
  } catch (err) {
    console.error('Error posting OneDrive auth message:', err);
  }
  window.close();
} else {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
