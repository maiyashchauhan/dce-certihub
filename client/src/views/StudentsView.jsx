import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  Upload,
  Search,
  Trash2,
  Award,
  Download,
  CheckCircle2,
  Sparkles,
  CheckSquare,
  Square
} from 'lucide-react';
import {
  getStudentsList,
  addStudent,
  deleteStudent,
  batchDeleteStudents,
  deleteAllStudents,
  importStudentsFile
} from '../services/api';
import { COLLEGE_DEPARTMENTS } from '../constants/departments';

export default function StudentsView({
  onGenerateCertificateForStudent
}) {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [year, setYear] = useState('All');
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importStatus, setImportStatus] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Form
  const [formData, setFormData] = useState({
    roll_number: '',
    name: '',
    course: 'B.Tech CSE',
    year: '3rd Year',
    department: 'Computer Science and Engineering',
    email: '',
    phone: ''
  });

  useEffect(() => {
    loadStudents();
  }, [department, year]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const res = await getStudentsList({
        search: search || undefined,
        department: department !== 'All' ? department : undefined,
        year: year !== 'All' ? year : undefined
      });
      setStudents(res.data || []);
      setSelectedIds([]);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadStudents();
  };

  const handleQuickFillSample = () => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    const sampleNames = ['Maya Krishnan', 'Arjun Singhania', 'Sneha Kulkarni', 'Aditya Nair', 'Pooja Hegde'];
    const chosenName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const roll = `23BCS${randomNum}`;
    setFormData({
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
      await addStudent(formData);
      setShowAddModal(false);
      setFormData({
        roll_number: '',
        name: '',
        course: 'B.Tech CSE',
        year: '3rd Year',
        department: 'Computer Science & Engineering',
        email: '',
        phone: ''
      });
      setFeedback({ type: 'success', text: `Student ${formData.name} added to database successfully!` });
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

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} selected students?`)) return;
    try {
      await batchDeleteStudents(selectedIds);
      setFeedback({ type: 'success', text: `Successfully deleted ${selectedIds.length} students.` });
      setTimeout(() => setFeedback(null), 3000);
      loadStudents();
    } catch (err) {
      alert('Failed to delete selected students: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteAllStudents = async () => {
    if (!window.confirm('Are you sure you want to delete ALL students from the database? This action cannot be undone.')) return;
    try {
      await deleteAllStudents();
      setFeedback({ type: 'success', text: 'All student records cleared from database.' });
      setTimeout(() => setFeedback(null), 3000);
      loadStudents();
    } catch (err) {
      alert('Failed to delete all students');
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === students.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(students.map(s => s.id));
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) return;

    const fd = new FormData();
    fd.append('file', importFile);

    try {
      const res = await importStudentsFile(fd);
      setImportStatus(res.data.message);
      loadStudents();
      setTimeout(() => {
        setShowImportModal(false);
        setImportStatus(null);
        setImportFile(null);
      }, 1500);
    } catch (err) {
      alert('Import failed: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Student Database Registry</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
              {students.length} Enrolled
            </span>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
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
            onClick={handleDeleteAllStudents}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-300 font-bold text-xs transition"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All</span>
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-sm transition"
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>Import CSV / Excel</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="w-full md:w-96 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Roll No, Student Name, Email..."
            className="w-full text-xs pl-9 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
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
            value={year}
            onChange={(e) => setYear(e.target.value)}
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
                    checked={students.length > 0 && selectedIds.length === students.length}
                    onChange={handleToggleSelectAll}
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
                  const isSelected = selectedIds.includes(s.id);
                  return (
                    <tr key={s.id} className={isSelected ? 'bg-amber-50/50' : 'hover:bg-slate-50'}>
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(s.id)}
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
                          <button
                            onClick={() => onGenerateCertificateForStudent(s)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 font-bold text-[11px] transition inline-flex items-center gap-1"
                            title="Generate Certificate"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>Issue Cert</span>
                          </button>
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
                    No student records found in database. Use "Add Student" above or the "Database Hub" to seed sample data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD STUDENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Add Student to Database</h3>
              <button
                type="button"
                onClick={handleQuickFillSample}
                className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Quick Fill Sample</span>
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Roll Number *</label>
                <input
                  type="text"
                  required
                  value={formData.roll_number}
                  onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                  className="w-full text-xs font-mono uppercase px-3 py-2 border border-slate-300 rounded-xl mt-1 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="e.g. 23BCS106"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Student Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl mt-1 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="e.g. Maya Krishnan"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Course</label>
                  <input
                    type="text"
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Year</label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
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
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl mt-1 bg-white text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="">Select Department...</option>
                  {formData.department && !COLLEGE_DEPARTMENTS.includes(formData.department) && (
                    <option value={formData.department}>{formData.department}</option>
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
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl mt-1"
                  placeholder="maya.k@student.college.edu"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl mt-1"
                  placeholder="+91 98765 00000"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md"
                >
                  Save Student to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMPORT STUDENTS MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Import Student Database</h3>
            <p className="text-xs text-slate-500 mb-3">
              Upload Excel or CSV file. Existing roll numbers will be updated automatically.
            </p>

            <form onSubmit={handleImportSubmit} className="space-y-4">
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
                  onClick={() => setShowImportModal(false)}
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
