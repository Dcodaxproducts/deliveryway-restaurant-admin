import type { AxiosError } from "axios";

const BASE_BACKOFF_MS = 15_000;
const MAX_BACKOFF_MS = 5 * 60_000;

const parseRetryAfterMs = (value: unknown, now: number) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, value * 1000);
  }
  if (typeof value !== "string" || !value.trim()) return null;

  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);

  const retryDate = Date.parse(value);
  return Number.isNaN(retryDate) ? null : Math.max(0, retryDate - now);
};

export const getPendingOrderRetryDelayMs = (
  error: unknown,
  failureCount: number,
  now = Date.now(),
) => {
  const axiosError = error as AxiosError;
  const retryAfter = parseRetryAfterMs(
    axiosError.response?.headers?.["retry-after"],
    now,
  );
  if (retryAfter !== null) return Math.min(retryAfter, MAX_BACKOFF_MS);

  return Math.min(
    BASE_BACKOFF_MS * 2 ** Math.max(0, failureCount - 1),
    MAX_BACKOFF_MS,
  );
};

export const shouldRunPendingOrderRecovery = ({
  socketConnected,
  visibilityState,
}: {
  socketConnected: boolean;
  visibilityState: DocumentVisibilityState;
}) => !socketConnected && visibilityState === "visible";

export const createPendingOrderRecovery = <T>({
  request,
  onSuccess,
  isActive,
  now = () => Date.now(),
}: {
  request: () => Promise<T>;
  onSuccess: (value: T) => void;
  isActive: () => boolean;
  now?: () => number;
}) => {
  let inFlight: Promise<void> | null = null;
  let nextAllowedAt = 0;
  let failureCount = 0;

  return () => {
    if (!isActive() || now() < nextAllowedAt) return Promise.resolve(false);
    if (inFlight) return inFlight.then(() => true);

    inFlight = request()
      .then((value) => {
        failureCount = 0;
        nextAllowedAt = 0;
        if (isActive()) onSuccess(value);
      })
      .catch((error: unknown) => {
        failureCount += 1;
        nextAllowedAt = now() + getPendingOrderRetryDelayMs(error, failureCount, now());
      })
      .finally(() => {
        inFlight = null;
      });

    return inFlight.then(() => true);
  };
};
