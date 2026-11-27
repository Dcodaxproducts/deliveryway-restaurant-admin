import type { AxiosError } from "axios";
import type { ApiEnvelope } from "./response";
import { getLocalizedMessage } from "./localized-message";

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

/**
 * Returns only caller-owned, localized copy for user-facing errors.
 * Backend and DTO messages are intentionally not rendered because they may be
 * untranslated, overly technical, or unsafe to expose. Codes and details stay
 * available on ApiError for programmatic handling.
 */
export const getApiErrorMessage = (_error: unknown, fallback?: string) =>
  fallback ?? getLocalizedMessage("message364");

export const toApiError = (error: unknown, fallback?: string) => {
  const axiosError = error as AxiosError<ApiEnvelope>;
  const response = axiosError?.response;

  return new ApiError(getApiErrorMessage(error, fallback), {
    status: response?.status,
    code: response?.data?.error?.code,
    details: response?.data?.error?.details,
  });
};
