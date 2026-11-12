import axios from 'axios';
import { extractSubdomain } from './subdomain';

const configuredApiUrl = (process.env.NEXT_PUBLIC_API_URL || '/api/v1').replace(/\/$/, '');
// Orus exposes its canonical API below /api/v1. Normalize the older /api
// deployment value so newer platform routes (including Audit Trail) resolve.
const apiBaseUrl = configuredApiUrl.endsWith('/api') ? `${configuredApiUrl}/v1` : configuredApiUrl;

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

let accessToken: string | null = null;
if (typeof window !== 'undefined') {
  try {
    accessToken = localStorage.getItem('token');
  } catch {
    accessToken = null;
  }
}

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (typeof window !== 'undefined') {
    try {
      if (token) {
        localStorage.setItem('token', token);
      } else {
        localStorage.removeItem('token');
      }
    } catch {
      // Ignore storage errors in private/incognito mode
    }
  }
};

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const subdomain = extractSubdomain();
    if (subdomain) {
      config.headers['x-tenant-slug'] = subdomain;
    }
  }
  const token = accessToken || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const requestUrl = String(err.config?.url || '');
    const isAuthRequest = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/check-slug', '/auth/workspace']
      .some((path) => requestUrl.includes(path));
    if (err.response?.status === 401 && !isAuthRequest) {
      const sentToken = Boolean(err.config?.headers?.Authorization);
      if (sentToken && !err.config?._retried) {
        err.config._retried = true;
        try {
          const refreshed = await api.post('/auth/refresh');
          const newToken = refreshed.data?.data?.accessToken || refreshed.data?.data?.token;
          if (newToken) {
            setAccessToken(newToken);
            err.config.headers.Authorization = `Bearer ${newToken}`;
            return api.request(err.config);
          }
        } catch {
          // Token refresh failed
        }
      }

      // If token wasn't provided or refresh failed: wipe storage and immediately navigate to /login
      setAccessToken(null);
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        } catch {}
        if (!window.location.pathname.startsWith('/login')) {
          window.location.assign('/login');
        }
      }
    }
    return Promise.reject(err);
  }
);

export default api;
