"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  httpClient,
  normalizeEndpoint,
  type HttpMethod,
  type RequestOptions,
} from "@/lib/axios";
import { toApiError } from "@/lib/errors";

export const useHttpClient = (_token?: string | null) => {
  const [loading, setLoading] = useState(false);

  const request = useCallback(
    async <TResponse = any, TBody = any>(
      endpoint: string,
      method: HttpMethod = "GET",
      body?: TBody,
      options?: RequestOptions
    ): Promise<TResponse | { error: string } | null> => {
      try {
        setLoading(true);

        return await httpClient.request<TResponse, TBody>(
          method,
          normalizeEndpoint(endpoint),
          body,
          options
        );
      } catch (error) {
        const apiError = toApiError(error);
        toast.error(apiError.message);
        return { error: apiError.message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return useMemo(
    () => ({
      loading,
      request,
      get: <TResponse = any>(endpoint: string, options?: RequestOptions) =>
        request<TResponse>(endpoint, "GET", undefined, options),
      post: <TResponse = any, TBody = any>(endpoint: string, body?: TBody, options?: RequestOptions) =>
        request<TResponse, TBody>(endpoint, "POST", body, options),
      patch: <TResponse = any, TBody = any>(endpoint: string, body?: TBody, options?: RequestOptions) =>
        request<TResponse, TBody>(endpoint, "PATCH", body, options),
      put: <TResponse = any, TBody = any>(endpoint: string, body?: TBody, options?: RequestOptions) =>
        request<TResponse, TBody>(endpoint, "PUT", body, options),
      del: <TResponse = any>(endpoint: string, options?: RequestOptions) =>
        request<TResponse>(endpoint, "DELETE", undefined, options),
    }),
    [loading, request]
  );
};
