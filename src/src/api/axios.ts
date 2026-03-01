import axios, { InternalAxiosRequestConfig, AxiosError } from 'axios';

// Safely access environment variable with fallback
// console.log('ENV = ', import.meta.env);
// console.log('API URL =', import.meta.env.VITE_API_URL);
// const API_BASE_URL = import.meta?.env?.VITE_API_URL || 'https://kangaroo-rooms-backend.onrender.com/api';

const getBaseURL = () =>
import.meta?.env?.VITE_API_URL ||
'http://localhost:3001/api';

const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - attach JWT token
axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('kangaroo_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// ─── Response interceptor — ONLY logout on 401 ──────────────────────
// 401 = token invalid/expired → clear auth, redirect to login
// 403 = authenticated but unauthorized (role mismatch) → DO NOT logout
// 500, network errors, timeouts → pass through without destroying session
//
// Uses lazy import of Redux store to dispatch forceLogout action
// instead of hard window.location.href redirect (preserves React state).
axiosInstance.interceptors.response.use((response) => response, async (error: AxiosError) => {
  const status = error.response?.status;

  // Only clear auth on 401 (authentication failure)
  // 403 means "you're logged in but not allowed" — do NOT destroy session
  if (status === 401) {
    // Skip if already on auth pages (prevents redirect loop)
    if (!window.location.pathname.includes('/auth/')) {
      try {
        // Lazy import to avoid circular dependency
        const {
          store
        } = await import('../store/store');
        const {
          forceLogout
        } = await import('../store/slices/auth.slice');
        store.dispatch(forceLogout());

        // Use React-friendly navigation after Redux state is cleared
        window.location.href = '/auth/login';
      } catch {
        // Fallback: direct localStorage clear if store import fails
        localStorage.removeItem('kangaroo_token');
        localStorage.removeItem('kangaroo_user');
        window.location.href = '/auth/login';
      }
    }
  }

  // 403, 500, network errors, timeouts → pass through without destroying session
  return Promise.reject(error);
});
export default axiosInstance;