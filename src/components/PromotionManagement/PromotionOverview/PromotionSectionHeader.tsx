"use client";

import { useRouter } from "next/navigation";

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
  description = "Boost Customer Loyalty with Custom Coupon Offers",
  showViewAll = true,
  viewAllTab,
  onViewAll,
  actionLabel,
  actionHref,
}: Props) {
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
        <p className="text-sm text-gray-500">{description}</p>
      </div>

      <div className="flex items-center gap-3 sm:justify-end">
        {showViewAll && viewAllTab && onViewAll ? (
          <button
            type="button"
            onClick={handleViewAll}
            className="shrink-0 text-sm font-medium text-primary hover:underline"
          >
            View All
          </button>
        ) : null}

        {actionLabel && actionHref ? (
          <button
            type="button"
            onClick={handleAction}
            className="inline-flex h-[44px] shrink-0 items-center justify-center rounded-[12px] bg-primary px-5 text-sm font-medium text-white transition hover:bg-red-700"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
