"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import ContextGate from "@/components/layout/ContextGate";
import Navbar from "@/components/layout/navbar/navbar";
import Sidebar from "@/components/layout/sidebar/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { isPublicRoute } from "@/lib/access";

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
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
      <div className="flex">
        {!hideLayout && (
          <div className="hidden xl:block">
            <Sidebar />
          </div>
        )}

        <div className="flex-1">{children}</div>
      </div>
      <ContextGate />
    </>
  );
}
