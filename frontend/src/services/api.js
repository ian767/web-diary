import axios from 'axios';

// Production: REACT_APP_API_BASE_URL should be the backend domain only (e.g., https://your-backend.onrender.com)
// Development: Falls back to empty string (relative URLs work with Create React App's proxy)
// All API endpoints explicitly include '/api/' prefix
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
// All endpoints explicitly include '/api/' prefix
export const authAPI = {
  register: (username, email, password) =>
    api.post('/api/auth/register', { username, email, password }),
  login: (username, password) =>
    api.post('/api/auth/login', { username, password }),
  verify: () => api.get('/api/auth/verify'),
};

// Diary API
// All endpoints explicitly include '/api/' prefix to match backend routes mounted at /api/diary
export const diaryAPI = {
  getEntries: (params) => api.get('/api/diary', { params }),
  getEntry: (id) => api.get(`/api/diary/${id}`),
  createEntry: (data, files) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (key !== 'attachments') {
        formData.append(key, data[key]);
      }
    });
    if (data.stickers) {
      formData.append('stickers', JSON.stringify(data.stickers));
    }
    if (files && files.length > 0) {
      // Collect custom filenames
      const customFilenamesMap = {};
      files.forEach((fileItem) => {
        const file = fileItem.file || fileItem; // Support both formats
        const customName = fileItem.customName || file.name;
        formData.append('attachments', file);
        // Collect custom filename if different from original
        if (customName !== file.name) {
          customFilenamesMap[file.name] = customName;
        }
      });
      // Append all custom filenames as a single JSON object
      if (Object.keys(customFilenamesMap).length > 0) {
        formData.append('customFilenames', JSON.stringify(customFilenamesMap));
      }
    }
    // Don't set Content-Type header - axios will set it automatically with boundary for FormData
    return api.post('/api/diary', formData);
  },
  updateEntry: (id, data, files) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (key !== 'attachments' && key !== 'deletedAttachments' && key !== 'renamedAttachments') {
        formData.append(key, data[key]);
      }
    });
    if (data.deletedAttachments) {
      formData.append('deletedAttachments', JSON.stringify(data.deletedAttachments));
    }
    if (data.renamedAttachments) {
      formData.append('renamedAttachments', JSON.stringify(data.renamedAttachments));
    }
    if (files && files.length > 0) {
      // Collect custom filenames
      const customFilenamesMap = {};
      files.forEach((fileItem) => {
        const file = fileItem.file || fileItem; // Support both formats
        const customName = fileItem.customName || file.name;
        formData.append('attachments', file);
        // Collect custom filename if different from original
        if (customName !== file.name) {
          customFilenamesMap[file.name] = customName;
        }
      });
      // Append all custom filenames as a single JSON object
      if (Object.keys(customFilenamesMap).length > 0) {
        formData.append('customFilenames', JSON.stringify(customFilenamesMap));
      }
    }
    // Don't set Content-Type header - axios will set it automatically with boundary for FormData
    return api.put(`/api/diary/${id}`, formData);
  },
  deleteEntry: (id) => api.delete(`/api/diary/${id}`),
  deleteAttachment: (entryId, attachmentId) =>
    api.delete(`/api/diary/${entryId}/attachments/${attachmentId}`),
};

// Tasks API
// All endpoints explicitly include '/api/' prefix
export const tasksAPI = {
  getTasks: (params) => api.get('/api/tasks', { params }),
  getTask: (id) => api.get(`/api/tasks/${id}`),
  createTask: (data) => api.post('/api/tasks', data),
  updateTask: (id, data) => api.put(`/api/tasks/${id}`, data),
  deleteTask: (id) => api.delete(`/api/tasks/${id}`),
  toggleTask: (id) => api.patch(`/api/tasks/${id}/toggle`),
};

export default api;

