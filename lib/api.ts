import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

let isRefreshing = false;
type QueueItem = {
  resolve: () => void;
  reject: (err: unknown) => void;
};

let failedQueue: QueueItem[] = [];

const processQueue = (error: unknown | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;

    if (!originalRequest || status !== 401) {
      return Promise.reject(error);
    }

    const url = originalRequest.url ?? '';
    if (url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/logout')) {
      return Promise.reject(error);
    }

    if (!originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<void>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        processQueue(null);
        return api(originalRequest);
      } catch (err) {
        processQueue(err);
        // Force logout if refresh fails
        if (typeof window !== 'undefined') {
           window.dispatchEvent(new Event('force_logout'));
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
