"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { AuthProvider, useAuthContext } from "@/components/providers/auth-provider";
import { BrandingProvider } from "@/components/providers/branding-provider";
import { I18nProvider } from "@/components/providers/i18n-provider";
import QueryProvider from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { useGlobalSettingsCurrency } from "@/hooks/useCurrency";
import { useRealtimeOrderNotifications } from "@/hooks/useRealtimeOrderNotifications";
import { isPosPrinterAccount } from "@/lib/auth";

type ProvidersProps = {
  children: ReactNode;
};

function GlobalAppHydrator() {
  const { user, loading } = useAuthContext();

  if (loading || isPosPrinterAccount(user)) return null;

  return <StandardAppHydrator />;
}

function StandardAppHydrator() {
  useGlobalSettingsCurrency();
  useRealtimeOrderNotifications();

  return null;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <I18nProvider>
          <AuthProvider>
            <GlobalAppHydrator />
            <BrandingProvider>
              <AppShell>{children}</AppShell>
            </BrandingProvider>
          </AuthProvider>
        </I18nProvider>
        <Toaster position="top-right" richColors closeButton />
      </ThemeProvider>
    </QueryProvider>
  );
}
