import axios from 'axios';

// Production: Use REACT_APP_API_BASE_URL (e.g., https://your-backend.herokuapp.com/api)
// Development: Falls back to '/api' which works with Create React App's proxy (package.json)
// Required for production: Set REACT_APP_API_BASE_URL environment variable
const API_URL = process.env.REACT_APP_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
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
// Note: baseURL already includes '/api', so use '/auth' (not '/api/auth')
export const authAPI = {
  register: (username, email, password) =>
    api.post('/auth/register', { username, email, password }),
  login: (username, password) =>
    api.post('/auth/login', { username, password }),
  verify: () => api.get('/auth/verify'),
};

// Diary API
// Note: baseURL already includes '/api', so use '/diary' (not '/api/diary')
// Backend routes are mounted at /api/diary, so this results in /api/diary
export const diaryAPI = {
  getEntries: (params) => api.get('/diary', { params }),
  getEntry: (id) => api.get(`/diary/${id}`),
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
    return api.post('/diary', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
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
    return api.put(`/diary/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteEntry: (id) => api.delete(`/diary/${id}`),
  deleteAttachment: (entryId, attachmentId) =>
    api.delete(`/diary/${entryId}/attachments/${attachmentId}`),
};

// Tasks API
export const tasksAPI = {
  getTasks: (params) => api.get('/tasks', { params }),
  getTask: (id) => api.get(`/tasks/${id}`),
  createTask: (data) => api.post('/tasks', data),
  updateTask: (id, data) => api.put(`/tasks/${id}`, data),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  toggleTask: (id) => api.patch(`/tasks/${id}/toggle`),
};

export default api;

