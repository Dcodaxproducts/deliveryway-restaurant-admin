"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import Container from "@/components/container";
import Header from "@/components/header";
import CouponsPage from "@/components/PromotionManagement/CouponsPage/CouponsPage";
import PromotionsOverview from "@/components/PromotionManagement/PromotionOverview/PromotionsOverview";
import PromotionTabs from "@/components/PromotionManagement/PromotionTabs";
import PromotionsPage from "@/components/PromotionManagement/PromotionsPage/PromotionsPage";
import HappyHourPage from "@/components/PromotionManagement/HappyHourPage/HappyHourPage";
import { useAuth } from "@/hooks/useAuth";

type PromotionTabValue = "overview" | "coupons" | "promotions" | "happy-hours";

const PROMOTION_TABS: { label: string; value: PromotionTabValue }[] = [
  { label: "Overview", value: "overview" },
  { label: "Coupons", value: "coupons" },
  { label: "Promotions", value: "promotions" },
  { label: "Happy Hours", value: "happy-hours" },
];

const isPromotionTab = (value: string | null): value is PromotionTabValue => {
  return PROMOTION_TABS.some((tab) => tab.value === value);
};

const getTabFromParams = (params: URLSearchParams): PromotionTabValue => {
  const tab = params.get("tab");
  return isPromotionTab(tab) ? tab : "overview";
};

const scrollToPageTop = () => {
  if (typeof window === "undefined") return;

  window.requestAnimationFrame(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
};

const PromotionManagementPage = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isBranchAdmin, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && isBranchAdmin) {
      router.replace("/branch-workspace");
    }
  }, [authLoading, isBranchAdmin, router]);

  /**
   * URL is the persisted source, local state is only optimistic UI.
   * This avoids the old flicker where activeTab briefly reset while router.replace()
   * was still updating the query string.
   */
  const urlTab = useMemo(() => {
    return getTabFromParams(new URLSearchParams(searchParams.toString()));
  }, [searchParams]);

  const [activeTab, setActiveTab] = useState<PromotionTabValue>(urlTab);

  useEffect(() => {
    setActiveTab(urlTab);
  }, [urlTab]);

  const updateTab = useCallback(
    (nextTab: PromotionTabValue) => {
      setActiveTab(nextTab);

      const params = new URLSearchParams(searchParams.toString());

      if (nextTab === "overview") {
        params.delete("tab");
      } else {
        params.set("tab", nextTab);
      }

      const query = params.toString();
      const nextUrl = query ? `${pathname}?${query}` : pathname;

      router.replace(nextUrl, {
        scroll: false,
      });

      scrollToPageTop();
    },
    [pathname, router, searchParams]
  );

  if (authLoading || isBranchAdmin) {
    return null;
  }

  return (
    <Container>
      <Header
        title="Promotional Management"
        description="View performance insights and manage active promotions"
      />

      <div className="flex w-full flex-col gap-[32px] rounded-[14px] bg-white p-[30px]">
        <PromotionTabs
          tabs={PROMOTION_TABS}
          active={activeTab}
          onChange={(value: string) => {
            if (isPromotionTab(value)) {
              updateTab(value);
            }
          }}
        />

        {activeTab === "overview" ? (
          <PromotionsOverview onViewAll={updateTab} />
        ) : null}

        {activeTab === "coupons" ? <CouponsPage /> : null}

        {activeTab === "promotions" ? <PromotionsPage /> : null}

        {activeTab === "happy-hours" ? <HappyHourPage /> : null}
      </div>
    </Container>
  );
};

export default PromotionManagementPage;
