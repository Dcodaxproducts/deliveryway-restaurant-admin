"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BadgePercent,
  Coins,
  Gift,
  Loader2,
  RefreshCcw,
  Save,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGetLoyaltyProgram, useUpdateLoyaltyProgram } from "@/hooks/useLoyalty";

type LoyaltyProgramSettingsProps = {
  restaurantId?: string;
  readOnly?: boolean;
};

type LoyaltyProgramForm = {
  pointsPerCurrencyUnit: string;
  currencyAmountPerPoint: string;
  redemptionValuePerPoint: string;
  minimumRedeemPoints: string;
  pointsExpiryDays: string;
  isActive: boolean;
  allowWalletConversion: boolean;
  allowOrderDiscount: boolean;
};

const defaultForm: LoyaltyProgramForm = {
  pointsPerCurrencyUnit: "0",
  currencyAmountPerPoint: "0",
  redemptionValuePerPoint: "0",
  minimumRedeemPoints: "0",
  pointsExpiryDays: "0",
  isActive: true,
  allowWalletConversion: true,
  allowOrderDiscount: true,
};

const toSafeString = (value: unknown, fallback = "0") => {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value);
};

const toNumber = (value: string) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const isNegativeNumber = (value: string) => Number(value) < 0;

const StatCard = ({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) => {
  return (
    <div className="rounded-[16px] border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-xl font-semibold text-gray-950">{value}</p>
          <p className="mt-1 text-sm text-gray-500">{title}</p>
        </div>
      </div>
    </div>
  );
};

const ToggleRow = ({
  title,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (!disabled) onChange(!checked);
      }}
      className={`flex w-full items-center justify-between gap-4 rounded-[14px] border border-gray-100 bg-[#FAFAFA] p-4 text-left transition hover:border-primary/20 hover:bg-primary/[0.03] ${
        disabled ? "cursor-not-allowed opacity-70 hover:border-gray-100 hover:bg-[#FAFAFA]" : ""
      }`}
    >
      <div>
        <p className="text-sm font-semibold text-gray-950">{title}</p>
        <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
      </div>

      <span
        className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition ${
          checked ? "bg-primary" : "bg-gray-300"
        }`}
      >
        <span
          className={`h-5 w-5 rounded-full bg-white transition ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </span>
    </button>
  );
};

const Field = ({
  label,
  helper,
  value,
  onChange,
  placeholder = "0",
  disabled = false,
}: {
  label: string;
  helper: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-900">{label}</label>

      <Input
        type="number"
        min={0}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-[44px] rounded-[12px] border-gray-300 focus:border-gray-400"
      />

      <p className="text-xs leading-5 text-gray-400">{helper}</p>
    </div>
  );
};

