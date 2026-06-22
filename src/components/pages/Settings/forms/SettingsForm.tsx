"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard, Info, Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import {
  useRestaurantStripeAccount,
  useUpdateRestaurantStripeAccount,
} from "@/hooks/useStripeAccounts";
import { getApiErrorMessage } from "@/lib/errors";
import type { PaymentMethod } from "@/types/payment-methods";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  settingsSchema,
  type SettingsFormValues,
} from "@/validations/settings";

const defaultValues: SettingsFormValues = {
  globalTaxPercentage: "",
  taxHandlingRule: "inclusive",
  defaultCommissionPercentage: "",
  defaultHybridFeePercentage: "",
  defaultPlatformCurrency: "",
  currencyFormat: "prefix",
  defaultPlatformLanguage: "",
  dateFormat: "dd/mm/yyyy",
  timezone: "",
  primaryColor: "",
  secondaryColor: "",
  fontSelection: "",
};

const sidebarItems = [
  { label: "Tax Settings", className: "" },
  { label: "Commission Settings", className: "absolute top-88" },
  { label: "Currency Settings", className: "absolute top-143" },
  { label: "Localization Settings", className: "absolute bottom-143" },
  { label: "Branding (Quick Setup)", className: "absolute bottom-70" },
];

const taxRules = [
  { id: "tax-rule-inclusive", value: "inclusive", label: "Prices are inclusive of tax" },
  { id: "tax-rule-exclusive", value: "exclusive", label: "Prices are exclusive of tax" },
  {
    id: "tax-rule-completed",
    value: "completed",
    label: "Tax applies only to completed transactions",
  },
];

const currencyFormats = [
  { label: "$1,000.00", value: "prefix" },
  { label: "1,000.00 USD", value: "suffix" },
  { label: "USD 1,000.00", value: "iso" },
];

const dateFormats = [
  { label: "DD/MM/YYYY", value: "dd/mm/yyyy" },
  { label: "MM/DD/YYYY", value: "mm/dd/yyyy" },
  { label: "YYYY-MM-DD", value: "yyyy-mm-dd" },
];

const paymentMethodLabels: Record<string, string> = {
  COD: "Cash on delivery",
  CARD_ON_DELIVERY: "Card on delivery",
  PAYPAL: "PayPal",
  STRIPE: "Stripe online payment",
  EASYPAISA: "Easypaisa",
  JAZZCASH: "JazzCash",
  BANK_TRANSFER: "Bank transfer",
  WALLET: "Customer wallet",
};

const formGroupClassName = "space-y-[6px]";
const textInputClassName = "border-[#BBBBBB] focus:border-primary";
const selectTriggerClassName = "h-[52px] border-[#BBBBBB] focus:border-primary";
const sidebarItemClassName = "flex items-center gap-[12px] cursor-pointer";
const sidebarLabelClassName =
  "text-base font-semibold text-[#646982] group-hover:text-primary transition-colors";

