import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  Search,
  Eye,
  Copy,
  ExternalLink,
  ShieldAlert,
  Trash2,
  CheckCircle,
  XCircle,
  Plus,
  CheckCircle2,
  Users,
  Award,
  Upload,
  GraduationCap,
  Sparkles
} from 'lucide-react';
import {
  getCertificatesList,
  updateCertificateStatus,
  deleteCertificate,
  batchDeleteCertificates,
  deleteAllCertificates,
  getStudentsList,
  addStudent,
  deleteStudent,
  batchDeleteStudents,
  deleteAllStudents,
  importStudentsFile
} from '../services/api';
import { COLLEGE_DEPARTMENTS } from '../constants/departments';

export default function RegistryView({
  onSelectCertificateForPreview,
  onIssueCertificate,
  onGenerateCertificateForStudent
}) {
  // Active sub-tab: 'certificates' or 'students'
  const [activeSubTab, setActiveSubTab] = useState('certificates');

  // Certificate Registry state
  const [certificates, setCertificates] = useState([]);
  const [search, setSearch] = useState('');
  const [certType, setCertType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [feedback, setFeedback] = useState(null);

  // Student Database state
  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentDept, setStudentDept] = useState('All');
  const [studentYear, setStudentYear] = useState('All');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showImportStudentModal, setShowImportStudentModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importStatus, setImportStatus] = useState(null);
  const [studentFormData, setStudentFormData] = useState({
    roll_number: '',
    name: '',
    course: 'B.Tech CSE',
    year: '3rd Year',
    department: 'Computer Science and Engineering',
    email: '',
    phone: ''
  });

  useEffect(() => {
    if (activeSubTab === 'certificates') {
      loadCertificates();
    } else {
      loadStudents();
    }
  }, [activeSubTab, certType, studentDept, studentYear]);

  const loadCertificates = async () => {
    try {
      setLoading(true);
      const res = await getCertificatesList({
        search: search || undefined,
        type: certType !== 'all' ? certType : undefined
      });
      setCertificates(res.data.certificates || []);
      setSelectedIds([]);
    } catch (err) {
      console.error('Failed to load certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      setLoading(true);
      const res = await getStudentsList({
        search: studentSearch || undefined,
        department: studentDept !== 'All' ? studentDept : undefined,
        year: studentYear !== 'All' ? studentYear : undefined
      });
      setStudents(res.data || []);
      setSelectedStudentIds([]);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (activeSubTab === 'certificates') {
      loadCertificates();
    } else {
      loadStudents();
    }
  };

  const handleToggleStatus = async (certId, currentStatus) => {
    const nextStatus = currentStatus === 1 ? 0 : 1;
    const confirmMsg = nextStatus === 0
      ? `Are you sure you want to REVOKE certificate ${certId}? It will be flagged as invalid on the verification portal.`
      : `Re-validate certificate ${certId}?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await updateCertificateStatus(certId, nextStatus);
      setFeedback({ type: 'success', text: `Certificate ${certId} status updated.` });
      setTimeout(() => setFeedback(null), 3000);
      loadCertificates();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (certId) => {
    if (!window.confirm(`Permanently delete certificate record ${certId}?`)) return;
    try {
      await deleteCertificate(certId);
      setFeedback({ type: 'success', text: `Certificate ${certId} deleted successfully.` });
      setTimeout(() => setFeedback(null), 3000);
      loadCertificates();
    } catch (err) {
      alert('Failed to delete certificate: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} selected certificates?`)) return;
    try {
      await batchDeleteCertificates(selectedIds);
      setFeedback({ type: 'success', text: `Successfully deleted ${selectedIds.length} certificates.` });
      setTimeout(() => setFeedback(null), 3000);
      loadCertificates();
    } catch (err) {
      alert('Failed to delete selected certificates: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Are you sure you want to delete ALL certificates? This action cannot be undone.')) return;
    try {
      await deleteAllCertificates();
      setFeedback({ type: 'success', text: 'All certificates deleted from registry.' });
      setTimeout(() => setFeedback(null), 3000);
      loadCertificates();
    } catch (err) {
      alert('Failed to delete all certificates');
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === certificates.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(certificates.map(c => c.certificate_id));
    }
  };

  const handleToggleSelect = (certId) => {
    setSelectedIds(prev =>
      prev.includes(certId) ? prev.filter(x => x !== certId) : [...prev, certId]
    );
  };

  const handleCopyLink = (certId) => {
    const url = `${window.location.origin}/verify/${certId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(certId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Student Actions
  const handleQuickFillStudentSample = () => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    const sampleNames = ['Maya Krishnan', 'Arjun Singhania', 'Sneha Kulkarni', 'Aditya Nair', 'Pooja Hegde'];
    const chosenName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const roll = `23BCS${randomNum}`;
    setStudentFormData({
      roll_number: roll,
      name: chosenName,
      course: 'B.Tech CSE',
      year: '3rd Year',
      department: 'Computer Science & Engineering',
      email: `${chosenName.toLowerCase().replace(' ', '.')}@student.college.edu`,
      phone: '+91 98' + Math.floor(10000000 + Math.random() * 90000000)
    });
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      await addStudent(studentFormData);
      setShowAddStudentModal(false);
      setStudentFormData({
        roll_number: '',
        name: '',
        course: 'B.Tech CSE',
        year: '3rd Year',
        department: 'Computer Science & Engineering',
        email: '',
        phone: ''
      });
      setFeedback({ type: 'success', text: `Student ${studentFormData.name} added to database successfully!` });
      setTimeout(() => setFeedback(null), 3000);
      loadStudents();
    } catch (err) {
      alert('Failed to add student: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteStudent = async (id, name) => {
    if (!window.confirm(`Delete student record for ${name || 'selected student'}?`)) return;
    try {
      await deleteStudent(id);
      setFeedback({ type: 'success', text: 'Student deleted from database.' });
      setTimeout(() => setFeedback(null), 3000);
      loadStudents();
    } catch (err) {
      alert('Failed to delete student: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleBatchDeleteStudents = async () => {
    if (selectedStudentIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedStudentIds.length} selected students?`)) return;
    try {
      await batchDeleteStudents(selectedStudentIds);
      setFeedback({ type: 'success', text: `Successfully deleted ${selectedStudentIds.length} students.` });
      setTimeout(() => setFeedback(null), 3000);
      loadStudents();
    } catch (err) {
      alert('Failed to delete selected students: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteAllStudents = async () => {
    if (!window.confirm('Delete ALL student records from the database? This cannot be undone.')) return;
    try {
      await deleteAllStudents();
      setFeedback({ type: 'success', text: 'All student records cleared from database.' });
      setTimeout(() => setFeedback(null), 3000);
      loadStudents();
    } catch (err) {
      alert('Failed to delete students: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleToggleSelectAllStudents = () => {
    if (selectedStudentIds.length === students.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(students.map(s => s.id));
    }
  };

  const handleToggleSelectStudent = (id) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleImportStudents = async (e) => {
    e.preventDefault();
    if (!importFile) return;

    try {
      setImportStatus('Processing and validating student file...');
      const formData = new FormData();
      formData.append('file', importFile);
      const res = await importStudentsFile(formData);
      setImportStatus(res.data.message || 'Import successful!');
      setTimeout(() => {
        setShowImportStudentModal(false);
        setImportFile(null);
        setImportStatus(null);
        loadStudents();
      }, 1500);
    } catch (err) {
      alert('Failed to import students: ' + (err.response?.data?.error || err.message));
      setImportStatus(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Sub-tabs */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Students & Certificates Registry
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
              {activeSubTab === 'certificates' ? `${certificates.length} Certificates` : `${students.length} Enrolled`}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Unified directory of enrolled students, issued credentials, cryptographic verification IDs, and validity audits.
          </p>

          {/* Sub-Tab Navigation Toggle */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold mt-4 w-fit">
            <button
              onClick={() => setActiveSubTab('certificates')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition ${
                activeSubTab === 'certificates'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCheck className="w-4 h-4 text-amber-600" />
              <span>Certificate Registry ({certificates.length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('students')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition ${
                activeSubTab === 'students'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Student Database ({students.length})</span>
            </button>
          </div>
        </div>

        {/* Action Buttons depending on sub-tab */}
        <div className="flex items-center flex-wrap gap-2">
          {activeSubTab === 'certificates' ? (
            <>
              {selectedIds.length > 0 && (
                <button
                  onClick={handleBatchDelete}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Selected ({selectedIds.length})</span>
                </button>
              )}

              <button
                onClick={handleDeleteAll}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-300 font-bold text-xs transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All</span>
              </button>

              {onIssueCertificate && (
                <button
                  onClick={onIssueCertificate}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Issue New Certificate</span>
                </button>
              )}
            </>
          ) : (
            <>
              {selectedStudentIds.length > 0 && (
                <button
                  onClick={handleBatchDeleteStudents}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Selected ({selectedStudentIds.length})</span>
                </button>
              )}

              <button
                onClick={handleDeleteAllStudents}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-300 font-bold text-xs transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All</span>
              </button>

              <button
                onClick={() => setShowImportStudentModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-sm transition"
              >
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>Import CSV / Excel</span>
              </button>

              <button
                onClick={() => setShowAddStudentModal(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Student</span>
              </button>
            </>
          )}
        </div>
      </div>
      {/* Feedback Toast */}
      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* VIEW 1: CERTIFICATE REGISTRY SUB-TAB */}
      {activeSubTab === 'certificates' && (
        <>
          {/* Filter and Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <form onSubmit={handleSearch} className="w-full md:w-96 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ID, Student Name, Roll No, Event..."
                className="w-full text-xs pl-9 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </form>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={certType}
                onChange={(e) => setCertType(e.target.value)}
                className="text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-700"
              >
                <option value="all">All Certificate Types</option>
                <option value="winner">Winner / Excellence</option>
                <option value="participation">Participation</option>
                <option value="internship">Internship Completion</option>
                <option value="achievement">Achievement</option>
                <option value="merit">Academic Merit</option>
                <option value="completion">Course Completion</option>
              </select>
            </div>
          </div>

          {/* Registry Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={certificates.length > 0 && selectedIds.length === certificates.length}
                        onChange={handleToggleSelectAll}
                        className="w-3.5 h-3.5 rounded text-amber-500 focus:ring-amber-400"
                      />
                    </th>
                    <th className="py-3 px-4">Certificate ID</th>
                    <th className="py-3 px-4">Recipient Name</th>
                    <th className="py-3 px-4">Event & Date</th>
                    <th className="py-3 px-4">Category & Rank</th>
                    <th className="py-3 px-4">Validity</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {certificates.length > 0 ? (
                    certificates.map((cert) => {
                      const isSelected = selectedIds.includes(cert.certificate_id);
                      return (
                        <tr key={cert.certificate_id} className={isSelected ? 'bg-amber-50/50' : 'hover:bg-slate-50'}>
                          <td className="py-3 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelect(cert.certificate_id)}
                              className="w-3.5 h-3.5 rounded text-amber-500 focus:ring-amber-400"
                            />
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            <div>{cert.certificate_id}</div>
                            <span className="text-[10px] text-slate-400 font-normal">Issued: {cert.issue_date}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{cert.recipient_name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {cert.roll_number || 'N/A'} • {cert.department || 'General'}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-800 max-w-[200px] truncate">{cert.event_name}</div>
                            <div className="text-[10px] text-slate-500">{cert.organization}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                              cert.certificate_type === 'winner'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : cert.certificate_type === 'internship'
                                ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                            }`}>
                              {cert.rank_or_role || cert.certificate_type}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {cert.is_valid === 1 ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Valid</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-rose-700 font-bold text-[11px]">
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Revoked</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => onSelectCertificateForPreview(cert.certificate_id)}
                                className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                title="Preview & Download (PDF/PNG/JPG)"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleCopyLink(cert.certificate_id)}
                                className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Copy Public Verification URL"
                              >
                                {copiedId === cert.certificate_id ? (
                                  <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                              <a
                                href={`/verify/${cert.certificate_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                title="Open Verification Portal"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                              <button
                                onClick={() => handleToggleStatus(cert.certificate_id, cert.is_valid)}
                                className={`p-1.5 rounded-lg transition ${
                                  cert.is_valid === 1
                                    ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                                    : 'text-emerald-600 hover:bg-emerald-50'
                                }`}
                                title={cert.is_valid === 1 ? 'Revoke validity' : 'Restore validity'}
                              >
                                <ShieldAlert className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(cert.certificate_id)}
                                className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition"
                                title="Delete certificate"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No certificate records found in database. Issue one in Certificate Studio or seed samples in Database Hub.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* VIEW 2: STUDENT DATABASE SUB-TAB */}
      {activeSubTab === 'students' && (
        <>
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <form onSubmit={handleSearch} className="w-full md:w-96 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search by Roll No, Student Name, Email..."
                className="w-full text-xs pl-9 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </form>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={studentDept}
                onChange={(e) => setStudentDept(e.target.value)}
                className="text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-700"
              >
                <option value="All">All Departments</option>
                {COLLEGE_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              <select
                value={studentYear}
                onChange={(e) => setStudentYear(e.target.value)}
                className="text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-700"
              >
                <option value="All">All Years</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={students.length > 0 && selectedStudentIds.length === students.length}
                        onChange={handleToggleSelectAllStudents}
                        className="w-3.5 h-3.5 rounded text-amber-500 focus:ring-amber-400"
                      />
                    </th>
                    <th className="py-3 px-4">Roll Number</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Program & Year</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Contact Email</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.length > 0 ? (
                    students.map((s) => {
                      const isSelected = selectedStudentIds.includes(s.id);
                      return (
                        <tr key={s.id} className={isSelected ? 'bg-amber-50/50' : 'hover:bg-slate-50'}>
                          <td className="py-3 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectStudent(s.id)}
                              className="w-3.5 h-3.5 rounded text-amber-500 focus:ring-amber-400"
                            />
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {s.roll_number}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {s.name}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {s.course} • <span className="text-amber-800 font-semibold">{s.year}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {s.department}
                          </td>
                          <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                            {s.email}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {onGenerateCertificateForStudent && (
                                <button
                                  onClick={() => onGenerateCertificateForStudent(s)}
                                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 font-bold text-[11px] transition inline-flex items-center gap-1"
                                  title="Generate Certificate"
                                >
                                  <Award className="w-3.5 h-3.5" />
                                  <span>Issue Cert</span>
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteStudent(s.id, s.name)}
                                className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition"
                                title="Delete student"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No students enrolled yet. Add students manually, import CSV/Excel, or generate certificates from events.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ADD STUDENT MODAL */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Add Student to Database</h3>
              <button
                type="button"
                onClick={handleQuickFillStudentSample}
                className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Quick Fill</span>
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700">Roll Number *</label>
                <input
                  type="text"
                  required
                  value={studentFormData.roll_number}
                  onChange={(e) => setStudentFormData({ ...studentFormData, roll_number: e.target.value })}
                  className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-xl mt-1 uppercase"
                  placeholder="23BCS101"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Student Name *</label>
                <input
                  type="text"
                  required
                  value={studentFormData.name}
                  onChange={(e) => setStudentFormData({ ...studentFormData, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl mt-1 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="e.g. Maya Krishnan"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Course</label>
                  <input
                    type="text"
                    value={studentFormData.course}
                    onChange={(e) => setStudentFormData({ ...studentFormData, course: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Year</label>
                  <select
                    value={studentFormData.year}
                    onChange={(e) => setStudentFormData({ ...studentFormData, year: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl mt-1 bg-white"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Department *</label>
                <select
                  required
                  value={studentFormData.department}
                  onChange={(e) => setStudentFormData({ ...studentFormData, department: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl mt-1 bg-white text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="">Select Department...</option>
                  {studentFormData.department && !COLLEGE_DEPARTMENTS.includes(studentFormData.department) && (
                    <option value={studentFormData.department}>{studentFormData.department}</option>
                  )}
                  {COLLEGE_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Email Address *</label>
                <input
                  type="email"
                  required
                  value={studentFormData.email}
                  onChange={(e) => setStudentFormData({ ...studentFormData, email: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl mt-1"
                  placeholder="maya.k@student.college.edu"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md"
                >
                  Save Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMPORT STUDENTS MODAL */}
      {showImportStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Import Student Database</h3>
            <p className="text-xs text-slate-500 mb-3">
              Upload Excel or CSV file. Existing roll numbers will be updated automatically.
            </p>

            <form onSubmit={handleImportStudents} className="space-y-4">
              <input
                type="file"
                required
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={(e) => setImportFile(e.target.files[0])}
                className="w-full text-xs p-3 border border-slate-300 rounded-xl"
              />

              {importStatus && (
                <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{importStatus}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportStudentModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!importFile}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md disabled:opacity-50"
                >
                  Import File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
