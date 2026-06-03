"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import ContextGate from "@/components/layout/ContextGate";
import { Navbar } from "@/components/layout/navbar/navbar";
import Sidebar from "@/components/layout/sidebar/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { isPublicRoute } from "@/lib/access";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const hideLayout = isPublicRoute(pathname);
  const { loading } = useAuth();

  if (loading && !hideLayout) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <>
      {!hideLayout && <Navbar />}
      <div className="flex min-h-[calc(100vh-80px)] items-stretch">
        {!hideLayout && (
          <div className="hidden shrink-0 xl:flex">
            <Sidebar />
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col self-stretch">
          {children}
        </div>
      </div>
      <ContextGate />
    </>
  );
}
