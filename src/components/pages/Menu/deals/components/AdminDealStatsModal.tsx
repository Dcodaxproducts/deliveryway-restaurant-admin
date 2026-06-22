"use client";

import { Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDealPrice } from "@/components/pages/Menu/deals/utils/admin-deals-formatters";
import { useCurrency } from "@/hooks/useCurrency";
import { useAdminDealStats } from "@/hooks/useAdminDeals";
import type { AdminDeal } from "@/types/admin-deals";
import { useTranslations } from "next-intl";

type AdminDealStatsModalProps = {
  deal: AdminDeal | null;
  restaurantId?: string;
  branchId?: string;
  onClose: () => void;
};

export default function AdminDealStatsModal({
  deal,
  restaurantId,
  branchId,
  onClose,
}: AdminDealStatsModalProps) {
  const t = useTranslations("deals.stats");
  const { resolveCurrency } = useCurrency(restaurantId);
  const statsQuery = useAdminDealStats(
    deal?.id ?? null,
    deal ? { restaurantId, branchId } : undefined
  );
  const stats = statsQuery.data ?? {};
  const currency = resolveCurrency(
    typeof stats.currency === "string" ? stats.currency : undefined,
    deal?.currency
  );

  if (!deal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-[18px] bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{t("title")}</h3>
            <p className="mt-1 text-sm text-gray-500">{deal.title}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            aria-label={t("closeAria")}
            onClick={onClose}
            className="h-9 w-9 rounded-full p-0"
          >
            <X size={18} />
          </Button>
        </div>

        {statsQuery.isLoading ? (
          <div className="flex min-h-[220px] items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Stat label={t("totalUses")} value={formatStatNumber(stats.totalUses)} />
            <Stat label={t("orders")} value={formatStatNumber(stats.orderCount)} />
            <Stat label={t("customers")} value={formatStatNumber(stats.customerCount)} />
            <Stat
              label={t("discountAmount")}
              value={formatDealPrice(stats.totalDiscountAmount, currency)}
            />
            <Stat label={t("revenue")} value={formatDealPrice(stats.totalRevenue, currency)} />
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-gray-100 bg-gray-50 p-4">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function formatStatNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? value.toLocaleString()
    : "—";
}
