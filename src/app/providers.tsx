"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";

import AppShell from "@/components/layout/AppShell";
import QueryProvider from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";

type ProvidersProps = {
  children: ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
        <Toaster position="top-right" richColors />
      </ThemeProvider>
    </QueryProvider>
  );
}