export default function LoyaltyProgramSettings({
  restaurantId,
  readOnly = false,
}: LoyaltyProgramSettingsProps) {
  const [form, setForm] = useState<LoyaltyProgramForm>(defaultForm);

  const {
    data: programResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetLoyaltyProgram({
    restaurantId,
  });

  const { mutate: updateProgram, isPending: isUpdating } =
    useUpdateLoyaltyProgram();

  const program = programResponse?.data;

  useEffect(() => {
    if (!program) return;

    setForm({
      pointsPerCurrencyUnit: toSafeString(program.pointsPerCurrencyUnit),
      currencyAmountPerPoint: toSafeString(program.currencyAmountPerPoint),
      redemptionValuePerPoint: toSafeString(program.redemptionValuePerPoint),
      minimumRedeemPoints: toSafeString(program.minimumRedeemPoints),
      pointsExpiryDays: toSafeString(program.pointsExpiryDays),
      isActive: Boolean(program.isActive),
      allowWalletConversion: Boolean(program.allowWalletConversion),
      allowOrderDiscount: Boolean(program.allowOrderDiscount),
    });
  }, [program]);

  const stats = useMemo(() => {
    return [
      {
        title: "Points / Currency",
        value: form.pointsPerCurrencyUnit || 0,
        icon: <Coins size={18} />,
      },
      {
        title: "Redeem Value",
        value: form.redemptionValuePerPoint || 0,
        icon: <Gift size={18} />,
      },
      {
        title: "Minimum Redeem",
        value: form.minimumRedeemPoints || 0,
        icon: <BadgePercent size={18} />,
      },
      {
        title: "Expiry Days",
        value: form.pointsExpiryDays || 0,
        icon: <ShieldCheck size={18} />,
      },
    ];
  }, [form]);

  const update = <K extends keyof LoyaltyProgramForm>(
    key: K,
    value: LoyaltyProgramForm[K]
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const validate = () => {
    const numericFields: Array<keyof LoyaltyProgramForm> = [
      "pointsPerCurrencyUnit",
      "currencyAmountPerPoint",
      "redemptionValuePerPoint",
      "minimumRedeemPoints",
      "pointsExpiryDays",
    ];

    const hasNegative = numericFields.some((field) =>
      isNegativeNumber(String(form[field]))
    );

    if (hasNegative) {
      toast.error("Loyalty values cannot be negative");
      return false;
    }

    if (!restaurantId) {
      toast.error("Restaurant ID is missing");
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (readOnly) {
      toast.error("Branch admin can view loyalty settings but cannot update the program");
      return;
    }

    if (!validate()) return;

    updateProgram(
      {
        restaurantId,
        pointsPerCurrencyUnit: toNumber(form.pointsPerCurrencyUnit),
        currencyAmountPerPoint: toNumber(form.currencyAmountPerPoint),
        redemptionValuePerPoint: toNumber(form.redemptionValuePerPoint),
        minimumRedeemPoints: toNumber(form.minimumRedeemPoints),
        pointsExpiryDays: toNumber(form.pointsExpiryDays),
        isActive: form.isActive,
        allowWalletConversion: form.allowWalletConversion,
        allowOrderDiscount: form.allowOrderDiscount,
      },
      {
        onSuccess: () => {
          refetch();
        },
      }
    );
  };

  return (
    <section className="rounded-[20px] bg-white p-4 shadow-sm lg:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-950">
            Loyalty Program Settings
          </h2>
          <p className="mt-1 text-sm leading-6 text-gray-500">
            Configure how customers earn, redeem, and convert loyalty points.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading || isFetching || isUpdating}
            className="h-[42px] rounded-[12px]"
          >
            {isFetching ? (
              <Loader2 size={16} className="mr-2 animate-spin" />
            ) : (
              <RefreshCcw size={16} className="mr-2" />
            )}
            Refresh
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={readOnly || isLoading || isUpdating || !restaurantId}
            className="h-[42px] rounded-[12px] bg-primary px-5 text-white hover:bg-primary/90"
          >
            {isUpdating ? (
              <Loader2 size={16} className="mr-2 animate-spin" />
            ) : (
              <Save size={16} className="mr-2" />
            )}
            {readOnly ? "Read Only" : "Save Settings"}
          </Button>
        </div>
      </div>

      {readOnly ? (
        <div className="mt-4 rounded-[14px] border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Branch admins can review the loyalty program and customer balances. Program edits stay restricted to restaurant admins.
        </div>
      ) : null}

      {isLoading ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-[90px] animate-pulse rounded-[16px] bg-gray-100"
            />
          ))}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
            />
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5 rounded-[18px] border border-gray-100 bg-white p-4">
          <Field
            label="Points Per Currency Unit"
            helper="How many points a customer earns per 1 currency unit spent."
            value={form.pointsPerCurrencyUnit}
            onChange={(value) => update("pointsPerCurrencyUnit", value)}
            disabled={readOnly}
          />

          <Field
            label="Currency Amount Per Point"
            helper="How much currency spend is required to generate one point."
            value={form.currencyAmountPerPoint}
            onChange={(value) => update("currencyAmountPerPoint", value)}
            disabled={readOnly}
          />

          <Field
            label="Redemption Value Per Point"
            helper="Currency value received when one point is redeemed."
            value={form.redemptionValuePerPoint}
            onChange={(value) => update("redemptionValuePerPoint", value)}
            disabled={readOnly}
          />

          <Field
            label="Minimum Redeem Points"
            helper="Minimum points required before customer can redeem."
            value={form.minimumRedeemPoints}
            onChange={(value) => update("minimumRedeemPoints", value)}
            disabled={readOnly}
          />

          <Field
            label="Points Expiry Days"
            helper="Number of days after which loyalty points expire. Use 0 if expiry is disabled."
            value={form.pointsExpiryDays}
            onChange={(value) => update("pointsExpiryDays", value)}
            disabled={readOnly}
          />
        </div>

        <div className="space-y-4 rounded-[18px] border border-gray-100 bg-white p-4">
          <div className="rounded-[16px] border border-primary/10 bg-primary/[0.04] p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
                <Wallet size={18} />
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-950">
                  Program Controls
                </p>
                <p className="mt-1 text-xs leading-5 text-gray-600">
                  Enable or disable earning, wallet conversion, and order
                  discount usage.
                </p>
              </div>
            </div>
          </div>

          <ToggleRow
            title="Program Active"
            description="Customers can earn and redeem loyalty points."
            checked={form.isActive}
            onChange={(checked) => update("isActive", checked)}
            disabled={readOnly}
          />

          <ToggleRow
            title="Allow Wallet Conversion"
            description="Customers can convert loyalty points into wallet balance."
            checked={form.allowWalletConversion}
            onChange={(checked) => update("allowWalletConversion", checked)}
            disabled={readOnly}
          />

          <ToggleRow
            title="Allow Order Discount"
            description="Customers can use loyalty points as order discounts."
            checked={form.allowOrderDiscount}
            onChange={(checked) => update("allowOrderDiscount", checked)}
            disabled={readOnly}
          />
        </div>
      </div>
    </section>
  );
}