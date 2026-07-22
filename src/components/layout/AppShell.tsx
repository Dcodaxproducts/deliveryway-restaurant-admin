"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import ContextGate from "@/components/layout/ContextGate";
import { Navbar } from "@/components/layout/navbar/navbar";
import { Sidebar } from "@/components/layout/sidebar/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { isPublicRoute } from "@/lib/access";
import { cn } from "@/lib/utils";

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
      {!hideLayout && (
        <div className="fixed inset-x-0 top-0 z-40">
          <Navbar />
        </div>
      )}
      <div
        className={cn(
          "flex min-h-screen items-start",
          !hideLayout && "pt-[116px] md:pt-[76px]",
        )}
      >
        {!hideLayout && (
          <div className="hidden h-[calc(100vh-76px)] shrink-0 overflow-hidden xl:fixed xl:left-0 xl:top-[76px] xl:z-30 xl:flex">
            <Sidebar />
          </div>
        )}

        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col",
            !hideLayout && "xl:pl-72",
          )}
        >
          {children}
        </div>
      </div>
      <ContextGate />
    </>
  );
}
