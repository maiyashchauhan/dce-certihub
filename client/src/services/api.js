import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
});

// Interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cert_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to catch 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-clear for any authentication routes (login, reset-password, verify)
      const url = error.config?.url || '';
      if (!url.includes('/auth/')) {
        localStorage.removeItem('cert_token');
        localStorage.removeItem('cert_user');
        window.dispatchEvent(new Event('auth_expired'));
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const loginUser = (email, password) => api.post('/auth/login', { email, password });
export const registerUser = (userData) => api.post('/auth/register', userData);
export const verifyResetEmail = (email) => api.post('/auth/verify-reset-email', { email });
export const resetPassword = (data) => api.post('/auth/reset-password', data);
export const getMyProfile = () => api.get('/auth/me');
export const updateMyProfile = (data) => api.put('/auth/profile', data);

// Faculty
export const getFacultyList = () => api.get('/faculty');
export const addFacultyMember = (data) => api.post('/faculty', data);
export const updateFacultyMember = (id, data) => api.put(`/faculty/${id}`, data);
export const deleteFacultyMember = (id) => api.delete(`/faculty/${id}`);
export const batchDeleteFaculty = (ids) => api.post('/faculty/batch-delete', { ids });
export const deleteAllFacultyMembers = () => api.delete(`/faculty`);

// Students
export const getStudentsList = (params) => api.get('/students', { params });
export const addStudent = (data) => api.post('/students', data);
export const updateStudent = (id, data) => api.put(`/students/${id}`, data);
export const deleteStudent = (id) => api.delete(`/students/${id}`);
export const batchDeleteStudents = (ids) => api.post('/students/batch-delete', { ids });
export const deleteAllStudents = () => api.delete(`/students`);
export const importStudentsFile = (formData) => api.post('/students/import-file', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// Events & Participants
export const getEventsList = () => api.get('/events');
export const getEventDetails = (id) => api.get(`/events/${id}`);
export const createEvent = (data) => api.post('/events', data);
export const updateEvent = (id, data) => api.put(`/events/${id}`, data);
export const deleteEvent = (id) => api.delete(`/events/${id}`);
export const deleteAllEvents = () => api.delete(`/events`);
export const addEventParticipant = (eventId, data) => api.post(`/events/${eventId}/participants`, data);
export const updateParticipant = (participantId, data) => api.put(`/events/participants/${participantId}`, data);
export const deleteParticipant = (participantId) => api.delete(`/events/participants/${participantId}`);
export const batchDeleteParticipants = (ids) => api.post('/events/participants/batch-delete', { ids });
export const deleteAllEventParticipants = (eventId) => api.delete(`/events/${eventId}/participants`);
export const importEventParticipants = (eventId, formData) => api.post(`/events/${eventId}/import-participants`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// Certificates
export const getCertificatesList = (params) => api.get('/certificates', { params });
export const getCertificateById = (certId) => api.get(`/certificates/${certId}`);
export const generateSingleCertificate = (data) => api.post('/certificates/generate', data);
export const bulkGenerateForEvent = (data) => api.post('/certificates/bulk-generate-event', data);
export const bulkGenerateFromUpload = (formData) => api.post('/certificates/bulk-generate-upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const updateCertificateStatus = (certId, isValid) => api.patch(`/certificates/${certId}/status`, { is_valid: isValid });
export const deleteCertificate = (certId) => api.delete(`/certificates/${certId}`);
export const batchDeleteCertificates = (certIds) => api.post('/certificates/batch-delete', { certIds });
export const deleteAllCertificates = () => api.delete('/certificates');

// Public Verification
export const verifyCertificate = (certId) => api.get(`/verify/${certId}`);

// Student Self-Service Portal
export const getStudentCertificates = (rollNo, name) => {
  const params = name ? { name } : {};
  return api.get(`/student/certificates/${encodeURIComponent(rollNo)}`, { params });
};

// Dashboard Stats
export const getDashboardStats = () => api.get('/dashboard/stats');

// Database Management & Local Data Operations
export const getDataOverview = () => api.get('/data/overview');
export const exportDatabaseData = () => api.get('/data/export');
export const importDatabaseData = (data) => api.post('/data/import', data);
export const seedSampleData = () => api.post('/data/seed-sample');
export const clearDatabaseTables = (tables) => api.post('/data/clear', { tables });

// Upload File (Logo / Signature)
export const uploadFile = (file, type) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export default api;
