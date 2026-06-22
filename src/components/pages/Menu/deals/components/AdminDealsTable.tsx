"use client";

import { BarChart3, Edit, Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import AdminDealLifecycleBadge from "@/components/pages/Menu/deals/components/AdminDealLifecycleBadge";
import AdminDealStatusBadge from "@/components/pages/Menu/deals/components/AdminDealStatusBadge";
import AdminDealsEmptyState from "@/components/pages/Menu/deals/components/AdminDealsEmptyState";
import {
  formatDealDate,
  formatDealPrice,
  formatShortDealId,
  getDealRequiredQuantityLabel,
  getDealSelectedCountLabel,
  getDealTypeLabel,
} from "@/components/pages/Menu/deals/utils/admin-deals-formatters";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/hooks/useCurrency";
import type { AdminDeal } from "@/types/admin-deals";
import { useTranslations } from "next-intl";

type AdminDealsTableProps = {
  deals: AdminDeal[];
  loading: boolean;
  error: Error | null;
  onDelete: (deal: AdminDeal) => void;
  onStats: (deal: AdminDeal) => void;
};

export default function AdminDealsTable({
  deals,
  loading,
  error,
  onDelete,
  onStats,
}: AdminDealsTableProps) {
  const router = useRouter();
  const t = useTranslations("deals");
  const commonT = useTranslations("common");
  const { resolveCurrency } = useCurrency(deals[0]?.restaurantId);

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-[16px] border border-gray-100 bg-white">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[16px] border border-red-100 bg-red-50 p-5 text-sm text-red-700">
        {t("unableToLoad")}
      </div>
    );
  }

  if (deals.length === 0) return <AdminDealsEmptyState />;

  return (
    <div className="overflow-hidden rounded-[16px] border border-gray-100 bg-white">
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full table-fixed text-left">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="w-[22%] px-4 py-3 font-semibold">{t("deal")}</th>
              <th className="w-[14%] px-4 py-3 font-semibold">{t("dealType")}</th>
              <th className="w-[11%] px-4 py-3 font-semibold">{t("fixedPrice")}</th>
              <th className="w-[12%] px-4 py-3 font-semibold">{t("scope")}</th>
              <th className="w-[18%] px-4 py-3 font-semibold">{t("schedule")}</th>
              <th className="w-[10%] px-4 py-3 font-semibold">{t("requiredQty")}</th>
              <th className="w-[12%] px-4 py-3 font-semibold">{commonT("status")}</th>
              <th className="w-[10%] px-4 py-3 text-right font-semibold">
                {commonT("actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {deals.map((deal) => (
              <tr key={deal.id} className="hover:bg-gray-50/70">
                <td className="px-4 py-4 align-top">
                  <div className="flex min-w-0 items-start gap-3">
                    {deal.thumbnailUrl || deal.imageUrl ? (
                      <Image
                        src={deal.thumbnailUrl || deal.imageUrl || ""}
                        alt={`${deal.title} thumbnail`}
                        width={40}
                        height={40}
                        unoptimized
                        className="h-10 w-10 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gray-100 text-xs font-semibold text-gray-400">
                        {deal.title.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {deal.title}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {deal.code || formatShortDealId(deal.id)}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                        {deal.description || t("noDescription")}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 align-top text-sm text-gray-700">
                  {getDealTypeLabel(deal)}
                </td>
                <td className="px-4 py-4 align-top text-sm font-semibold text-gray-900">
                  {formatDealPrice(
                    deal.discountValue,
                    resolveCurrency(deal.currency)
                  )}
                </td>
                <td className="px-4 py-4 align-top text-sm text-gray-700">
                  {getDealSelectedCountLabel(deal)}
                </td>
                <td className="px-4 py-4 align-top text-xs text-gray-600">
                  <div>{formatDealDate(deal.startsAt)}</div>
                  <div className="mt-1 text-gray-400">{formatDealDate(deal.expiresAt)}</div>
                </td>
                <td className="px-4 py-4 align-top text-xs text-gray-600">
                  {getDealRequiredQuantityLabel(deal)}
                </td>
                <td className="px-4 py-4 align-top">
                  <div className="flex flex-col items-start gap-2">
                    <AdminDealLifecycleBadge lifecycle={deal.lifecycle} />
                    <AdminDealStatusBadge deal={deal} />
                    <span className="text-xs text-gray-400">
                      {deal.branchId ? `${commonT("branch")} ${formatShortDealId(deal.branchId)}` : commonT("allBranches")}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 align-top">
                  <div className="flex justify-end gap-1">
                    <IconButton label={t("viewStats")} onClick={() => onStats(deal)}>
                      <BarChart3 size={16} />
                    </IconButton>
                    <IconButton
                      label={commonT("edit")}
                      onClick={() => router.push(`/menu/deals/${deal.id}/edit`)}
                    >
                      <Edit size={16} />
                    </IconButton>
                    <IconButton label={commonT("delete")} onClick={() => onDelete(deal)}>
                      <Trash2 size={16} />
                    </IconButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-gray-100 lg:hidden">
        {deals.map((deal) => (
          <div key={deal.id} className="space-y-4 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                {deal.thumbnailUrl || deal.imageUrl ? (
                  <Image
                    src={deal.thumbnailUrl || deal.imageUrl || ""}
                    alt={`${deal.title} thumbnail`}
                    width={40}
                    height={40}
                    unoptimized
                    className="h-10 w-10 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gray-100 text-xs font-semibold text-gray-400">
                    {deal.title.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {deal.title}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {deal.code || formatShortDealId(deal.id)}
                  </p>
                </div>
              </div>
              <AdminDealLifecycleBadge lifecycle={deal.lifecycle} />
            </div>
            <p className="line-clamp-2 text-xs text-gray-500">
              {deal.description || t("noDescription")}
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
              <Info label={t("dealType")} value={getDealTypeLabel(deal)} />
              <Info
                label={t("fixedPrice")}
                value={formatDealPrice(
                  deal.discountValue,
                  resolveCurrency(deal.currency)
                )}
              />
              <Info label={t("scope")} value={getDealSelectedCountLabel(deal)} />
              <Info label={t("requiredQty")} value={getDealRequiredQuantityLabel(deal)} />
              <Info label={t("starts")} value={formatDealDate(deal.startsAt)} />
              <Info label={t("expires")} value={formatDealDate(deal.expiresAt)} />
              <Info label={commonT("branch")} value={deal.branchId ? formatShortDealId(deal.branchId) : commonT("allBranches")} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <AdminDealStatusBadge deal={deal} />
              <div className="flex gap-1">
                <IconButton label={t("viewStats")} onClick={() => onStats(deal)}>
                  <BarChart3 size={16} />
                </IconButton>
                <IconButton
                  label={commonT("edit")}
                  onClick={() => router.push(`/menu/deals/${deal.id}/edit`)}
                >
                  <Edit size={16} />
                </IconButton>
                <IconButton label={commonT("delete")} onClick={() => onDelete(deal)}>
                  <Trash2 size={16} />
                </IconButton>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-gray-400">{label}</p>
      <p className="mt-1 font-medium text-gray-700">{value}</p>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="h-9 w-9 rounded-full p-0 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
    >
      {children}
    </Button>
  );
}
