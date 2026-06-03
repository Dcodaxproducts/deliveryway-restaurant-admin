"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  NextIntlClientProvider,
  type AbstractIntlMessages,
} from "next-intl";

import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  normalizeLocale,
  type AppLocale,
} from "@/config/i18n";
import deMessages from "@/messages/de.json";
import enMessages from "@/messages/en.json";

const messagesByLocale: Record<AppLocale, AbstractIntlMessages> = {
  en: enMessages,
  de: deMessages,
};

export type I18nContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  isLocaleReady: boolean;
};

export const I18nContext = createContext<I18nContextValue | null>(null);

type I18nProviderProps = {
  children: ReactNode;
};

const getCookieLocale = () => {
  const localeCookie = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${LOCALE_STORAGE_KEY}=`));

  if (!localeCookie) return null;

  return decodeURIComponent(localeCookie.split("=")[1] ?? "");
};

const persistLocale = (locale: AppLocale) => {
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  document.cookie = `${LOCALE_STORAGE_KEY}=${encodeURIComponent(
    locale
  )}; path=/; max-age=31536000; SameSite=Lax`;
};

export function I18nProvider({ children }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<AppLocale>(DEFAULT_LOCALE);
  const [isLocaleReady, setIsLocaleReady] = useState(false);

  useEffect(() => {
    const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    const nextLocale = normalizeLocale(storedLocale || getCookieLocale());

    setLocaleState(nextLocale);
    persistLocale(nextLocale);
    setIsLocaleReady(true);
  }, []);

  const setLocale = useCallback((nextLocale: AppLocale) => {
    const normalizedLocale = normalizeLocale(nextLocale);

    setLocaleState(normalizedLocale);
    persistLocale(normalizedLocale);
  }, []);

  const contextValue = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      isLocaleReady,
    }),
    [locale, setLocale, isLocaleReady]
  );

  return (
    <I18nContext.Provider value={contextValue}>
      <NextIntlClientProvider
        locale={locale}
        messages={messagesByLocale[locale]}
      >
        {children}
      </NextIntlClientProvider>
    </I18nContext.Provider>
  );
}
