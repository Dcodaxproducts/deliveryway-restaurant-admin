"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function PromotionManagementLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isBranchAdmin, loading } = useAuth();
  const isGiftCardsRoute = pathname.startsWith("/promotion-management/gift-cards");

  useEffect(() => {
    if (!loading && isBranchAdmin && !isGiftCardsRoute) {
      router.replace("/branch-workspace");
    }
  }, [loading, isBranchAdmin, isGiftCardsRoute, router]);

  if (loading || (isBranchAdmin && !isGiftCardsRoute)) return null;

  return <>{children}</>;
}
