import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  ShieldCheck,
  Trash2,
  Mail,
  Phone,
  Building,
  CheckCircle2,
  Sparkles,
  Upload,
  PenTool
} from 'lucide-react';
import {
  getFacultyList,
  addFacultyMember,
  deleteFacultyMember,
  batchDeleteFaculty,
  deleteAllFacultyMembers,
  uploadFile
} from '../services/api';
import { DEFAULT_COORDINATOR_SIGNATURE } from '../utils/defaultAssets';
import SignaturePadModal from '../components/SignaturePadModal';
import { COLLEGE_DEPARTMENTS } from '../constants/departments';

export default function FacultyView() {
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [showDrawModal, setShowDrawModal] = useState(false);

  const [formData, setFormData] = useState({
    employee_id: '',
    name: '',
    department: 'Computer Science and Engineering',
    designation: 'Associate Professor & Event Coordinator',
    email: '',
    phone: '',
    signature_url: DEFAULT_COORDINATOR_SIGNATURE,
    is_coordinator: 1
  });

  useEffect(() => {
    loadFaculty();
  }, []);

  const loadFaculty = async () => {
    try {
      setLoading(true);
      const res = await getFacultyList();
      setFacultyList(res.data || []);
      setSelectedIds([]);
    } catch (err) {
      console.error('Failed to load faculty:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFillSample = () => {
    const randomId = Math.floor(100 + Math.random() * 900);
    const names = ['Dr. Meenakshi Sundaram', 'Prof. Alok Pandey', 'Dr. Shalini Gupta', 'Prof. Kenneth Morris'];
    const depts = ['Computer Science & Engineering', 'Electronics & Communication', 'Information Technology', 'Mechanical Engineering'];
    const chosenName = names[Math.floor(Math.random() * names.length)];
    const chosenDept = depts[Math.floor(Math.random() * depts.length)];

    setFormData({
      employee_id: `FAC-${chosenDept.slice(0, 3).toUpperCase()}-${randomId}`,
      name: chosenName,
      department: chosenDept,
      designation: 'Associate Professor & Event Coordinator',
      email: `${chosenName.toLowerCase().replace(/[^a-z]/g, '.')}@college.edu`,
      phone: '+91 98' + Math.floor(10000000 + Math.random() * 90000000),
      signature_url: DEFAULT_COORDINATOR_SIGNATURE,
      is_coordinator: 1
    });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await addFacultyMember(formData);
      setShowAddModal(false);
      setFormData({
        employee_id: '',
        name: '',
        department: 'Computer Science & Engineering',
        designation: 'Associate Professor & Event Coordinator',
        email: '',
        phone: '',
        signature_url: DEFAULT_COORDINATOR_SIGNATURE,
        is_coordinator: 1
      });
      setFeedback({ type: 'success', text: `Faculty member ${formData.name} added to database successfully!` });
      setTimeout(() => setFeedback(null), 3000);
      loadFaculty();
    } catch (err) {
      alert('Failed to add faculty: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove faculty member ${name || 'selected'} from database?`)) return;
    try {
      await deleteFacultyMember(id);
      setFeedback({ type: 'success', text: 'Faculty member removed from database.' });
      setTimeout(() => setFeedback(null), 3000);
      loadFaculty();
    } catch (err) {
      alert('Failed to delete faculty member: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} selected faculty members?`)) return;
    try {
      await batchDeleteFaculty(selectedIds);
      setFeedback({ type: 'success', text: `Successfully removed ${selectedIds.length} faculty members.` });
      setTimeout(() => setFeedback(null), 3000);
      loadFaculty();
    } catch (err) {
      alert('Failed to delete selected faculty: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Are you sure you want to delete ALL faculty members? This action cannot be undone.')) return;
    try {
      await deleteAllFacultyMembers();
      setFeedback({ type: 'success', text: 'All faculty members removed from database.' });
      setTimeout(() => setFeedback(null), 3000);
      loadFaculty();
    } catch (err) {
      alert('Failed to delete all faculty members: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSignatureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const res = await uploadFile(file, 'signature');
      setFormData(prev => ({ ...prev, signature_url: res.data.url }));
    } catch (err) {
      const local = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, signature_url: local }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Faculty & Coordinator Management</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
              {facultyList.length} Authorized Signatories
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage faculty profiles, employee IDs, department chairs, and coordinator authorization for issuing validated certificates.
          </p>
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
            onClick={handleDeleteAll}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-300 font-bold text-xs transition"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Faculty Member</span>
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

      {/* Faculty Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {facultyList.length > 0 ? (
          facultyList.map((f) => {
            const isSelected = selectedIds.includes(f.id);
            return (
              <div
                key={f.id}
                className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition space-y-4 relative ${
                  isSelected ? 'border-amber-400 bg-amber-50/20 ring-2 ring-amber-300' : 'border-slate-200/80'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(f.id)}
                      className="w-4 h-4 mt-1 rounded text-amber-500 focus:ring-amber-400"
                    />
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {f.employee_id}
                      </span>
                      <h3 className="font-bold text-base text-slate-900 mt-1">{f.name}</h3>
                      <p className="text-xs text-amber-700 font-semibold">{f.designation}</p>
                    </div>
                  </div>

                  {f.is_coordinator === 1 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      <ShieldCheck className="w-3 h-3" /> Coordinator
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>{f.department}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono text-[11px] truncate">{f.email}</span>
                  </div>
                  {f.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{f.phone}</span>
                    </div>
                  )}
                </div>

                {/* Signature Preview */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Digital Signature</span>
                    <div className="h-8 max-w-[120px] flex items-center mt-0.5">
                      <img
                        src={f.signature_url || DEFAULT_COORDINATOR_SIGNATURE}
                        alt="Signature"
                        className="max-h-7 object-contain"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(f.id, f.name)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition"
                    title="Remove faculty member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            No faculty members found. Click "Add Faculty Member" or seed sample data in Database Hub.
          </div>
        )}
      </div>

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Add Faculty / Signatory</h3>
              <button
                type="button"
                onClick={handleQuickFillSample}
                className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Quick Fill Sample</span>
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Employee ID *</label>
                <input
                  type="text"
                  required
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  className="w-full text-xs font-mono uppercase px-3 py-2 border border-slate-300 rounded-xl mt-1 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="e.g. FAC-CSE-108"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl mt-1 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="e.g. Dr. Ramesh Chander"
                />
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
                <label className="text-xs font-semibold text-slate-700">Designation / Role *</label>
                <input
                  type="text"
                  required
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Digital Signature</label>
                <div className="flex gap-2 items-center">
                  <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-300 hover:border-slate-400 rounded-xl text-xs font-semibold cursor-pointer bg-slate-50 hover:bg-slate-100 transition shadow-xs">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSignatureUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowDrawModal(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-amber-300 hover:border-amber-400 rounded-xl text-xs font-semibold cursor-pointer bg-amber-50 hover:bg-amber-100 text-amber-900 transition shadow-xs"
                  >
                    <PenTool className="w-3.5 h-3.5 text-amber-600" />
                    <span>Draw Signature</span>
                  </button>
                </div>
                {formData.signature_url && (
                  <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src={formData.signature_url} alt="Current Signature" className="h-8 max-w-[120px] object-contain bg-white rounded p-1 border border-slate-200" />
                      <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Signature attached
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, signature_url: DEFAULT_COORDINATOR_SIGNATURE }))}
                      className="text-[11px] text-slate-400 hover:text-red-500"
                    >
                      Reset
                    </button>
                  </div>
                )}
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
                  Save Faculty to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SignaturePadModal
        isOpen={showDrawModal}
        onClose={() => setShowDrawModal(false)}
        onSave={(url) => setFormData(prev => ({ ...prev, signature_url: url }))}
        title="Draw Faculty Signature"
        signerName={formData.name || "Faculty Member"}
      />
    </div>
  );
}
