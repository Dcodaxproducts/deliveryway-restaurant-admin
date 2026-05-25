"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function PromotionManagementLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const { isBranchAdmin, loading } = useAuth();

  useEffect(() => {
    if (!loading && isBranchAdmin) {
      router.replace("/branch-workspace");
    }
  }, [loading, isBranchAdmin, router]);

  if (loading || isBranchAdmin) return null;

  return <>{children}</>;
}
