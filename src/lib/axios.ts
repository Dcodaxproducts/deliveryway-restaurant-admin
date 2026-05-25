import axios, { type AxiosRequestConfig, type Method } from "axios";
import { baseURL } from "@/lib/constants";
import { buildLoginRoute } from "@/lib/auth-routes";
import {
  clearStoredAuth,
  getStoredAuth,
  normalizeAuthPayload,
  saveStoredAuth,
} from "@/lib/auth";
import { cleanParams, type QueryParams } from "./params";

export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
export type RequestOptions = Omit<AxiosRequestConfig, "url" | "method" | "data" | "params"> & {
  params?: QueryParams;
};

let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async () => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const stored = getStoredAuth();
    const refreshToken = stored?.refreshToken;

    if (!refreshToken) return null;

    try {
      const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
      const merged = normalizeAuthPayload(data, stored);
      saveStoredAuth(merged);

      return merged.accessToken || null;
    } catch {
      clearStoredAuth();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const stored = getStoredAuth();
  const accessToken = stored?.accessToken;

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 403) {
      error.message = error.response?.data?.message || "Not allowed for this branch/account";
    }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const accessToken = await refreshAccessToken();

      if (accessToken) {
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      }

      if (typeof window !== "undefined") {
        const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        window.location.href = buildLoginRoute(currentPath);
      }
    }

    return Promise.reject(error);
  }
);

export const httpClient = {
  request: async <TResponse = any, TBody = any>(
    method: Method,
    endpoint: string,
    body?: TBody,
    options?: RequestOptions
  ): Promise<TResponse> => {
    const { data } = await api.request<TResponse>({
      ...options,
      url: endpoint,
      method,
      data: body,
      params: cleanParams(options?.params),
    });

    return data;
  },
  get: <TResponse = any>(endpoint: string, options?: RequestOptions) =>
    httpClient.request<TResponse>("GET", endpoint, undefined, options),
  post: <TResponse = any, TBody = any>(endpoint: string, body?: TBody, options?: RequestOptions) =>
    httpClient.request<TResponse, TBody>("POST", endpoint, body, options),
  patch: <TResponse = any, TBody = any>(endpoint: string, body?: TBody, options?: RequestOptions) =>
    httpClient.request<TResponse, TBody>("PATCH", endpoint, body, options),
  put: <TResponse = any, TBody = any>(endpoint: string, body?: TBody, options?: RequestOptions) =>
    httpClient.request<TResponse, TBody>("PUT", endpoint, body, options),
  delete: <TResponse = any>(endpoint: string, options?: RequestOptions) =>
    httpClient.request<TResponse>("DELETE", endpoint, undefined, options),
};

export const normalizeEndpoint = (endpoint: string) => endpoint.replace(/^\/v1/, "");

export default api;
