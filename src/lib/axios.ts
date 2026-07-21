import axios, { AxiosHeaders, type AxiosRequestConfig, type Method } from "axios";
import { getRequestLocale } from "@/config/i18n";
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

const authenticationEndpoints = [
  "/auth/login",
  "/auth/staff/login",
  "/auth/google-login",
] as const;

export const isAuthenticationRequest = (requestUrl: string): boolean => {
  const requestPath = requestUrl.split("?", 1)[0];

  return authenticationEndpoints.some(
    (endpoint) => requestPath === endpoint || requestPath.endsWith(endpoint),
  );
};

const refreshAccessToken = async () => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const stored = getStoredAuth();
    const refreshToken = stored?.refreshToken;

    if (!refreshToken) return null;

    try {
      const { data } = await axios.post(
        `${baseURL}/auth/refresh`,
        { refreshToken },
        { headers: { "Accept-Language": getRequestLocale() } },
      );
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
  const headers = AxiosHeaders.from(config.headers);

  headers.set("Accept-Language", getRequestLocale());

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  config.headers = headers;

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = String(originalRequest?.url || "");
    const isLoginRequest = isAuthenticationRequest(requestUrl);

    if (error.response?.status === 403) {
      error.message = error.response?.data?.message || "Not allowed for this branch/account";
    }

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isLoginRequest
    ) {
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
  request: async <TResponse = unknown, TBody = unknown>(
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
  get: <TResponse = unknown>(endpoint: string, options?: RequestOptions) =>
    httpClient.request<TResponse>("GET", endpoint, undefined, options),
  post: <TResponse = unknown, TBody = unknown>(
    endpoint: string,
    body?: TBody,
    options?: RequestOptions
  ) => httpClient.request<TResponse, TBody>("POST", endpoint, body, options),
  patch: <TResponse = unknown, TBody = unknown>(
    endpoint: string,
    body?: TBody,
    options?: RequestOptions
  ) => httpClient.request<TResponse, TBody>("PATCH", endpoint, body, options),
  put: <TResponse = unknown, TBody = unknown>(
    endpoint: string,
    body?: TBody,
    options?: RequestOptions
  ) => httpClient.request<TResponse, TBody>("PUT", endpoint, body, options),
  delete: <TResponse = unknown>(endpoint: string, options?: RequestOptions) =>
    httpClient.request<TResponse>("DELETE", endpoint, undefined, options),
};

export const normalizeEndpoint = (endpoint: string) => endpoint.replace(/^\/v1/, "");
