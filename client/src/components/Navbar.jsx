import React, { useState, useEffect } from 'react';
import {
  Award,
  LayoutDashboard,
  FileCheck,
  Layers,
  Calendar,
  Users,
  GraduationCap,
  ShieldCheck,
  LogOut,
  Database,
  Sparkles,
  Lock
} from 'lucide-react';
import { OneDriveIcon } from './OneDriveModal';
import { getStoredAccessToken } from '../services/oneDrive';

export default function Navbar({
  activeTab,
  setActiveTab,
  user,
  onLogout,
  onOpenVerify,
  onOpenDataHub,
  onOpenOneDrive,
  onOpenGoogleDrive
}) {
  const [driveConnected, setDriveConnected] = useState(false);

  const handleOpenCloudDrive = onOpenOneDrive || onOpenGoogleDrive;

  useEffect(() => {
    setDriveConnected(!!getStoredAccessToken());
    const handleAuth = (e) => setDriveConnected(e.detail.connected);
    window.addEventListener('onedrive_auth_change', handleAuth);
    window.addEventListener('gdrive_auth_change', handleAuth);
    return () => {
      window.removeEventListener('onedrive_auth_change', handleAuth);
      window.removeEventListener('gdrive_auth_change', handleAuth);
    };
  }, []);

  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'studio', label: 'Certificate Studio', icon: Award },
    { id: 'bulk', label: 'Bulk Generator', icon: Layers },
    { id: 'events', label: 'Events & Winners', icon: Calendar },
    { id: 'registry', label: 'Students & Registry', icon: FileCheck },
    { id: 'faculty', label: 'Faculty Management', icon: Users },
    { id: 'student', label: 'Student Search', icon: GraduationCap },
    { id: 'verify', label: 'Verify Portal', icon: ShieldCheck, highlight: true },
  ];

  // If not logged in, show student certificate search, public verify portal, and sign-in indicator
  const navItems = user
    ? allNavItems
    : [
        { id: 'student', label: 'Student Certificate Search', icon: GraduationCap, highlight: true },
        { id: 'verify', label: 'Public Verification Portal', icon: ShieldCheck }
      ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            {/* Upper-left Admin / Faculty Sign In option when not logged in */}
            {!user && (
              <button
                onClick={() => setActiveTab('auth')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer shrink-0"
                title="Sign in as Admin or Faculty"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Sign in as Admin</span>
              </button>
            )}

            {/* Logo & Brand */}
            <div
              className="flex items-center gap-2.5 cursor-pointer"
              onClick={() => setActiveTab(user ? 'dashboard' : 'student')}
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-md shadow-amber-500/20">
                <Award className="w-5 h-5 text-slate-950 font-black" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-base sm:text-lg tracking-tight text-white uppercase font-sans">
                    DRONACHARYA
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-200 border border-blue-500/30">
                    College of Engineering
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 font-medium hidden md:block">
                  DCE CertiHub • Official Examination & Event Accreditation
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* OneDrive Cloud Sync Button */}
            <button
              onClick={handleOpenCloudDrive}
              title="Microsoft OneDrive Cloud Sync & Auto-Save"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-sm cursor-pointer ${
                driveConnected
                  ? 'bg-sky-950/70 border-sky-600/50 hover:bg-sky-900/80 text-sky-200'
                  : 'bg-slate-800 border-slate-700 hover:bg-slate-700/80 text-slate-200'
              }`}
            >
              <OneDriveIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">OneDrive</span>
              {driveConnected ? (
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" title="OneDrive Auto-Save Active" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-slate-500" title="Click to Connect OneDrive" />
              )}
            </button>

            {/* Database & Local Data Hub Button */}
            {user && (
              <button
                onClick={onOpenDataHub}
                title="Database & Local Storage Manager"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/70 border border-indigo-700/50 hover:bg-indigo-900/80 text-indigo-200 text-xs font-bold transition shadow-sm"
              >
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Database Hub</span>
              </button>
            )}

            {user ? (
              <div className="flex items-center gap-2.5 bg-slate-800/80 border border-slate-700/60 pl-3 pr-2 py-1 rounded-full">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-slate-100">{user.name}</div>
                  <div className="text-[10px] text-amber-400 font-mono capitalize">
                    {user.role === 'admin' ? '👑 Admin' : '🎓 Faculty'} • {user.department || 'Campus'}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xs font-extrabold text-slate-950 shadow-inner">
                  {user.name.charAt(0)}
                </div>
                <button
                  onClick={onLogout}
                  title="Logout"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 rounded-full transition flex items-center gap-1"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('auth')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-md ${
                    activeTab === 'auth'
                      ? 'bg-amber-400 text-slate-950 shadow-amber-500/20'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-slate-950/80 border-t border-slate-800/60 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between py-1.5">
          <div className="flex space-x-1 sm:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                      : item.highlight
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/40 hover:bg-emerald-900/60'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : item.highlight ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {!user && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-amber-400/90 font-medium">
              <span>Sign in required to access student databases & issue certificates</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
