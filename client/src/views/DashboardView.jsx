import React, { useState, useEffect } from 'react';
import {
  Award,
  Calendar,
  GraduationCap,
  Users,
  PlusCircle,
  FileSpreadsheet,
  ShieldCheck,
  ArrowRight,
  Clock,
  Sparkles,
  Download,
  Eye,
  CheckCircle2,
  Database
} from 'lucide-react';
import { getDashboardStats } from '../services/api';

export default function DashboardView({
  setActiveTab,
  onSelectCertificateForPreview,
  onOpenDataHub
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await getDashboardStats();
      setData(res.data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = data?.stats || {
    totalCertificates: 0,
    totalEvents: 0,
    totalStudents: 0,
    totalFaculty: 0
  };

  const recentCertificates = data?.recentCertificates || [];
  const typeDistribution = data?.typeDistribution || [];
  const recentLogs = data?.recentLogs || [];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>DCE CertiHub • One Campus, Every Achievement</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Dronacharya College of Engineering
          </h1>

          {/* Quick Buttons */}
          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={() => setActiveTab('studio')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Certificate</span>
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs sm:text-sm transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Bulk Excel/CSV Generator</span>
            </button>
            <button
              onClick={() => setActiveTab('verify')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/50 font-semibold text-xs sm:text-sm transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>QR Code Verification Portal</span>
            </button>
            {onOpenDataHub && (
              <button
                onClick={onOpenDataHub}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/50 font-semibold text-xs sm:text-sm transition-all"
              >
                <Database className="w-4 h-4 text-indigo-400" />
                <span>Database Hub & Local Storage</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Certificates Issued</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{stats.totalCertificates}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-3 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> All digitally signed & QR verified
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Events & Hackathons</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{stats.totalEvents}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[11px] text-blue-600 font-medium mt-3">
            With categorized participants & winners
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Enrolled Students</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{stats.totalStudents}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[11px] text-indigo-600 font-medium mt-3">
            Indexed by roll number & branch
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Faculty Coordinators</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{stats.totalFaculty}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[11px] text-purple-600 font-medium mt-3">
            Authorized digital signatories
          </p>
        </div>
      </div>

      {/* Grid: Recent Certificates & Distribution / Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Certificates */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recently Generated Certificates</h2>
              <p className="text-xs text-slate-500">Live issued credentials in the college registry</p>
            </div>
            <button
              onClick={() => setActiveTab('registry')}
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Certificate ID</th>
                  <th className="py-2.5 px-3">Recipient</th>
                  <th className="py-2.5 px-3">Event / Program</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentCertificates.length > 0 ? (
                  recentCertificates.map((cert) => (
                    <tr key={cert.certificate_id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">
                        {cert.certificate_id}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        <div>{cert.recipient_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{cert.roll_number}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 max-w-[180px] truncate">
                        {cert.event_name}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full font-semibold text-[10px] uppercase ${
                          cert.certificate_type === 'winner'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : cert.certificate_type === 'internship'
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {cert.rank_or_role || cert.certificate_type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => onSelectCertificateForPreview(cert.certificate_id)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          title="Preview & Download"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No certificates generated yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Breakdown */}
        <div className="space-y-6">
          {/* Distribution card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Certificate Distribution</h3>
            <p className="text-xs text-slate-500 mb-4">Breakdown by category & award type</p>

            <div className="space-y-3">
              {typeDistribution.map((item) => (
                <div key={item.certificate_type} className="flex items-center justify-between text-xs">
                  <span className="capitalize font-medium text-slate-700 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    {item.certificate_type}
                  </span>
                  <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
