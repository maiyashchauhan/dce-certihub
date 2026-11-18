import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DashboardView from './views/DashboardView';
import CertificateStudioView from './views/CertificateStudioView';
import BulkGeneratorView from './views/BulkGeneratorView';
import EventsView from './views/EventsView';
import StudentsView from './views/StudentsView';
import FacultyView from './views/FacultyView';
import RegistryView from './views/RegistryView';
import VerifyPortalView from './views/VerifyPortalView';
import StudentPortalView from './views/StudentPortalView';
import AuthView from './views/AuthView';
import DataHubModal from './components/DataHubModal';
import OneDriveModal from './components/OneDriveModal';
import OneDriveNotification from './components/OneDriveNotification';
import { getCertificateById } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('student');
  const [user, setUser] = useState(null);
  const [studioInitialData, setStudioInitialData] = useState(null);
  const [verifyCertId, setVerifyCertId] = useState('');
  const [showDataHub, setShowDataHub] = useState(false);
  const [showOneDriveModal, setShowOneDriveModal] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    // Check URL path for direct verification link or student search
    const path = window.location.pathname;
    if (path.startsWith('/verify')) {
      const parts = path.split('/');
      if (parts[2]) {
        setVerifyCertId(parts[2]);
      }
      setActiveTab('verify');
    } else if (path.startsWith('/student')) {
      setActiveTab('student');
    }

    // Check saved logged in user
    const savedUser = localStorage.getItem('cert_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        // If user is already authenticated and on default root, show dashboard
        if (!path.startsWith('/verify') && !path.startsWith('/student')) {
          setActiveTab('dashboard');
        }
      } catch (e) {
        console.error('Error parsing stored user:', e);
        localStorage.removeItem('cert_user');
        localStorage.removeItem('cert_token');
        setActiveTab('student');
      }
    } else {
      // If not logged in and not verifying, main page is always the student portal!
      if (!path.startsWith('/verify')) {
        setActiveTab('student');
      }
    }

    // Listen for auth expiration
    const handleAuthExpired = () => {
      setUser(null);
      setActiveTab('student');
    };
    window.addEventListener('auth_expired', handleAuthExpired);
    return () => window.removeEventListener('auth_expired', handleAuthExpired);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('cert_token');
    localStorage.removeItem('cert_user');
    setUser(null);
    setActiveTab('student');
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setActiveTab('dashboard');
  };

  const handleDataChanged = () => {
    setDataVersion(prev => prev + 1);
  };

  // Shortcut from Student row to Certificate Studio
  const handleGenerateForStudent = (student) => {
    setStudioInitialData({
      recipient_name: student.name,
      roll_number: student.roll_number,
      department: student.department,
      course: student.course,
      recipient_email: student.email,
      certificate_type: 'merit',
      rank_or_role: 'Academic Excellence'
    });
    setActiveTab('studio');
  };

  // Shortcut from Event to Bulk Generator
  const handleGenerateForEvent = (event) => {
    setActiveTab('bulk');
  };

  // Preview certificate in studio from dashboard or registry
  const handlePreviewCertificate = async (certId) => {
    try {
      const res = await getCertificateById(certId);
      if (res.data) {
        setStudioInitialData(res.data);
        setActiveTab('studio');
      }
    } catch (err) {
      console.error('Failed to load certificate for preview:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
        onOpenVerify={() => setActiveTab('verify')}
        onOpenDataHub={() => setShowDataHub(true)}
        onOpenOneDrive={() => setShowOneDriveModal(true)}
        onOpenGoogleDrive={() => setShowOneDriveModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* If user is not authenticated and not on public pages (student portal or verify), force AuthView */}
        {!user && activeTab !== 'verify' && activeTab !== 'student' ? (
          <AuthView onLoginSuccess={handleLoginSuccess} />
        ) : (
          <>
            {activeTab === 'student' && (
              <StudentPortalView
                onOpenAdminLogin={() => setActiveTab('auth')}
                onVerifyCertificate={(certId) => {
                  setVerifyCertId(certId);
                  setActiveTab('verify');
                  window.history.pushState(null, '', `/verify/${certId}`);
                }}
              />
            )}

            {activeTab === 'dashboard' && (
              <DashboardView
                key={`dashboard-${dataVersion}`}
                setActiveTab={setActiveTab}
                onSelectCertificateForPreview={handlePreviewCertificate}
                onOpenDataHub={() => setShowDataHub(true)}
              />
            )}

            {activeTab === 'studio' && (
              <CertificateStudioView
                key={`studio-${dataVersion}`}
                initialData={studioInitialData}
                onCertificateSaved={(cert) => {
                  setDataVersion(prev => prev + 1);
                }}
              />
            )}

            {activeTab === 'bulk' && (
              <BulkGeneratorView
                key={`bulk-${dataVersion}`}
                onSelectCertificateForPreview={handlePreviewCertificate}
              />
            )}

            {activeTab === 'events' && (
              <EventsView
                key={`events-${dataVersion}`}
                onGenerateCertificatesForEvent={handleGenerateForEvent}
              />
            )}

            {activeTab === 'students' && (
              <StudentsView
                key={`students-${dataVersion}`}
                onGenerateCertificateForStudent={handleGenerateForStudent}
              />
            )}

            {activeTab === 'faculty' && (
              <FacultyView
                key={`faculty-${dataVersion}`}
              />
            )}

            {activeTab === 'registry' && (
              <RegistryView
                key={`registry-${dataVersion}`}
                onSelectCertificateForPreview={handlePreviewCertificate}
                onIssueCertificate={() => setActiveTab('studio')}
                onGenerateCertificateForStudent={handleGenerateForStudent}
              />
            )}

            {activeTab === 'verify' && (
              <VerifyPortalView initialCertId={verifyCertId} />
            )}

            {activeTab === 'auth' && (
              <AuthView onLoginSuccess={handleLoginSuccess} />
            )}
          </>
        )}
      </main>

      {/* Global Data Hub Modal */}
      <DataHubModal
        isOpen={showDataHub}
        onClose={() => setShowDataHub(false)}
        onDataChanged={handleDataChanged}
      />

      {/* Microsoft OneDrive Cloud Settings & Sync Modal */}
      <OneDriveModal
        isOpen={showOneDriveModal}
        onClose={() => setShowOneDriveModal(false)}
      />

      {/* Floating OneDrive Notification & Toast Manager */}
      <OneDriveNotification
        onOpenSettings={() => setShowOneDriveModal(true)}
      />

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 text-center text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <strong className="text-slate-200">DCE CertiHub</strong> • One Campus, Every Achievement
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span>A4 Landscape PDF Engine</span>
            <span>•</span>
            <span>Multi-Template Styling</span>
            <span>•</span>
            <span>QR Anti-Fraud Check</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
