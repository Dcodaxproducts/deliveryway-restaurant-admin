"use client";

import { Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import Header from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

type GiftCardsHeaderProps = {
  total: number;
  isRefreshing: boolean;
  canManageVisibility: boolean;
  visibilityEnabled: boolean;
  visibilityLoading: boolean;
  visibilityUpdating: boolean;
  onRefresh: () => void;
  onVisibilityChange: (isEnabled: boolean) => void;
};

export default function GiftCardsHeader({
  total,
  isRefreshing,
  canManageVisibility,
  visibilityEnabled,
  visibilityLoading,
  visibilityUpdating,
  onRefresh,
  onVisibilityChange,
}: GiftCardsHeaderProps) {
  const router = useRouter();
  const commonT = useTranslations("common");
  const t = useTranslations("promotions.giftCards");
  const visibilityDisabled = visibilityLoading || visibilityUpdating;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <Header title={t("title")} description={t("description")} />

      <div className="flex flex-wrap items-center gap-2">
        {canManageVisibility ? (
          <label className="flex h-[42px] items-center gap-3 rounded-[12px] border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700">
            <span>{t("websiteVisibility")}</span>
            <Switch
              checked={visibilityEnabled}
              disabled={visibilityDisabled}
              aria-label={t("websiteVisibility")}
              onCheckedChange={(checked) => onVisibilityChange(Boolean(checked))}
            />
          </label>
        ) : null}
        <span className="rounded-full bg-gray-100 px-3 py-2 text-sm font-medium text-gray-600">
          {t("total", { total: total.toLocaleString() })}
        </span>
        <Button
          type="button"
          variant="outline"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-[42px] rounded-[12px]"
        >
          <RefreshCw
            size={16}
            className={isRefreshing ? "mr-2 animate-spin" : "mr-2"}
          />
          {commonT("refresh")}
        </Button>
        <Button
          type="button"
          onClick={() => router.push("/promotion-management/gift-cards/add")}
          className="h-[42px] rounded-[12px] bg-primary text-white hover:bg-primary/90"
        >
          <Plus size={16} className="mr-2" />
          {t("addGiftCard")}
        </Button>
      </div>
    </div>
  );
}
