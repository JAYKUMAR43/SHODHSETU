import axios from 'axios';

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl.endsWith('/') ? `${envUrl}api/v1` : `${envUrl}/api/v1`;
  }
  return '/api/v1';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to inject JWT auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bharatpanchyt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept responses for auth expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired, clear and optionally redirect
      const isAuthEndpoint = error.config.url.includes('/auth/login');
      if (!isAuthEndpoint) {
        localStorage.removeItem('bharatpanchyt_token');
        localStorage.removeItem('bharatpanchyt_user');
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Normalizes any relative or absolute file URL.
 * If given a relative path like '/uploads/reports/...', resolves against VITE_API_URL
 * so frontend does not fail on Vercel ephemeral / 404 routes.
 */
export const getFileUrl = (path) => {
  if (!path) return '';
  if (
    path.startsWith('http://') || 
    path.startsWith('https://') || 
    path.startsWith('data:') || 
    path.startsWith('blob:')
  ) {
    return path;
  }
  const envUrl = import.meta.env.VITE_API_URL;
  let backendBase = '';
  if (envUrl) {
    backendBase = envUrl.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
  } else if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    backendBase = 'http://127.0.0.1:8000';
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${backendBase}${cleanPath}`;
};

export default api;
