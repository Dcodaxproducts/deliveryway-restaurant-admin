"use client";

type PromotionTabValue = "overview" | "coupons" | "promotions" | "happy-hours";

type Props = {
  title: string;
  description?: string;
  showViewAll?: boolean;
  viewAllTab?: PromotionTabValue;
  onViewAll?: (tab: PromotionTabValue) => void;
};

export default function PromotionSectionHeader({
  title,
  description = "Boost Customer Loyalty with Custom Coupon Offers",
  showViewAll = true,
  viewAllTab,
  onViewAll,
}: Props) {
  const handleViewAll = () => {
    if (!viewAllTab || !onViewAll) return;
    onViewAll(viewAllTab);
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h2 className="mb-1 text-2xl font-semibold">{title}</h2>
        <p className="text-sm text-gray-500">{description}</p>
      </div>

      {showViewAll && viewAllTab && onViewAll ? (
        <button
          type="button"
          onClick={handleViewAll}
          className="shrink-0 text-sm font-medium text-primary hover:underline"
        >
          View All
        </button>
      ) : null}
    </div>
  );
}
