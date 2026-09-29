"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import ContextGate from "@/components/layout/ContextGate";
import { Navbar } from "@/components/layout/navbar/navbar";
import { PosPrinterNavbar } from "@/components/layout/navbar/PosPrinterNavbar";
import { Sidebar } from "@/components/layout/sidebar/Sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { isPublicRoute } from "@/lib/access";
import { isPosPrinterRouteAllowed } from "@/lib/auth";

type AppShellProps = {
  children: ReactNode;
};

const DETAIL_ROUTE_PATTERN =
  /\/(?:add|create|edit|settings|profile)(?:\/|$)|\/(?:branches|orders|customers|deliverymen)\/[^/]+$/;

export function WorkspaceLoadingContent({ pathname }: { pathname: string }) {
  const isDashboard = pathname === "/";
  const isDetail = DETAIL_ROUTE_PATTERN.test(pathname);

  return (
    <main
      data-slot="workspace-loading-content"
      data-layout={isDashboard ? "dashboard" : isDetail ? "detail" : "list"}
      className="mx-auto w-full max-w-[var(--ui-content-admin)] space-y-6 p-[var(--ui-page-gutter)] lg:py-6"
    >
      <div className="space-y-2">
        <Skeleton className="h-7 w-56 max-w-[70vw]" />
        <Skeleton className="h-4 w-[32rem] max-w-full" />
      </div>

      {isDashboard ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 lg:gap-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-[88px] rounded-[var(--ui-radius-card)]"
              />
            ))}
          </div>
          <section className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-6 w-52" />
              <Skeleton className="h-4 w-72 max-w-full" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="space-y-3 rounded-[var(--ui-radius-card)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-5"
                >
                  <Skeleton className="h-5 w-44 max-w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="mt-4 h-9 w-32 rounded-[var(--ui-radius-control)]" />
                </div>
              ))}
            </div>
          </section>
        </>
      ) : isDetail ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-5 rounded-[var(--ui-radius-card)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-5">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-11 w-full rounded-[var(--ui-radius-control)]" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-11 rounded-[var(--ui-radius-control)]" />
              <Skeleton className="h-11 rounded-[var(--ui-radius-control)]" />
            </div>
            <Skeleton className="h-28 w-full rounded-[var(--ui-radius-control)]" />
          </div>
          <Skeleton className="h-64 rounded-[var(--ui-radius-card)]" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Skeleton className="h-10 min-w-0 flex-1 rounded-[var(--ui-radius-control)]" />
            <Skeleton className="h-10 w-full rounded-[var(--ui-radius-control)] sm:w-36" />
          </div>
          <div className="overflow-hidden rounded-[var(--ui-radius-card)] border border-[var(--ui-border)] bg-[var(--ui-surface)]">
            <Skeleton className="h-11 w-full rounded-none" />
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="grid min-h-16 grid-cols-[minmax(0,1fr)_6rem] items-center gap-4 border-t border-[var(--ui-border)] px-4"
              >
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48 max-w-[70%]" />
                  <Skeleton className="h-3 w-32 max-w-[55%]" />
                </div>
                <Skeleton className="ml-auto h-7 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const hideLayout = isPublicRoute(pathname);
  const { loading, user, token, isPosPrinter } = useAuth();

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
      <SidebarProvider
        role="status"
        aria-label="Loading workspace"
        className="bg-[var(--ui-canvas)]"
      >
        <aside
          data-slot="sidebar-loading-skeleton"
          className="hidden h-svh w-(--sidebar-width) shrink-0 border-r border-[var(--ui-border)] bg-[var(--ui-surface)] p-4 md:block"
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
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-[67px] shrink-0 items-center gap-4 border-b border-[var(--ui-border)] bg-[var(--ui-surface)] px-5">
            <Skeleton className="h-10 min-w-0 flex-1 rounded-[var(--ui-radius-control)] sm:max-w-lg" />
            <Skeleton className="hidden h-10 w-48 rounded-[var(--ui-radius-control)] md:block" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
          <WorkspaceLoadingContent pathname={pathname} />
        </div>
        <span className="sr-only">Loading workspace</span>
      </SidebarProvider>
    );
  }

  if (isPosPrinter && !isPosPrinterRouteAllowed(pathname)) {
    return (
      <div
        role="status"
        aria-label="Redirecting to POS printer orders"
        className="min-h-[100dvh] bg-[var(--ui-canvas)]"
      />
    );
  }

  if (isPosPrinter) {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-[var(--ui-canvas)]">
        <a
          href="#main-content"
          className="fixed left-4 top-4 z-[var(--ui-layer-toast)] -translate-y-24 rounded-[var(--ui-radius-control)] bg-primary px-4 py-2 text-sm font-medium text-white transition-transform focus:translate-y-0"
        >
          Skip to content
        </a>
        <div className="sticky top-0 z-[var(--ui-layer-dropdown)] bg-background">
          <PosPrinterNavbar />
        </div>
        <main id="main-content" tabIndex={-1} className="flex min-w-0 flex-1 flex-col">
          {children}
        </main>
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
