import { httpClient } from "@/lib/axios";
import { normalizeCurrency, setGlobalDefaultCurrency } from "@/lib/currency";

export type AdminGlobalSettings = {
  defaultCurrency?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

export const normalizeAdminGlobalSettings = (
  response: unknown
): AdminGlobalSettings => {
  const envelope = isRecord(response) ? response : {};
  const data = isRecord(envelope.data) ? envelope.data : envelope;
  const defaultCurrency =
    typeof data.defaultCurrency === "string"
      ? normalizeCurrency(data.defaultCurrency)
      : undefined;

  setGlobalDefaultCurrency(defaultCurrency);

  return { defaultCurrency };
};

export const getAdminGlobalSettings = async () => {
  const response = await httpClient.get<unknown>("/admin/global-settings");

  return normalizeAdminGlobalSettings(response);
};
