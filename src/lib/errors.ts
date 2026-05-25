import type { AxiosError } from "axios";
import type { ApiEnvelope } from "./response";

export class ApiError extends Error {
  status?: number;
  code?: string;
  details?: unknown;

  constructor(message: string, options?: { status?: number; code?: string; details?: unknown }) {
    super(message);
    this.name = "ApiError";
    this.status = options?.status;
    this.code = options?.code;
    this.details = options?.details;
  }
}

export const getApiErrorMessage = (error: unknown, fallback = "Something went wrong") => {
  const axiosError = error as AxiosError<ApiEnvelope>;
  const response = axiosError?.response;

  return (
    response?.data?.error?.message ||
    response?.data?.message ||
    (error instanceof Error ? error.message : undefined) ||
    fallback
  );
};

export const toApiError = (error: unknown, fallback?: string) => {
  const axiosError = error as AxiosError<ApiEnvelope>;
  const response = axiosError?.response;

  return new ApiError(getApiErrorMessage(error, fallback), {
    status: response?.status,
    code: response?.data?.error?.code,
    details: response?.data?.error?.details,
  });
};
