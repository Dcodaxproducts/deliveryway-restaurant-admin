export type ApiMeta = {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
  [key: string]: unknown;
};

export type ApiEnvelope<T = unknown> = {
  success?: boolean;
  data?: T;
  message?: string;
  meta?: ApiMeta | null;
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};

export type ListEnvelope<T> = ApiEnvelope<T[]> & {
  data: T[];
  meta?: ApiMeta | null;
};

export const unwrapEnvelope = <T>(response: ApiEnvelope<T> | T): T => {
  if (
    response &&
    typeof response === "object" &&
    "data" in (response as Record<string, unknown>)
  ) {
    return (response as ApiEnvelope<T>).data as T;
  }

  return response as T;
};

export const getEnvelopeMessage = (response: unknown, fallback = "Request completed") => {
  if (!response || typeof response !== "object") return fallback;
  return String((response as ApiEnvelope).message || fallback);
};

export const extractResponseItems = <T>(
  response: unknown,
  entityKey?: string
): T[] => {
  const payload = response as Record<string, unknown> | null | undefined;
  const data = payload?.data as unknown;

  if (Array.isArray(data)) return data as T[];

  if (data && typeof data === "object") {
    const dataRecord = data as Record<string, unknown>;

    if (entityKey && Array.isArray(dataRecord[entityKey])) {
      return dataRecord[entityKey] as T[];
    }

    for (const value of Object.values(dataRecord)) {
      if (Array.isArray(value)) return value as T[];
    }
  }

  if (Array.isArray(payload)) return payload as T[];

  return [];
};

export const extractResponseMeta = (response: unknown): ApiMeta | null => {
  const payload = response as Record<string, unknown> | null | undefined;
  const data = payload?.data as Record<string, unknown> | undefined;

  return (
    (payload?.meta as ApiMeta | null | undefined) ||
    (data?.meta as ApiMeta | null | undefined) ||
    null
  );
};
