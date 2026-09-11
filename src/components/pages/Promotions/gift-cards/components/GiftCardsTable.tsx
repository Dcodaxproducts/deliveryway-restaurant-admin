"use client";

import { Edit, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import GiftCardLifecycleBadge from "@/components/pages/Promotions/gift-cards/components/GiftCardLifecycleBadge";
import {
  formatGiftCardAmount,
  formatGiftCardCustomerUsage,
  formatGiftCardDate,
  formatGiftCardUsage,
  formatShortGiftCardId,
  getGiftCardImageUrl,
} from "@/components/pages/Promotions/gift-cards/utils/gift-card-formatters";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/hooks/useCurrency";
import type { GiftCard } from "@/types/gift-cards";
import type { DataTableColumn } from "@/components/common/DataTable";
import { ResponsiveDataView } from "@/components/common/ResponsiveDataView";

type GiftCardsTableProps = {
  giftCards: GiftCard[];
  loading: boolean;
  error: Error | null;
  onDelete: (giftCard: GiftCard) => void;
};

export default function GiftCardsTable({
  giftCards,
  loading,
  error,
  onDelete,
}: GiftCardsTableProps) {
  const router = useRouter();
  const t = useTranslations("promotions.giftCards");
  const commonT = useTranslations("common");
  const { resolveCurrency } = useCurrency(giftCards[0]?.restaurant?.id);

  const columns: readonly DataTableColumn<GiftCard>[] = [
    {
      id: "giftCard",
      header: t("giftCard"),
      className: "max-w-72 whitespace-normal align-top",
      cell: (giftCard) => {
        const imageUrl = getGiftCardImageUrl(giftCard);
        return (
          <div className="flex min-w-0 items-start gap-3">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={`${giftCard.title} thumbnail`}
                width={40}
                height={40}
                unoptimized
                className="h-10 w-10 shrink-0 rounded-md object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gray-100 text-xs font-semibold text-gray-400">
                {giftCard.title.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">
                {giftCard.title}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {giftCard.code || formatShortGiftCardId(giftCard.id)}
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                {giftCard.description || t("noDescription")}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      id: "amount",
      header: t("amount"),
      className: "align-top font-semibold text-gray-900",
      cell: (giftCard) =>
        formatGiftCardAmount(
          giftCard.amount,
          resolveCurrency(giftCard.currency),
        ),
    },
    {
      id: "usage",
      header: t("usage"),
      className: "align-top text-xs",
      cell: (giftCard) => (
        <div>
          <div>{formatGiftCardUsage(giftCard)}</div>
          <div className="mt-1 text-gray-400">
            {t("perCustomer", {
              count: formatGiftCardCustomerUsage(giftCard.maxUsesPerCustomer),
            })}
          </div>
        </div>
      ),
    },
    {
      id: "schedule",
      header: t("schedule"),
      className: "align-top text-xs",
      cell: (giftCard) => (
        <div>
          <div>{formatGiftCardDate(giftCard.startsAt)}</div>
          <div className="mt-1 text-gray-400">
            {formatGiftCardDate(giftCard.expiresAt)}
          </div>
        </div>
      ),
    },
    {
      id: "status",
      header: commonT("status"),
      className: "align-top",
      cell: (giftCard) => (
        <GiftCardLifecycleBadge
          lifecycle={giftCard.status?.toLowerCase()}
          status={giftCard.status}
        />
      ),
    },
    {
      id: "branch",
      header: commonT("branch"),
      className: "max-w-44 whitespace-normal break-words align-top text-xs",
      cell: (giftCard) =>
        giftCard.branch?.name ||
        (giftCard.branch?.id
          ? formatShortGiftCardId(giftCard.branch.id)
          : commonT("allBranches")),
    },
    {
      id: "actions",
      header: commonT("actions"),
      align: "right",
      className: "align-top",
      cell: (giftCard) => (
        <div className="flex justify-end gap-1">
          <IconButton
            label={commonT("edit")}
            onClick={() =>
              router.push(
                `/promotion-management/gift-cards/${giftCard.id}/edit`,
              )
            }
          >
            <Edit size={16} />
          </IconButton>
          <IconButton
            label={commonT("delete")}
            onClick={() => onDelete(giftCard)}
          >
            <Trash2 size={16} />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <ResponsiveDataView
      data={giftCards}
      columns={columns}
      rowKey={(giftCard) => giftCard.id}
      loading={loading}
      error={error ? error.message || t("unableToLoad") : undefined}
      errorTitle={t("unableToLoad")}
      emptyTitle={t("emptyTitle")}
      emptyDescription={t("emptyDescription")}
      renderMobileItem={(giftCard) => {
        const imageUrl = getGiftCardImageUrl(giftCard);

        return (
          <div className="space-y-4 rounded-[var(--ui-radius-card)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={`${giftCard.title} thumbnail`}
                    width={40}
                    height={40}
                    unoptimized
                    className="h-10 w-10 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gray-100 text-xs font-semibold text-gray-400">
                    {giftCard.title.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {giftCard.title}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {giftCard.code || formatShortGiftCardId(giftCard.id)}
                  </p>
                </div>
              </div>
              <GiftCardLifecycleBadge
                lifecycle={giftCard.status?.toLowerCase()}
                status={giftCard.status}
              />
            </div>
            <p className="line-clamp-2 text-xs text-gray-500">
              {giftCard.description || t("noDescription")}
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
              <Info
                label={t("amount")}
                value={formatGiftCardAmount(
                  giftCard.amount,
                  resolveCurrency(giftCard.currency),
                )}
              />
              <Info label={t("usage")} value={formatGiftCardUsage(giftCard)} />
              <Info
                label={t("starts")}
                value={formatGiftCardDate(giftCard.startsAt)}
              />
              <Info
                label={t("expires")}
                value={formatGiftCardDate(giftCard.expiresAt)}
              />
              <Info
                label={commonT("branch")}
                value={
                  giftCard.branch?.name ||
                  (giftCard.branch?.id
                    ? formatShortGiftCardId(giftCard.branch.id)
                    : commonT("allBranches"))
                }
              />
              <Info
                label={t("perUser")}
                value={formatGiftCardCustomerUsage(giftCard.maxUsesPerCustomer)}
              />
            </div>
            <div className="flex justify-end gap-1">
              <IconButton
                label={commonT("edit")}
                onClick={() =>
                  router.push(
                    `/promotion-management/gift-cards/${giftCard.id}/edit`,
                  )
                }
              >
                <Edit size={16} />
              </IconButton>
              <IconButton
                label={commonT("delete")}
                onClick={() => onDelete(giftCard)}
              >
                <Trash2 size={16} />
              </IconButton>
            </div>
          </div>
        );
      }}
    />
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
