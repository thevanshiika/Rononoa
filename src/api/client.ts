import axios from 'axios';

// Support configurable backend API URL for local dev, separate client/server setups, and Vercel deployments
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

export const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pm_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to catch unauthorized states
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if expired or invalid
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('pm_token');
        localStorage.removeItem('pm_user');
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);
