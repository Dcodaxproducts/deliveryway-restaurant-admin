"use client";

import { BarChart3, Edit, GripVertical, Trash2 } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import AdminDealLifecycleBadge from "@/components/pages/Menu/deals/components/AdminDealLifecycleBadge";
import AdminDealStatusBadge from "@/components/pages/Menu/deals/components/AdminDealStatusBadge";
import { ResponsiveDataView } from "@/components/common/ResponsiveDataView";
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
  onReorder?: (fromId: string, toId: string) => void;
  reordering?: boolean;
};

export default function AdminDealsTable({
  deals,
  loading,
  error,
  onDelete,
  onStats,
  onReorder,
  reordering = false,
}: AdminDealsTableProps) {
  const router = useRouter();
  const t = useTranslations("deals");
  const commonT = useTranslations("common");
  const { resolveCurrency } = useCurrency(deals[0]?.restaurantId);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Delegate desktop row events without adding domain behavior to the shared table.
  const desktopDeal = (target: EventTarget) => {
    const row = (target as HTMLElement).closest<HTMLTableRowElement>("tbody tr");
    return row ? deals[row.sectionRowIndex] : undefined;
  };

  return (
    <div
      onDragStart={(event) => {
        const deal = desktopDeal(event.target);
        if (deal) setDraggedId(deal.id);
      }}
      onDragEnd={() => setDraggedId(null)}
      onDragOver={(event) => {
        if (desktopDeal(event.target)) event.preventDefault();
      }}
      onDrop={(event) => {
        const deal = desktopDeal(event.target);
        if (!deal) return;
        if (draggedId && draggedId !== deal.id) onReorder?.(draggedId, deal.id);
        setDraggedId(null);
      }}
    >
      <ResponsiveDataView
        data={deals}
        rowKey={(deal) => deal.id}
        loading={loading}
        error={error ? t("unableToLoad") : null}
        errorTitle={commonT("unableToLoad")}
        emptyTitle={t("emptyTitle")}
        emptyDescription={t("emptyDescription")}
        className="[&_td]:align-top [&_td]:py-4 [&_tr:has([data-dragged=true])]:bg-primary/5 [&_tr:has([data-dragged=true])]:opacity-60"
        columns={[
          { id: "order", header: <span className="sr-only">{t("sortDeals")}</span>, cell: (deal) => (
            <div
              data-dragged={draggedId === deal.id}
              ref={(node) => {
                const row = node?.closest("tr");
                if (row) row.draggable = Boolean(onReorder) && !reordering;
              }}
            >
              <GripVertical
                className="mt-2 size-4 cursor-grab text-gray-400"
                aria-hidden
              />
            </div>
          ) },
          { id: "deal", header: t("deal"), className: "min-w-[240px] max-w-[320px] whitespace-normal", cell: (deal) => (
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
          ) },
          { id: "type", header: t("dealType"), cell: getDealTypeLabel },
          { id: "price", header: t("fixedPrice"), className: "font-semibold text-gray-900", cell: (deal) => formatDealPrice(
            deal.discountValue,
            resolveCurrency(deal.currency)
          ) },
          { id: "scope", header: t("scope"), cell: getDealSelectedCountLabel },
          { id: "schedule", header: t("schedule"), className: "text-xs", cell: (deal) => (
            <>
              <div>{formatDealDate(deal.startsAt)}</div>
              <div className="mt-1 text-gray-400">{formatDealDate(deal.expiresAt)}</div>
            </>
          ) },
          { id: "quantity", header: t("requiredQty"), cell: getDealRequiredQuantityLabel },
          { id: "status", header: commonT("status"), cell: (deal) => (
            <div className="flex flex-col items-start gap-2">
              <AdminDealLifecycleBadge lifecycle={deal.lifecycle} />
              <AdminDealStatusBadge deal={deal} />
              <span className="text-xs text-gray-400">
                {deal.branchId ? `${commonT("branch")} ${formatShortDealId(deal.branchId)}` : commonT("allBranches")}
              </span>
            </div>
          ) },
          { id: "actions", header: commonT("actions"), align: "right", cell: (deal) => (
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
          ) },
        ]}
        renderMobileItem={(deal) => (
          <div
            key={deal.id}
            draggable={Boolean(onReorder) && !reordering}
            onDragStart={() => setDraggedId(deal.id)}
            onDragEnd={() => setDraggedId(null)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (draggedId && draggedId !== deal.id) {
                onReorder?.(draggedId, deal.id);
              }
              setDraggedId(null);
            }}
            className="space-y-4 rounded-[var(--ui-radius-card)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <GripVertical className="mt-2 size-4 shrink-0 cursor-grab text-gray-400" />
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
        )}
      />
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
