import { getDealStatusVariant } from "@/components/pages/Menu/deals/utils/admin-deals-formatters";
import type { AdminDeal } from "@/types/admin-deals";

type AdminDealStatusBadgeProps = {
  deal: AdminDeal;
};

export default function AdminDealStatusBadge({ deal }: AdminDealStatusBadgeProps) {
  const variant = getDealStatusVariant(deal);
  const label = variant === "active" ? "Active" : variant === "deleted" ? "Deleted" : "Inactive";
  const className =
    variant === "active"
      ? "bg-green-50 text-green-700"
      : variant === "deleted"
        ? "bg-red-50 text-red-700"
        : "bg-gray-100 text-gray-600";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
