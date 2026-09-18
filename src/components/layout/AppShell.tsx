"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import ContextGate from "@/components/layout/ContextGate";
import { Navbar } from "@/components/layout/navbar/navbar";
import { Sidebar } from "@/components/layout/sidebar/Sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { isPublicRoute } from "@/lib/access";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const hideLayout = isPublicRoute(pathname);
  const { loading, user, token } = useAuth();

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
        <div className="flex h-[76px] items-center gap-4 border-b border-[var(--ui-border)] bg-[var(--ui-surface)] px-5 md:pl-[19rem]">
          <Skeleton className="h-10 min-w-0 flex-1 rounded-[var(--ui-radius-control)] sm:max-w-lg" />
          <Skeleton className="hidden h-10 w-48 rounded-[var(--ui-radius-control)] md:block" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        <div className="flex min-h-[calc(100dvh-76px)]">
          <aside
            data-slot="sidebar-loading-skeleton"
            className="hidden w-72 shrink-0 border-r border-[var(--ui-border)] bg-[var(--ui-surface)] p-4 md:block"
          >
            <div className="mb-8 flex items-center gap-3">
              <Skeleton className="size-10 rounded-[var(--ui-radius-control)]" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="mb-3 h-3 w-20" />
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="flex h-10 items-center gap-3 px-2">
                  <Skeleton className="size-5 rounded-md" />
                  <Skeleton
                    className={index % 3 === 0 ? "h-4 w-36" : "h-4 w-28"}
                  />
                </div>
              ))}
            </div>
          </aside>
          <div className="mx-auto w-full max-w-[var(--ui-content-admin)] space-y-6 p-[var(--ui-page-gutter)] lg:py-6">
            <Skeleton className="h-20 max-w-xl rounded-[var(--ui-radius-card)]" />
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton
                  key={index}
                  className="h-32 rounded-[var(--ui-radius-card)]"
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
      <SidebarProvider>
        <Sidebar />
        <SidebarInset id="main-content" tabIndex={-1} className="min-w-0">
          <div className="sticky top-0 z-[var(--ui-layer-dropdown)] bg-background">
            <Navbar />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">{children}</div>
          <ContextGate />
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
