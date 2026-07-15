"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Banknote, CreditCard, Info, Loader2, RefreshCw, Send, Wallet } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import {
  useCreateRestaurantPayoutRequest,
  useRestaurantPayoutRequests,
  useRestaurantWallet,
} from "@/hooks/useRestaurantPaymentManagement";
import { getApiErrorMessage } from "@/lib/errors";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

const formGroupClassName = "space-y-[6px]";
const textInputClassName = "border-[#BBBBBB] focus:border-primary";
const selectTriggerClassName = "h-[52px] border-[#BBBBBB] focus:border-primary";
const sidebarItemClassName = "flex items-center gap-[12px] cursor-pointer";
const sidebarLabelClassName =
  "text-base font-semibold text-[#646982] group-hover:text-primary transition-colors";

type SettingsFormProps = {
  variant?: "global" | "payments";
};

export default function SettingsForm({ variant = "global" }: SettingsFormProps) {
  const { isBranchAdmin, isRestaurantAdmin, restaurantId } = useAuth();
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

  if (variant === "payments") {
    return (
      <div className="space-y-[24px] rounded-[14px] bg-white p-4 lg:p-[30px]">
        {isRestaurantAdmin || isBranchAdmin ? (
          <RestaurantWalletPayoutSection restaurantId={restaurantId} />
        ) : (
          <p className="rounded-[10px] bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Payment settings are available for restaurant and branch admins.
          </p>
        )}
      </div>
    );
  }

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

function RestaurantWalletPayoutSection({
  restaurantId,
}: {
  restaurantId?: string | null;
}) {
  const walletQuery = useRestaurantWallet(restaurantId);
  const payoutRequestsQuery = useRestaurantPayoutRequests(restaurantId);
  const createPayoutRequest = useCreateRestaurantPayoutRequest();
  const { formatMoney: formatCurrency, resolveCurrency } = useCurrency(restaurantId);
  const walletCurrency = resolveCurrency(walletQuery.data?.currency);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(walletCurrency || "PKR");
  const [bankName, setBankName] = useState("");
  const [accountTitle, setAccountTitle] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [iban, setIban] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const parsedAmount = Number(amount);
  const canSubmit =
    Boolean(restaurantId) &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0 &&
    bankName.trim().length > 0 &&
    accountTitle.trim().length > 0 &&
    accountNumber.trim().length > 0 &&
    !createPayoutRequest.isPending;

  useEffect(() => {
    if (walletCurrency && currency === "PKR") {
      setCurrency(walletCurrency);
    }
  }, [currency, walletCurrency]);

  const submit = () => {
    if (!restaurantId || !canSubmit) return;

    createPayoutRequest.mutate(
      {
        restaurantId,
        payload: {
          amount: parsedAmount,
          currency: currency.trim().toUpperCase() || walletCurrency || "PKR",
          bankDetails: {
            bankName: bankName.trim(),
            accountTitle: accountTitle.trim(),
            accountNumber: accountNumber.trim(),
            iban: iban.trim() || undefined,
            phone: phone.trim() || undefined,
          },
          note: note.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          setAmount("");
          setBankName("");
          setAccountTitle("");
          setAccountNumber("");
          setIban("");
          setPhone("");
          setNote("");
        },
      }
    );
  };

  return (
    <section className="space-y-[18px] rounded-[14px] border border-[#E8E8E8] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-[6px]">
          <div className="flex items-center gap-2">
            <Banknote size={18} className="text-primary" />
            <h2 className="text-lg font-semibold text-dark">
              Restaurant Wallet & Payouts
            </h2>
          </div>
          <p className="text-sm text-gray">
            Review the restaurant wallet balance and request a manual bank payout.
            Wallet deductions happen only after Super Admin marks a payout as paid.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            walletQuery.refetch();
            payoutRequestsQuery.refetch();
          }}
          disabled={!restaurantId || walletQuery.isFetching || payoutRequestsQuery.isFetching}
          className="h-[40px] rounded-[10px]"
        >
          {walletQuery.isFetching || payoutRequestsQuery.isFetching ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 size-4" />
          )}
          Refresh
        </Button>
      </div>

      {walletQuery.isError ? (
        <p className="rounded-[10px] bg-red-50 px-3 py-2 text-sm text-red-600">
          {getApiErrorMessage(walletQuery.error, "Unable to load restaurant wallet.")}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <PaymentSummaryCard
          icon={<Wallet size={18} />}
          label="Wallet balance"
          value={
            walletQuery.isLoading
              ? "Loading..."
              : formatOptionalMoney(walletQuery.data?.balance ?? null, walletCurrency, formatCurrency)
          }
        />
        <PaymentSummaryCard
          icon={<CreditCard size={18} />}
          label="Wallet type"
          value={walletQuery.data?.type || "Restaurant wallet"}
        />
        <PaymentSummaryCard
          icon={<Info size={18} />}
          label="Customer wallet exposure"
          value={formatRecordAmount(
            walletQuery.data?.customerWalletExposure,
            walletCurrency,
            formatCurrency
          )}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1.1fr]">
        <div className="space-y-4 rounded-[12px] bg-gray-50 p-4">
          <div>
            <h3 className="text-sm font-semibold text-dark">Request payout</h3>
            <p className="mt-1 text-xs text-gray">
              Submit bank details for Super Admin approval and external transfer.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
            <div className={formGroupClassName}>
              <Label htmlFor="payout-amount">Amount</Label>
              <Input
                id="payout-amount"
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="5000"
                className={textInputClassName}
              />
            </div>
            <div className={formGroupClassName}>
              <Label htmlFor="payout-currency">Currency</Label>
              <Input
                id="payout-currency"
                value={currency}
                onChange={(event) => setCurrency(event.target.value.toUpperCase())}
                placeholder={walletCurrency || "PKR"}
                className={textInputClassName}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <PayoutInput id="payout-bank" label="Bank name" value={bankName} onChange={setBankName} placeholder="HBL" />
            <PayoutInput id="payout-title" label="Account title" value={accountTitle} onChange={setAccountTitle} placeholder="Pizza House" />
            <PayoutInput id="payout-number" label="Account number" value={accountNumber} onChange={setAccountNumber} placeholder="1234567890" />
            <PayoutInput id="payout-iban" label="IBAN (optional)" value={iban} onChange={setIban} placeholder="PK36..." />
            <PayoutInput id="payout-phone" label="Phone (optional)" value={phone} onChange={setPhone} placeholder="03410000000" />
          </div>
          <div className={formGroupClassName}>
            <Label htmlFor="payout-note">Note</Label>
            <Textarea
              id="payout-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Please transfer payout"
              className="min-h-[84px] border-[#BBBBBB] focus:border-primary"
            />
          </div>
          <Button type="button" onClick={submit} disabled={!canSubmit} className="h-[44px] rounded-[10px]">
            {createPayoutRequest.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Send className="mr-2 size-4" />
            )}
            Submit Payout Request
          </Button>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-dark">Payout requests</h3>
          {payoutRequestsQuery.isLoading ? (
            <div className="h-[180px] animate-pulse rounded-[10px] bg-gray-100" />
          ) : null}
          {payoutRequestsQuery.isError ? (
            <p className="rounded-[10px] bg-red-50 px-3 py-2 text-sm text-red-600">
              {getApiErrorMessage(payoutRequestsQuery.error, "Unable to load payout requests.")}
            </p>
          ) : null}
          {!payoutRequestsQuery.isLoading && !payoutRequestsQuery.isError ? (
            payoutRequestsQuery.data?.length ? (
              <div className="overflow-hidden rounded-[10px] border border-[#E8E8E8]">
                {payoutRequestsQuery.data.slice(0, 8).map((request) => (
                  <div key={request.id} className="space-y-2 border-b border-[#E8E8E8] px-4 py-3 last:border-b-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-dark">
                        {formatCurrency(request.amount, request.currency || walletCurrency)}
                      </span>
                      <PayoutStatusBadge status={request.status || "REQUESTED"} />
                    </div>
                    <p className="text-xs text-gray">
                      {formatBankDetails(request.bankDetails)}
                    </p>
                    {request.paymentReference ? (
                      <p className="text-xs font-medium text-dark">
                        Reference: {request.paymentReference}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-[10px] bg-gray-50 px-3 py-3 text-sm text-gray">
                No payout requests submitted yet.
              </p>
            )
          ) : null}
        </div>
      </div>
    </section>
  );
}

function PayoutInput({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className={formGroupClassName}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={textInputClassName}
      />
    </div>
  );
}

function PayoutStatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toUpperCase();
  const className =
    normalizedStatus === "APPROVED" || normalizedStatus === "PAID"
      ? "bg-green-100 text-green-700"
      : normalizedStatus === "REJECTED"
        ? "bg-red-100 text-red-700"
        : "bg-amber-100 text-amber-700";

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>
      {normalizedStatus}
    </span>
  );
}

function formatBankDetails(bankDetails: Record<string, unknown>) {
  const values = [
    bankDetails.bankName,
    bankDetails.accountTitle,
    bankDetails.accountNumber,
    bankDetails.iban,
  ]
    .filter(Boolean)
    .map(String);

  return values.length ? values.join(" · ") : "Bank details unavailable";
}

function PaymentSummaryCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[10px] border border-[#E8E8E8] px-4 py-3">
      <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold leading-5 text-dark">{value}</p>
    </div>
  );
}

function formatOptionalMoney(
  amount: number | null,
  currency: string | null,
  formatCurrency: (amount?: number | string | null, currencyOverride?: string | null) => string
) {
  if (amount === null) return "Not available";

  return formatCurrency(amount, currency);
}

function getRecordNumber(
  record: Record<string, unknown> | null | undefined,
  keys: string[]
) {
  for (const key of keys) {
    const value = record?.[key];
    const parsed = Number(value);

    if (Number.isFinite(parsed)) return parsed;
  }

  return null;
}

function formatRecordAmount(
  record: Record<string, unknown> | null | undefined,
  currency: string | null,
  formatCurrency: (amount?: number | string | null, currencyOverride?: string | null) => string
) {
  return formatOptionalMoney(
    getRecordNumber(record, [
      "balance",
      "totalBalance",
      "totalExposure",
      "amount",
      "walletAmount",
    ]),
    currency,
    formatCurrency
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
