"use client";

import { Edit, Loader2, Trash2 } from "lucide-react";
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
import type { GiftCard } from "@/types/gift-cards";

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

  if (giftCards.length === 0) {
    return (
      <div className="rounded-[16px] border border-gray-100 bg-white p-8 text-center">
        <h3 className="text-base font-semibold text-gray-900">{t("emptyTitle")}</h3>
        <p className="mt-2 text-sm text-gray-500">{t("emptyDescription")}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[16px] border border-gray-100 bg-white">
      <div className="hidden overflow-x-auto xl:block">
        <table className="w-full table-fixed text-left">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="w-[24%] px-4 py-3 font-semibold">{t("giftCard")}</th>
              <th className="w-[11%] px-4 py-3 font-semibold">{t("amount")}</th>
              <th className="w-[15%] px-4 py-3 font-semibold">{t("usage")}</th>
              <th className="w-[19%] px-4 py-3 font-semibold">{t("schedule")}</th>
              <th className="w-[12%] px-4 py-3 font-semibold">{commonT("status")}</th>
              <th className="w-[11%] px-4 py-3 font-semibold">{commonT("branch")}</th>
              <th className="w-[8%] px-4 py-3 text-right font-semibold">
                {commonT("actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {giftCards.map((giftCard) => {
              const imageUrl = getGiftCardImageUrl(giftCard);

              return (
                <tr key={giftCard.id} className="hover:bg-gray-50/70">
                  <td className="px-4 py-4 align-top">
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
                  </td>
                  <td className="px-4 py-4 align-top text-sm font-semibold text-gray-900">
                    {formatGiftCardAmount(giftCard.amount)}
                  </td>
                  <td className="px-4 py-4 align-top text-xs text-gray-600">
                    <div>{formatGiftCardUsage(giftCard)}</div>
                    <div className="mt-1 text-gray-400">
                      {t("perCustomer", {
                        count: formatGiftCardCustomerUsage(giftCard.maxUsesPerCustomer),
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top text-xs text-gray-600">
                    <div>{formatGiftCardDate(giftCard.startsAt)}</div>
                    <div className="mt-1 text-gray-400">
                      {formatGiftCardDate(giftCard.expiresAt)}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <GiftCardLifecycleBadge
                      lifecycle={giftCard.status?.toLowerCase()}
                      status={giftCard.status}
                    />
                  </td>
                  <td className="px-4 py-4 align-top text-xs text-gray-600">
                    {giftCard.branch?.name ||
                      (giftCard.branch?.id ? formatShortGiftCardId(giftCard.branch.id) : commonT("allBranches"))}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex justify-end gap-1">
                      <IconButton
                        label={commonT("edit")}
                        onClick={() =>
                          router.push(
                            `/promotion-management/gift-cards/${giftCard.id}/edit`
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-gray-100 xl:hidden">
        {giftCards.map((giftCard) => {
          const imageUrl = getGiftCardImageUrl(giftCard);

          return (
            <div key={giftCard.id} className="space-y-4 p-4">
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
                <Info label={t("amount")} value={formatGiftCardAmount(giftCard.amount)} />
                <Info label={t("usage")} value={formatGiftCardUsage(giftCard)} />
                <Info label={t("starts")} value={formatGiftCardDate(giftCard.startsAt)} />
                <Info label={t("expires")} value={formatGiftCardDate(giftCard.expiresAt)} />
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
                    router.push(`/promotion-management/gift-cards/${giftCard.id}/edit`)
                  }
                >
                  <Edit size={16} />
                </IconButton>
                <IconButton label={commonT("delete")} onClick={() => onDelete(giftCard)}>
                  <Trash2 size={16} />
                </IconButton>
              </div>
            </div>
          );
        })}
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
