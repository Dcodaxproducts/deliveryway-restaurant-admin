"use client";

import clsx from "clsx";

import { getGiftCardLifecycleLabel } from "@/components/pages/Promotions/gift-cards/utils/gift-card-formatters";

type GiftCardLifecycleBadgeProps = {
  lifecycle?: string | null;
  status?: string | null;
};

const getBadgeClassName = (value: string) => {
  switch (value.toLowerCase()) {
    case "active":
      return "bg-emerald-50 text-emerald-700 ring-emerald-100";
    case "scheduled":
      return "bg-blue-50 text-blue-700 ring-blue-100";
    case "expired":
      return "bg-amber-50 text-amber-700 ring-amber-100";
    case "inactive":
      return "bg-gray-100 text-gray-600 ring-gray-200";
    default:
      return "bg-gray-50 text-gray-600 ring-gray-100";
  }
};

export default function GiftCardLifecycleBadge({
  lifecycle,
  status,
}: GiftCardLifecycleBadgeProps) {
  const value = lifecycle || status || "unknown";

  return (
    <span
      className={clsx(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
        getBadgeClassName(value)
      )}
    >
      {getGiftCardLifecycleLabel(value)}
    </span>
  );
}
