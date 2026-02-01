import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // Add auth token if available
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

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized access
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Media API
export const mediaAPI = {
    getAll: () => api.get('/media'),
    getById: (id) => api.get(`/media/${id}`),
    upload: (formData) => api.post('/media/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    }),
    delete: (id) => api.delete(`/media/${id}`),
    stream: (id) => `${API_BASE_URL}/media/${id}/stream`,
};

// Playlist API
export const playlistAPI = {
    getAll: () => api.get('/playlists'),
    getById: (id) => api.get(`/playlists/${id}`),
    create: (data) => api.post('/playlists', data),
    update: (id, data) => api.put(`/playlists/${id}`, data),
    delete: (id) => api.delete(`/playlists/${id}`),
};

// Download API
export const downloadAPI = {
    initiate: (data) => api.post('/downloads', data),
    getStatus: (id) => api.get(`/downloads/${id}`),
    pause: (id) => api.post(`/downloads/${id}/pause`),
    resume: (id) => api.post(`/downloads/${id}/resume`),
    cancel: (id) => api.delete(`/downloads/${id}`),
    remove: (id) => api.delete(`/downloads/${id}`),
    getAll: () => api.get('/downloads'),
};

// Subtitle API
export const subtitleAPI = {
    extract: (videoId) => api.post('/subtitles/extract', { videoId }),
    translate: (subtitleId, targetLang) => api.post('/subtitles/translate', { subtitleId, targetLang }),
    get: (id) => api.get(`/subtitles/${id}`),
};

export default api;
