"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

type PromotionTabValue = "overview" | "coupons" | "promotions" | "happy-hours";

type Props = {
  title: string;
  description?: string;
  showViewAll?: boolean;
  viewAllTab?: PromotionTabValue;
  onViewAll?: (tab: PromotionTabValue) => void;
  actionLabel?: string;
  actionHref?: string;
};

export default function PromotionSectionHeader({
  title,
  description,
  showViewAll = true,
  viewAllTab,
  onViewAll,
  actionLabel,
  actionHref,
}: Props) {
  const t = useTranslations("promotions");
  const router = useRouter();

  const handleViewAll = () => {
    if (!viewAllTab || !onViewAll) return;
    onViewAll(viewAllTab);
  };

  const handleAction = () => {
    if (!actionHref) return;
    router.push(actionHref);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="mb-1 text-2xl font-semibold">{title}</h2>
        <p className="text-sm text-gray-500">{description ?? t("description")}</p>
      </div>

      <div className="flex items-center gap-3 sm:justify-end">
        {showViewAll && viewAllTab && onViewAll ? (
          <button
            type="button"
            onClick={handleViewAll}
            className="shrink-0 text-sm font-medium text-primary hover:underline"
          >
            {t("viewAll")}
          </button>
        ) : null}

        {actionLabel && actionHref ? (
          <Button
            type="button"
            onClick={handleAction}
            className="h-[44px] shrink-0 rounded-[12px] px-5"
          >
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
