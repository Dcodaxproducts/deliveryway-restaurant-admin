"use client";

import { useState, type ReactNode } from "react";
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
  const { loading, user, token } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  if (hideLayout) {
    return (
      <>
        {children}
        <ContextGate />
      </>
    );
  }

  if (loading || !user || !token) {
    return (
      <div
        role="status"
        aria-label="Loading workspace"
        className="min-h-[100dvh] bg-[var(--ui-canvas)]"
      >
        <div className="h-[76px] animate-pulse border-b border-[var(--ui-border)] bg-[var(--ui-surface)]" />
        <div className="flex min-h-[calc(100dvh-76px)]">
          <div className="hidden w-72 animate-pulse border-r border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] xl:block" />
          <div className="mx-auto w-full max-w-[var(--ui-content-admin)] space-y-6 p-[var(--ui-page-gutter)] lg:py-6">
            <div className="h-20 max-w-xl animate-pulse rounded-[var(--ui-radius-card)] bg-neutral-200" />
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-32 animate-pulse rounded-[var(--ui-radius-card)] bg-neutral-200"
                />
              ))}
            </div>
          </div>
        </div>
        <span className="sr-only">Loading workspace</span>
      </div>
    );
  }

  return (
    <>
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[var(--ui-layer-toast)] -translate-y-24 rounded-[var(--ui-radius-control)] bg-primary px-4 py-2 text-sm font-medium text-white transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>
      <div className="fixed inset-x-0 top-0 z-[var(--ui-layer-dropdown)]">
        <Navbar />
      </div>
      <div
        className={cn(
          "flex min-h-screen items-start",
          "pt-[116px] md:pt-[76px]",
        )}
      >
        <div
          className={cn(
            "hidden h-[calc(100dvh-76px)] shrink-0 overflow-hidden transition-[width] duration-200 motion-reduce:transition-none xl:fixed xl:left-0 xl:top-[76px] xl:z-[var(--ui-layer-sticky)] xl:flex",
            isSidebarCollapsed ? "xl:w-20" : "xl:w-72",
          )}
        >
          <Sidebar
            collapsed={isSidebarCollapsed}
            onCollapsedChange={setIsSidebarCollapsed}
          />
        </div>

        <main
          id="main-content"
          tabIndex={-1}
          className={cn(
            "flex min-w-0 flex-1 flex-col",
            "transition-[padding] duration-200 motion-reduce:transition-none",
            isSidebarCollapsed ? "xl:pl-20" : "xl:pl-72",
          )}
        >
          {children}
        </main>
      </div>
      <ContextGate />
    </>
  );
}
