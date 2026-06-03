export const SUPPORTED_LOCALES = ["en", "de"] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "en";

export const LOCALE_STORAGE_KEY = "deliveryway-admin-locale";

export const LANGUAGE_LABELS: Record<AppLocale, string> = {
  en: "English",
  de: "Deutsch",
};

export const isAppLocale = (locale: string): locale is AppLocale => {
  return SUPPORTED_LOCALES.includes(locale as AppLocale);
};

export const normalizeLocale = (locale?: string | null): AppLocale => {
  if (!locale) return DEFAULT_LOCALE;
  return isAppLocale(locale) ? locale : DEFAULT_LOCALE;
};
