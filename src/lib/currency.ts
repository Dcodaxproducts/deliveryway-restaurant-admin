export const FALLBACK_CURRENCY = "PKR";

const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;
let globalDefaultCurrency: string | undefined;

export const normalizeCurrency = (value?: string | null) => {
  const currency = value?.trim().toUpperCase();

  return currency && CURRENCY_CODE_PATTERN.test(currency) ? currency : undefined;
};

export const setGlobalDefaultCurrency = (value?: string | null) => {
  globalDefaultCurrency = normalizeCurrency(value);

  return globalDefaultCurrency;
};

export const getGlobalDefaultCurrency = () => globalDefaultCurrency;

export const resolveCurrency = (
  ...candidates: Array<string | null | undefined>
) => {
  return (
    getGlobalDefaultCurrency() ??
    candidates.map(normalizeCurrency).find(Boolean) ??
    FALLBACK_CURRENCY
  );
};

export const formatMoney = (
  amount?: number | string | null,
  currency?: string | null,
  options?: Intl.NumberFormatOptions
) => {
  const numericAmount = Number(amount ?? 0);
  const value = Number.isFinite(numericAmount) ? numericAmount : 0;
  const resolvedCurrency = resolveCurrency(currency);

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: resolvedCurrency,
      maximumFractionDigits: 2,
      ...options,
    }).format(value);
  } catch {
    return `${resolvedCurrency} ${value.toFixed(2)}`;
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const getCurrencyFromRecord = (
  source: Record<string, unknown> | undefined,
  key: string
) => {
  const value = source?.[key];

  return typeof value === "string" ? normalizeCurrency(value) : undefined;
};

export const getRestaurantSettingsCurrency = (settings?: unknown) => {
  if (!isRecord(settings)) return undefined;

  return (
    getCurrencyFromRecord(settings, "currency") ??
    getCurrencyFromRecord(isRecord(settings.payments) ? settings.payments : undefined, "currency") ??
    getCurrencyFromRecord(isRecord(settings.invoice) ? settings.invoice : undefined, "currency") ??
    getCurrencyFromRecord(isRecord(settings.billing) ? settings.billing : undefined, "currency")
  );
};
