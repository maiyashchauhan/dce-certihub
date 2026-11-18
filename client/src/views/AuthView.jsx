import React, { useState } from 'react';
import {
  Award,
  Lock,
  Mail,
  ShieldCheck,
  User,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  AlertCircle
} from 'lucide-react';
import { loginUser, registerUser, verifyResetEmail, resetPassword } from '../services/api';
import { COLLEGE_DEPARTMENTS } from '../constants/departments';

export default function AuthView({ onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Computer Science and Engineering');
  const [employeeId, setEmployeeId] = useState('');
  const [role, setRole] = useState('faculty');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Eye visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Forgot Password specific state
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verifiedAccount, setVerifiedAccount] = useState(null);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await loginUser(email, password);
      localStorage.setItem('cert_token', res.data.token);
      localStorage.setItem('cert_user', JSON.stringify(res.data.user));
      onLoginSuccess(res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await registerUser({
        name,
        email,
        password,
        department,
        employee_id: employeeId,
        role
      });
      // auto-login
      const res = await loginUser(email, password);
      localStorage.setItem('cert_token', res.data.token);
      localStorage.setItem('cert_user', JSON.stringify(res.data.user));
      onLoginSuccess(res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const checkEmailAccount = async (targetEmail) => {
    const clean = (targetEmail || forgotEmail || '').trim();
    if (!clean) return;
    try {
      const res = await verifyResetEmail(clean);
      setVerifiedAccount(res.data);
      setError(null);
    } catch (err) {
      setVerifiedAccount(null);
      const msg =
        err.response?.data?.error ||
        (typeof err.response?.data === 'string' && err.response.data.includes('Cannot POST')
          ? 'Backend needs a restart to load new routes. Please restart "node run.js" in your terminal.'
          : null) ||
        (err.code === 'ERR_NETWORK' || !err.response
          ? 'Cannot connect to backend server. Please make sure "node run.js" is running.'
          : null) ||
        err.message ||
        'No registered account found for this email';
      setError(msg);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = forgotEmail.trim();
    if (!cleanEmail) {
      setError('Please enter your registered college email');
      return;
    }

    if (!newPassword) {
      setError('Please enter a new password');
      return;
    }

    if (newPassword.length < 4) {
      setError('New password must be at least 4 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword({
        email: cleanEmail,
        newPassword,
        confirmPassword
      });

      setSuccessMsg(res.data.message || 'Password reset successfully! You can now sign in.');
      setEmail(cleanEmail);
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setVerifiedAccount(null);

      // Switch to login mode smoothly
      setTimeout(() => {
        setMode('login');
      }, 1500);
    } catch (err) {
      console.error('Password reset failure:', err);
      const detailedError =
        err.response?.data?.error ||
        (typeof err.response?.data === 'string' && err.response.data.includes('Cannot POST')
          ? 'Backend needs a restart to load new routes. Please restart "node run.js" in your terminal.'
          : null) ||
        (err.code === 'ERR_NETWORK' || !err.response
          ? 'Cannot connect to backend server. Please make sure "node run.js" is running.'
          : null) ||
        err.message ||
        'Failed to reset password';
      setError(detailedError);
    } finally {
      setLoading(false);
    }
  };

  const quickFillAdmin = async () => {
    setEmail('admin@college.edu');
    setPassword('admin123');
    setMode('login');
    setLoading(true);
    setError(null);
    try {
      const res = await loginUser('admin@college.edu', 'admin123');
      localStorage.setItem('cert_token', res.data.token);
      localStorage.setItem('cert_user', JSON.stringify(res.data.user));
      onLoginSuccess(res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const quickFillFaculty = async () => {
    setEmail('faculty@college.edu');
    setPassword('faculty123');
    setMode('login');
    setLoading(true);
    setError(null);
    try {
      const res = await loginUser('faculty@college.edu', 'faculty123');
      localStorage.setItem('cert_token', res.data.token);
      localStorage.setItem('cert_user', JSON.stringify(res.data.user));
      onLoginSuccess(res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 animate-fadeIn">
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-2xl space-y-6">
        {/* Branding */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
            {mode === 'forgot' ? (
              <KeyRound className="w-8 h-8 text-slate-950 font-black" />
            ) : (
              <Award className="w-8 h-8 text-slate-950 font-black" />
            )}
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {mode === 'register'
              ? 'Register Account'
              : mode === 'forgot'
              ? 'Reset Account Password'
              : 'Sign In to DCE CertiHub'}
          </h2>
          <p className="text-xs text-amber-700 font-semibold tracking-wide uppercase">
            {mode === 'forgot'
              ? 'Recover your portal credentials'
              : 'One Campus, Every Achievement'}
          </p>
        </div>

        {/* 1-Click Fast Login Test Badges (Only in login mode) */}
        {mode === 'login' && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl space-y-2">
            <span className="text-[11px] font-bold text-amber-900 block text-center uppercase tracking-wider">
              ⚡ 1-Click Instant Test Credentials
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={quickFillAdmin}
                className="px-3 py-2 bg-white hover:bg-amber-100 text-amber-950 rounded-xl text-xs font-bold border border-amber-300 transition text-center shadow-sm"
              >
                👑 Dean / Admin
                <span className="block text-[10px] text-slate-500 font-normal">admin@college.edu</span>
              </button>
              <button
                type="button"
                onClick={quickFillFaculty}
                className="px-3 py-2 bg-white hover:bg-amber-100 text-amber-950 rounded-xl text-xs font-bold border border-amber-300 transition text-center shadow-sm"
              >
                🎓 Coordinator
                <span className="block text-[10px] text-slate-500 font-normal">faculty@college.edu</span>
              </button>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === 'forgot' ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">Official College Email *</label>
              <div className="relative mt-1">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => {
                    setForgotEmail(e.target.value);
                    setVerifiedAccount(null);
                  }}
                  onBlur={() => checkEmailAccount(forgotEmail)}
                  placeholder="faculty@college.edu"
                  className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
                />
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-[10px] text-slate-400">Quick fill:</span>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail('faculty@college.edu');
                    checkEmailAccount('faculty@college.edu');
                  }}
                  className="text-[10px] text-amber-700 hover:underline font-semibold"
                >
                  faculty@college.edu
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail('admin@college.edu');
                    checkEmailAccount('admin@college.edu');
                  }}
                  className="text-[10px] text-amber-700 hover:underline font-semibold"
                >
                  admin@college.edu
                </button>
              </div>
            </div>

            {verifiedAccount && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold">{verifiedAccount.name}</div>
                  <div className="text-[11px] text-emerald-700">
                    {verifiedAccount.department} • <span className="capitalize">{verifiedAccount.role}</span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-700">New Password *</label>
              <div className="relative mt-1">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={4}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full text-xs pl-9 pr-10 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
                />
                <button
                  type="button"
                  tabIndex="-1"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-amber-600 p-1 rounded-lg transition"
                  title={showNewPassword ? 'Hide password' : 'Show password'}
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4 text-amber-600" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Confirm New Password *</label>
              <div className="relative mt-1">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={4}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  className="w-full text-xs pl-9 pr-10 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
                />
                <button
                  type="button"
                  tabIndex="-1"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-amber-600 p-1 rounded-lg transition"
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4 text-amber-600" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              <span>{loading ? 'Updating Password...' : 'Reset & Save Password'}</span>
            </button>

            <div className="text-center pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Sign In
              </button>
            </div>
          </form>
        ) : (
          /* LOGIN & REGISTER FORMS */
          <form onSubmit={mode === 'register' ? handleRegister : handleLogin} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Full Name *</label>
                  <div className="relative mt-1">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Prof. Rajiv Verma"
                      className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Employee ID</label>
                    <input
                      type="text"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      placeholder="FAC-CSE-110"
                      className="w-full text-xs font-mono uppercase px-3 py-2 border border-slate-300 rounded-xl mt-1 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Account Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl mt-1 bg-white"
                    >
                      <option value="faculty">Faculty</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Department *</label>
                  <select
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl mt-1 bg-white text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="">Select Department...</option>
                    {department && !COLLEGE_DEPARTMENTS.includes(department) && (
                      <option value={department}>{department}</option>
                    )}
                    {COLLEGE_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-700">Official College Email *</label>
              <div className="relative mt-1">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="faculty@college.edu"
                  className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Password *</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email || '');
                      if (email) checkEmailAccount(email);
                      setMode('forgot');
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-800 hover:underline transition"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative mt-1">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs pl-9 pr-10 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
                />
                <button
                  type="button"
                  tabIndex="-1"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-amber-600 p-1 rounded-lg transition"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4 text-amber-600" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
            >
              <span>
                {loading
                  ? 'Authenticating...'
                  : mode === 'register'
                  ? 'Register & Sign In'
                  : 'Sign In to Portal'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Bottom Toggle Between Register / Sign In */}
        {mode !== 'forgot' && (
          <div className="text-center pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'register' ? 'login' : 'register');
                setError(null);
                setSuccessMsg(null);
              }}
              className="text-xs text-amber-700 hover:text-amber-800 font-semibold"
            >
              {mode === 'register'
                ? 'Already have an account? Sign In'
                : 'New faculty member? Create account'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
