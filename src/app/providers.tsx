"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { AuthProvider } from "@/components/providers/auth-provider";
import { BrandingProvider } from "@/components/providers/branding-provider";
import { I18nProvider } from "@/components/providers/i18n-provider";
import QueryProvider from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { useGlobalSettingsCurrency } from "@/hooks/useCurrency";

type ProvidersProps = {
  children: ReactNode;
};

function GlobalCurrencyHydrator() {
  useGlobalSettingsCurrency();

  return null;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <I18nProvider>
          <AuthProvider>
            <GlobalCurrencyHydrator />
            <BrandingProvider>
              <AppShell>{children}</AppShell>
            </BrandingProvider>
          </AuthProvider>
        </I18nProvider>
        <Toaster position="top-right" richColors />
      </ThemeProvider>
    </QueryProvider>
  );
}
