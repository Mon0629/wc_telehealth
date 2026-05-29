import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";
import { refreshAccessToken, clearAuthSession } from "@/lib/auth-refresh";
import { getAccessToken } from "@/lib/auth-token";

const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (reason: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((pending) => {
    if (error) pending.reject(error);
    else pending.resolve(token!);
  });
  failedQueue = [];
}

function isPublicAuthRequest(url: string | undefined): boolean {
  if (!url) return false;
  return /\/auth\/(login|register|verify-email)(?:\?|$|\/)/.test(url);
}

function isRefreshRequest(url: string | undefined): boolean {
  if (!url) return false;
  return /\/auth\/refresh(?:\?|$|\/)/.test(url);
}

// Request interceptor — attaches the Bearer token stored in localStorage
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — refresh on 401, then retry the original request
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url;

    if (status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    if (isRefreshRequest(requestUrl)) {
      await clearAuthSession();
      return Promise.reject(error);
    }

    if (isPublicAuthRequest(requestUrl)) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      await clearAuthSession();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const accessToken = await refreshAccessToken();
      processQueue(null, accessToken);
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      await clearAuthSession();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
