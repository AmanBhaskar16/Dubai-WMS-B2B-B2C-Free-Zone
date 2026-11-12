import toast from 'react-hot-toast';

/**
 * Extracts a clean, human-readable error message from an API error response,
 * Axios error, validation error array/dictionary, or generic exception.
 */
export function getApiErrorMessage(err: any, fallback = 'An unexpected error occurred. Please try again.'): string {
  if (!err) return fallback;

  if (typeof err === 'string') {
    return err.trim() || fallback;
  }

  const resData = err.response?.data;

  if (resData) {
    if (typeof resData === 'string') {
      // Avoid raw HTML dump if a 502/504 proxy page is returned
      if (resData.includes('<!DOCTYPE') || resData.includes('<html')) {
        return `Server returned status ${err.response?.status || 500}. Please try again later.`;
      }
      return resData.trim() || fallback;
    }

    if (typeof resData === 'object' && resData !== null) {
      // 1. Check for 'message' field
      if (typeof resData.message === 'string' && resData.message.trim()) {
        const msg = resData.message.trim();
        // If there are detailed sub-errors, append them if useful
        if (Array.isArray(resData.errors) && resData.errors.length > 0) {
          const details = resData.errors
            .map((e: any) => (typeof e === 'string' ? e : e?.message || e?.msg || JSON.stringify(e)))
            .filter(Boolean)
            .join('; ');
          if (details && !msg.includes(details)) {
            return `${msg}: ${details}`;
          }
        }
        return msg;
      }

      // 2. Check for 'error' field
      if (typeof resData.error === 'string' && resData.error.trim()) {
        return resData.error.trim();
      }

      // 3. Check for 'errors' field
      if (resData.errors) {
        if (Array.isArray(resData.errors) && resData.errors.length > 0) {
          const details = resData.errors
            .map((e: any) => (typeof e === 'string' ? e : e?.message || e?.msg || JSON.stringify(e)))
            .filter(Boolean)
            .join(', ');
          if (details) return details;
        }

        if (typeof resData.errors === 'string' && resData.errors.trim()) {
          return resData.errors.trim();
        }

        if (typeof resData.errors === 'object') {
          const messages = Object.entries(resData.errors)
            .map(([field, val]) => {
              if (Array.isArray(val)) {
                return `${field}: ${val.join(', ')}`;
              }
              if (typeof val === 'string') {
                return `${field}: ${val}`;
              }
              if (val && typeof val === 'object' && 'message' in (val as any)) {
                return `${field}: ${(val as any).message}`;
              }
              return null;
            })
            .filter(Boolean);

          if (messages.length > 0) {
            return messages.join(' | ');
          }
        }
      }
    }
  }

  // Network / timeout errors
  if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
    return 'Unable to connect to the server. Please check your internet connection or try again later.';
  }

  if (err.code === 'ECONNABORTED' || (err.message && err.message.toLowerCase().includes('timeout'))) {
    return 'The request timed out. Please try again.';
  }

  if (err.message && typeof err.message === 'string' && err.message.trim()) {
    return err.message.trim();
  }

  return fallback;
}

/**
 * Triggers a standardized toast error notification with the parsed error message.
 * Suppresses 401 unauthenticated toasts so the user experiences a clean redirect.
 * Returns the resolved message string.
 */
export function showApiError(err: any, fallback = 'Operation failed'): string {
  // If unauthorized (401), the interceptor/auth guard redirects to /login - suppress noisy toast
  if (err?.response?.status === 401) {
    return '';
  }
  // Make backend availability visible to users; failed mutations otherwise look like no-op clicks.
  if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
    const message = 'The API server is unavailable. Start the app backend and try again.';
    toast.error(message);
    return message;
  }
  const message = getApiErrorMessage(err, fallback);
  toast.error(message);
  return message;
}

/**
 * Triggers a standardized toast success notification.
 * Returns the message string.
 */
export function showApiSuccess(message: string): string {
  toast.success(message);
  return message;
}