export default function SettingsForm() {
  const { isBranchAdmin, isRestaurantAdmin, restaurantId } = useAuth();
  const canViewPaymentMethods = isBranchAdmin || isRestaurantAdmin;
  const paymentMethodsQuery = usePaymentMethods(canViewPaymentMethods);
  const { handleSubmit, register, setValue, watch } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues,
  });

  const currencyFormat = watch("currencyFormat");
  const dateFormat = watch("dateFormat");
  const taxHandlingRule = watch("taxHandlingRule");
  const defaultPlatformCurrency = watch("defaultPlatformCurrency");
  const defaultPlatformLanguage = watch("defaultPlatformLanguage");
  const timezone = watch("timezone");
  const fontSelection = watch("fontSelection");

  const onSubmit = (values: SettingsFormValues) => {
    void values;
  };

  return (
    <form
      className="flex flex-col lg:grid lg:grid-cols-12 gap-[48px] p-4 lg:p-[30px] bg-white rounded-[14px]"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="hidden lg:block lg:col-span-4 space-y-8 relative">
        {sidebarItems.map(({ label, className }) => (
          <div key={label} className={`${sidebarItemClassName} ${className}`}>
            <Info size={18} className="text-gray" />
            <span className={sidebarLabelClassName}>{label}</span>
          </div>
        ))}
      </div>

      <div className="lg:col-span-8 space-y-[48px]">
        <section className="space-y-[24px]">
          <div className={formGroupClassName}>
            <Label htmlFor="global-tax-percentage">Global Tax %</Label>
            <p className="text-sm text-gray mb-2">
              Set the default tax percentage applied to transactions across the platform.
            </p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark font-medium">
                %
              </span>
              <Input
                id="global-tax-percentage"
                placeholder="Add Percentage"
                className={`pl-8 ${textInputClassName}`}
                {...register("globalTaxPercentage")}
              />
            </div>
          </div>

          <div className={formGroupClassName}>
            <Label id="tax-handling-rule-label">VAT/GST handling rules</Label>
            <p className="text-sm text-gray">
              Choose how VAT/GST should be calculated and displayed system-wide.
            </p>
            <RadioGroup
              aria-labelledby="tax-handling-rule-label"
              value={taxHandlingRule}
              onValueChange={(value) => setValue("taxHandlingRule", value, { shouldDirty: true })}
              className="space-y-[24px]"
            >
              {taxRules.map(({ id, value, label }) => (
                <div key={value} className="flex items-center gap-3">
                  <RadioGroupItem id={id} value={value} className="border-dark" />
                  <Label htmlFor={id}>{label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </section>

        <section className="space-y-[24px]">
          <FormGroup
            id="default-commission-percentage"
            label="Default Commission (%)"
            placeholder="Add Percentage"
            prefix="%"
            registration={register("defaultCommissionPercentage")}
          />
          <FormGroup
            id="default-hybrid-fee-percentage"
            label="Default Hybrid Fee (%)"
            placeholder="Add Percentage"
            prefix="%"
            registration={register("defaultHybridFeePercentage")}
          />
        </section>

        <section className="space-y-[24px]">
          <div className={formGroupClassName}>
            <Label htmlFor="default-platform-currency">Default Platform Currency</Label>
            <p className="text-sm text-gray mb-2">
              This currency will be used as the default for all monetary values.
            </p>
            <Select
              value={defaultPlatformCurrency}
              onValueChange={(value) =>
                setValue("defaultPlatformCurrency", value, { shouldDirty: true })
              }
            >
              <SelectTrigger id="default-platform-currency" className="h-[52px] border-[#BBBBBB]">
                <div className="flex items-center gap-2">
                  <span className="text-dark">$</span>
                  <SelectValue placeholder="Select Currency" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usd">USD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-[12px]">
            <Label id="currency-display-format-label">Currency Display Format</Label>
            <div
              aria-labelledby="currency-display-format-label"
              className="grid grid-cols-3 gap-4"
              role="group"
            >
              {currencyFormats.map(({ label, value }) => (
                <FormatBtn
                  key={value}
                  label={label}
                  active={currencyFormat === value}
                  onClick={() => setValue("currencyFormat", value, { shouldDirty: true })}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-[24px]">
          <FormGroup
            id="default-platform-language"
            label="Default Platform Language"
            type="select"
            placeholder="Select Language"
            value={defaultPlatformLanguage}
            onValueChange={(value) =>
              setValue("defaultPlatformLanguage", value, { shouldDirty: true })
            }
          />

          <div className="space-y-[12px]">
            <Label id="date-format-label">Date Format</Label>
            <div aria-labelledby="date-format-label" className="grid grid-cols-3 gap-2" role="group">
              {dateFormats.map(({ label, value }) => (
                <FormatBtn
                  key={value}
                  label={label}
                  active={dateFormat === value}
                  onClick={() => setValue("dateFormat", value, { shouldDirty: true })}
                />
              ))}
            </div>
          </div>

          <FormGroup
            id="timezone"
            label="Timezone"
            type="select"
            placeholder="Select Timezone"
            value={timezone}
            onValueChange={(value) => setValue("timezone", value, { shouldDirty: true })}
          />
        </section>

        <section className="space-y-[24px]">
          <div className="grid grid-cols-2 gap-[24px]">
            <ColorField
              id="primary-color"
              label="Primary Color"
              swatchClassName="bg-primary"
              registration={register("primaryColor")}
            />
            <ColorField
              id="secondary-color"
              label="Secondary Color"
              swatchClassName="bg-black"
              registration={register("secondaryColor")}
            />
          </div>
          <FormGroup
            id="font-selection"
            label="Font Selection (Optional)"
            type="select"
            placeholder="Select font"
            value={fontSelection}
            onValueChange={(value) => setValue("fontSelection", value, { shouldDirty: true })}
          />
        </section>

        {canViewPaymentMethods ? (
          <PaymentMethodsSection
            isError={paymentMethodsQuery.isError}
            isLoading={paymentMethodsQuery.isLoading}
            error={paymentMethodsQuery.error}
            methods={paymentMethodsQuery.data?.paymentMethods ?? []}
          />
        ) : null}

        {isRestaurantAdmin ? (
          <StripeAccountSection restaurantId={restaurantId} />
        ) : null}

        <section className="flex flex-col sm:flex-row gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            className="h-[52px] px-10 rounded-[10px] text-dark border-gray-200"
          >
            Cancel
          </Button>
          <Button type="submit" variant="default" className="h-[52px] px-10 rounded-[10px]">
            Save & Activate
          </Button>
        </section>
      </div>
    </form>
  );
}

function StripeAccountSection({
  restaurantId,
}: {
  restaurantId?: string | null;
}) {
  const accountQuery = useRestaurantStripeAccount(restaurantId);
  const updateAccount = useUpdateRestaurantStripeAccount();
  const [accountId, setAccountId] = useState("");
  const [dashboardUrl, setDashboardUrl] = useState("");
  const [note, setNote] = useState("");
  const [chargesEnabled, setChargesEnabled] = useState(false);
  const [payoutsEnabled, setPayoutsEnabled] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const stripe = accountQuery.data?.data.stripe;

  useEffect(() => {
    if (!stripe) return;
    setAccountId(stripe.accountId ?? "");
    setDashboardUrl(stripe.dashboardUrl ?? "");
    setNote(stripe.note ?? "");
    setChargesEnabled(Boolean(stripe.chargesEnabled));
    setPayoutsEnabled(Boolean(stripe.payoutsEnabled));
    setOnboardingComplete(Boolean(stripe.onboardingComplete));
  }, [stripe]);

  const submit = () => {
    if (!restaurantId) return;

    updateAccount.mutate({
      restaurantId,
      payload: {
        accountId: accountId.trim() || null,
        dashboardUrl: dashboardUrl.trim() || null,
        note: note.trim() || null,
        chargesEnabled,
        payoutsEnabled,
        onboardingComplete,
      },
    });
  };

  return (
    <section className="space-y-[18px] rounded-[14px] border border-[#E8E8E8] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-[6px]">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-primary" />
            <h2 className="text-lg font-semibold text-dark">
              Stripe Account
            </h2>
          </div>
          <p className="text-sm text-gray">
            Manage the connected Stripe account used for online payments and
            restaurant payouts.
          </p>
        </div>
        <span
          className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
            stripe?.payoutsEnabled
              ? "bg-green-100 text-green-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {stripe?.payoutsEnabled ? "Payouts enabled" : "Payouts disabled"}
        </span>
      </div>

      {accountQuery.isLoading ? (
        <div className="h-[160px] animate-pulse rounded-[10px] bg-gray-100" />
      ) : null}

      {!accountQuery.isLoading && accountQuery.isError ? (
        <p className="rounded-[10px] bg-red-50 px-3 py-2 text-sm text-red-600">
          {getApiErrorMessage(accountQuery.error, "Unable to load Stripe account.")}
        </p>
      ) : null}

      {!accountQuery.isLoading && !accountQuery.isError ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className={formGroupClassName}>
              <Label htmlFor="stripe-account-id">Stripe account ID</Label>
              <Input
                id="stripe-account-id"
                value={accountId}
                onChange={(event) => setAccountId(event.target.value)}
                placeholder="acct_..."
                className={textInputClassName}
              />
            </div>
            <div className={formGroupClassName}>
              <Label htmlFor="stripe-dashboard-url">Dashboard URL</Label>
              <Input
                id="stripe-dashboard-url"
                value={dashboardUrl}
                onChange={(event) => setDashboardUrl(event.target.value)}
                placeholder="https://dashboard.stripe.com/..."
                className={textInputClassName}
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <StripeSwitch
              label="Charges"
              checked={chargesEnabled}
              onCheckedChange={setChargesEnabled}
            />
            <StripeSwitch
              label="Payouts"
              checked={payoutsEnabled}
              onCheckedChange={setPayoutsEnabled}
            />
            <StripeSwitch
              label="Onboarding"
              checked={onboardingComplete}
              onCheckedChange={setOnboardingComplete}
            />
          </div>

          <div className={formGroupClassName}>
            <Label htmlFor="stripe-note">Internal note</Label>
            <Input
              id="stripe-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Stripe account note"
              className={textInputClassName}
            />
          </div>

          <Button
            type="button"
            onClick={submit}
            disabled={!restaurantId || updateAccount.isPending}
            className="h-[44px] rounded-[10px]"
          >
            {updateAccount.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Save className="mr-2 size-4" />
            )}
            Save Stripe Settings
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function StripeSwitch({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[10px] border border-[#E8E8E8] px-4 py-3">
      <span className="text-sm font-semibold text-dark">{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

type PaymentMethodsSectionProps = {
  methods: PaymentMethod[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
};

function PaymentMethodsSection({
  methods,
  isLoading,
  isError,
  error,
}: PaymentMethodsSectionProps) {
  return (
    <section className="space-y-[18px] rounded-[14px] border border-[#E8E8E8] p-4">
      <div className="space-y-[6px]">
        <h2 className="text-lg font-semibold text-dark">Payment Methods</h2>
        <p className="text-sm text-gray">
          These platform payment methods are managed globally. Your role can view
          available methods but cannot edit them.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`payment-method-skeleton-${index}`}
              className="h-[76px] animate-pulse rounded-[10px] bg-gray-100"
            />
          ))}
        </div>
      ) : null}

      {!isLoading && isError ? (
        <p className="rounded-[10px] bg-red-50 px-3 py-2 text-sm text-red-600">
          {getApiErrorMessage(error, "Unable to load payment methods.")}
        </p>
      ) : null}

      {!isLoading && !isError && methods.length === 0 ? (
        <p className="rounded-[10px] bg-gray-50 px-3 py-3 text-sm text-gray">
          No payment methods found.
        </p>
      ) : null}

      {!isLoading && !isError && methods.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {methods.map((method) => (
            <PaymentMethodItem key={method.code} method={method} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function PaymentMethodItem({ method }: { method: PaymentMethod }) {
  const label = paymentMethodLabels[method.code] ?? method.label;

  return (
    <div className="flex items-center justify-between gap-4 rounded-[10px] border border-[#E8E8E8] px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-dark">{label}</p>
        <p className="mt-1 text-xs font-medium text-gray">{method.code}</p>
      </div>
      <span
        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
          method.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
        }`}
      >
        {method.isActive ? "Active" : "Inactive"}
      </span>
    </div>
  );
}

type FormGroupProps = {
  id: string;
  label: string;
  placeholder: string;
  type?: "text" | "select";
  prefix?: string;
  registration?: ReturnType<typeof useForm<SettingsFormValues>>["register"] extends (
    name: infer Name
  ) => infer Registration
    ? Registration
    : never;
  value?: string;
  onValueChange?: (value: string) => void;
};

function FormGroup({
  id,
  label,
  placeholder,
  type = "text",
  prefix,
  registration,
  value,
  onValueChange,
}: FormGroupProps) {
  return (
    <div className={formGroupClassName}>
      <Label htmlFor={id}>{label}</Label>
      {type === "select" ? (
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger id={id} className={selectTriggerClassName}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="opt1">{placeholder}</SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <div className="relative">
          {prefix ? (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark font-medium">
              {prefix}
            </span>
          ) : null}
          <Input
            id={id}
            placeholder={placeholder}
            className={`${prefix ? "pl-8" : ""} ${textInputClassName}`}
            {...registration}
          />
        </div>
      )}
    </div>
  );
}

type ColorFieldProps = {
  id: string;
  label: string;
  swatchClassName: string;
  registration: ReturnType<typeof useForm<SettingsFormValues>>["register"] extends (
    name: infer Name
  ) => infer Registration
    ? Registration
    : never;
};

function ColorField({ id, label, swatchClassName, registration }: ColorFieldProps) {
  return (
    <div className={formGroupClassName}>
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <div className={`size-[52px] rounded-md shrink-0 ${swatchClassName}`} />
        <div className="relative w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray">#</span>
          <Input
            id={id}
            placeholder="Add Color Code"
            className={`pl-7 ${textInputClassName}`}
            {...registration}
          />
        </div>
      </div>
    </div>
  );
}

function FormatBtn({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-[52px] text-xs lg:text-base rounded-[10px] border transition-all ${
        active ? "border-primary text-primary" : "border-[#BBBBBB] text-gray"
      }`}
    >
      {label}
    </button>
  );
}
