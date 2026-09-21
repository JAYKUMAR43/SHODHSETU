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
    const token = localStorage.getItem('shodhsetu_token');
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
        localStorage.removeItem('shodhsetu_token');
        localStorage.removeItem('shodhsetu_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
