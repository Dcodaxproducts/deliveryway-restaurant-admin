"use client";

import { CalendarClock, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";
import {
  useRestaurantOrderingSettings,
  useUpdateRestaurantOrderingSettings,
} from "@/hooks/useRestaurantOrderingSettings";
import { getApiErrorMessage } from "@/lib/errors";
import type { RestaurantOrderingSettings } from "@/services/ordering-settings";

import {
  BRANDING_PANEL_CLASS,
  BRANDING_SECONDARY_BUTTON_CLASS,
  BRANDING_SECTION_TITLE_CLASS,
} from "./branding-form-classes";

type OrderingOptionsPanelProps = {
  restaurantId?: string;
};

type OrderingOptionRowProps = {
  checked: boolean;
  description: string;
  disabled: boolean;
  id: string;
  label: string;
  onCheckedChange: (checked: boolean) => void;
};

export default function OrderingOptionsPanel({
  restaurantId,
}: OrderingOptionsPanelProps) {
  const t = useTranslations("settings");
  const {
    data: settings,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useRestaurantOrderingSettings(restaurantId);
  const updateSettings = useUpdateRestaurantOrderingSettings();
  const isSaving = updateSettings.isPending;

  const handleChange = async (
    key: keyof RestaurantOrderingSettings,
    checked: boolean,
  ) => {
    if (!restaurantId || !settings) return;

    try {
      await updateSettings.mutateAsync({
        restaurantId,
        settings: { ...settings, [key]: checked },
      });
      toast.success(t("orderingOptionsSaved"));
    } catch (updateError) {
      toast.error(
        getApiErrorMessage(updateError, t("orderingOptionsSaveFailed")),
      );
    }
  };

  return (
    <section
      className={BRANDING_PANEL_CLASS}
      aria-labelledby="ordering-options-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-primary/10 p-2.5 text-primary">
            <CalendarClock className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2
              id="ordering-options-title"
              className={BRANDING_SECTION_TITLE_CLASS}
            >
              {t("orderingOptions")}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {t("orderingOptionsDescription")}
            </p>
          </div>
        </div>
        {isSaving ? (
          <p
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600"
            role="status"
            aria-live="polite"
          >
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            {t("orderingOptionsSaving")}
          </p>
        ) : null}
      </div>

      {!restaurantId ? (
        <p
          className="mt-6 rounded-[12px] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {t("orderingOptionsRestaurantUnavailable")}
        </p>
      ) : isLoading ? (
        <div className="mt-6 space-y-3" role="status" aria-live="polite">
          <p className="sr-only">{t("orderingOptionsLoading")}</p>
          <div className="h-[82px] animate-pulse rounded-[14px] bg-gray-100" />
          <div className="h-[82px] animate-pulse rounded-[14px] bg-gray-100" />
        </div>
      ) : error || !settings ? (
        <div
          className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-destructive/20 bg-destructive/5 px-4 py-3"
          role="alert"
        >
          <p className="text-sm text-destructive">
            {getApiErrorMessage(error, t("orderingOptionsLoadFailed"))}
          </p>
          <button
            type="button"
            className={BRANDING_SECONDARY_BUTTON_CLASS}
            onClick={() => void refetch()}
          >
            {t("retry")}
          </button>
        </div>
      ) : (
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <OrderingOptionRow
            id="allow-preorders"
            label={t("allowPreorders")}
            description={t("allowPreordersDescription")}
            checked={settings.preorderEnabled}
            disabled={isSaving || isFetching}
            onCheckedChange={(checked) =>
              void handleChange("preorderEnabled", checked)
            }
          />
          <OrderingOptionRow
            id="allow-customer-tips"
            label={t("allowCustomerTips")}
            description={t("allowCustomerTipsDescription")}
            checked={settings.tipsEnabled}
            disabled={isSaving || isFetching}
            onCheckedChange={(checked) =>
              void handleChange("tipsEnabled", checked)
            }
          />
        </div>
      )}
    </section>
  );
}

function OrderingOptionRow({
  checked,
  description,
  disabled,
  id,
  label,
  onCheckedChange,
}: OrderingOptionRowProps) {
  const descriptionId = id + "-description";

  return (
    <div className="flex items-center justify-between gap-6 rounded-[14px] border border-gray-200 bg-gray-50/70 p-4">
      <div>
        <label htmlFor={id} className="text-sm font-semibold text-gray-900">
          {label}
        </label>
        <p id={descriptionId} className="mt-1 text-sm text-gray-500">
          {description}
        </p>
      </div>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        aria-describedby={descriptionId}
        onCheckedChange={onCheckedChange}
        className="data-[state=checked]:bg-primary"
      />
    </div>
  );
}
