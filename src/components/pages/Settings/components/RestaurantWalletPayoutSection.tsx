"use client";

import {
  Banknote,
  CalendarClock,
  CreditCard,
  Info,
  Loader2,
  RefreshCw,
  Send,
  Wallet,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCurrency } from "@/hooks/useCurrency";
import {
  useCreateRestaurantPayoutRequest,
  useRestaurantPayoutRequests,
  useRestaurantPayoutProviderRequests,
  useRestaurantWallet,
} from "@/hooks/useRestaurantPaymentManagement";
import { getApiErrorMessage } from "@/lib/errors";
import {
  getApprovedPayoutProviders,
  getDirectCollectedAmount,
  getWalletReconciliation,
} from "./wallet-payout.helpers";

const formGroupClassName = "space-y-1.5";
const textInputClassName = "min-h-11 border-[#BBBBBB] focus:border-primary";

export function RestaurantWalletPayoutSection({
  restaurantId,
  canRequestPayout,
}: {
  restaurantId?: string | null;
  canRequestPayout: boolean;
}) {
  const t = useTranslations("settings.walletPayout");
  const locale = useLocale();
  const walletQuery = useRestaurantWallet(restaurantId);
  const payoutRequestsQuery = useRestaurantPayoutRequests(restaurantId);
  const providerSettingsQuery =
    useRestaurantPayoutProviderRequests(restaurantId);
  const createPayoutRequest = useCreateRestaurantPayoutRequest();
  const { formatMoney, resolveCurrency } = useCurrency(restaurantId);
  const wallet = walletQuery.data;
  const walletCurrency = resolveCurrency(wallet?.currency);
  const reconciliation = getWalletReconciliation(wallet);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(walletCurrency || "EUR");
  const [bankName, setBankName] = useState("");
  const [accountTitle, setAccountTitle] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [iban, setIban] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const parsedAmount = Number(amount);
  const canSubmit =
    canRequestPayout &&
    Boolean(restaurantId) &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0 &&
    parsedAmount <= (wallet?.availablePayoutBalance ?? 0) &&
    bankName.trim().length > 0 &&
    accountTitle.trim().length > 0 &&
    accountNumber.trim().length > 0 &&
    !createPayoutRequest.isPending;

  const providerConfigurations =
    providerSettingsQuery.data?.configurations ?? [];
  const approvedProviders = getApprovedPayoutProviders(providerConfigurations);
  const enabledProvider = providerConfigurations.find(
    (configuration) => configuration.enabled,
  );
  const manualRequestsBlocked = approvedProviders.length > 0;
  const automaticPayout = wallet?.automaticPayout;
  const automaticEnabled = automaticPayout?.enabled ?? Boolean(enabledProvider);
  const automaticProvider =
    automaticPayout?.provider ?? enabledProvider?.provider ?? null;
  const automaticStatus =
    automaticPayout?.status ?? (enabledProvider ? "READY" : "MANUAL");
  const providerLabel = (provider?: string | null) => {
    const normalized = provider?.toUpperCase();
    if (normalized === "STRIPE") return t("providers.stripe");
    if (normalized === "PAYPAL") return t("providers.paypal");
    return t("providers.unknown");
  };
  const statusLabel = (status?: string | null) => {
    const normalized = status?.toUpperCase();
    if (["READY", "ACTIVE", "ENABLED"].includes(normalized || ""))
      return t("statuses.ready");
    if (["PENDING", "REQUESTED"].includes(normalized || ""))
      return t("statuses.pending");
    if (["BLOCKED", "DISABLED", "REJECTED"].includes(normalized || ""))
      return t("statuses.blocked");
    if (normalized === "MANUAL") return t("statuses.manual");
    return t("statuses.unknown");
  };
  const reasonLabel = (reason?: string | null) => {
    if (!reason) return t("reasons.none");
    const normalized = reason.trim().toUpperCase();
    if (normalized.includes("CREDENTIAL"))
      return t("reasons.credentialsMissing");
    if (normalized.includes("CONFIG"))
      return t("reasons.configurationIncomplete");
    if (normalized.includes("DISABLED")) return t("reasons.providerDisabled");
    return t("reasons.unknown");
  };
  const approvedProviderNames = [
    ...new Set(approvedProviders.map((item) => providerLabel(item.provider))),
  ];
  const blockedReasonKey =
    approvedProviders.length > 1
      ? "providerBlock.multiple"
      : approvedProviders[0]?.provider === "PAYPAL"
        ? "providerBlock.paypal"
        : "providerBlock.single";

  useEffect(() => {
    if (walletCurrency && currency === "EUR") setCurrency(walletCurrency);
  }, [currency, walletCurrency]);

  const money = (value: number | null | undefined) =>
    value === null || value === undefined
      ? t("notAvailable")
      : formatMoney(value, walletCurrency);
  const date = (value?: string | null, withTime = false) => {
    if (!value) return t("notAvailable");
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return t("notAvailable");
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      ...(withTime ? { timeStyle: "short" as const } : {}),
    }).format(parsed);
  };

  const submit = () => {
    if (!restaurantId || !canSubmit) return;
    createPayoutRequest.mutate(
      {
        restaurantId,
        payload: {
          amount: parsedAmount,
          currency: currency.trim().toUpperCase() || walletCurrency || "EUR",
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
      },
    );
  };

  return (
    <TooltipProvider>
      <section
        className="space-y-5 rounded-[14px] border border-[#E8E8E8] p-4 lg:p-5"
        aria-labelledby="wallet-payout-title"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Banknote size={20} className="text-primary" aria-hidden="true" />
              <h2
                id="wallet-payout-title"
                className="text-xl font-semibold text-dark"
              >
                {t("title")}
              </h2>
            </div>
            <p className="max-w-3xl text-sm leading-6 text-gray">
              {t("description")}
            </p>
            {wallet?.billingPeriod ? (
              <p className="text-xs font-medium text-gray">
                {t("currentPeriodDates", {
                  from: date(wallet.billingPeriod.from),
                  to: date(wallet.billingPeriod.to),
                })}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void walletQuery.refetch();
              void payoutRequestsQuery.refetch();
              void providerSettingsQuery.refetch();
            }}
            disabled={
              !restaurantId ||
              walletQuery.isFetching ||
              payoutRequestsQuery.isFetching
            }
            className="min-h-11 rounded-[10px]"
          >
            {walletQuery.isFetching || payoutRequestsQuery.isFetching ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 size-4" />
            )}
            {t("refresh")}
          </Button>
        </div>

        {walletQuery.isError ? (
          <p
            role="alert"
            className="rounded-[10px] bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {getApiErrorMessage(walletQuery.error, t("loadError"))}
          </p>
        ) : null}

        <WalletGroup
          title={t("groups.allPeriods")}
          subtitle={t("groups.allPeriodsSubtitle")}
        >
          <Metric
            icon={<Wallet size={18} />}
            label={t("metrics.available")}
            value={
              walletQuery.isLoading
                ? t("loading")
                : money(reconciliation.available)
            }
            hint={t("hints.available")}
            strong
          />
          <Metric
            icon={<Banknote size={18} />}
            label={t("metrics.ledger")}
            value={money(reconciliation.ledger)}
            hint={t("hints.ledger")}
          />
          <Metric
            icon={<RefreshCw size={18} />}
            label={t("metrics.carryForward")}
            value={money(reconciliation.carryForward.amount)}
            hint={t("hints.carryForward")}
          />
          <p className="sm:col-span-2 xl:col-span-3 rounded-xl bg-primary/5 px-4 py-3 text-xs leading-5 text-gray-700">
            {t("reconciliation", {
              carry: money(reconciliation.carryForward.amount),
              current: money(reconciliation.currentPeriod.amount),
              available: money(reconciliation.available),
            })}
          </p>
        </WalletGroup>

        <WalletGroup
          title={t("groups.currentPeriod")}
          subtitle={t("groups.currentPeriodSubtitle")}
        >
          <Metric
            icon={<Banknote size={18} />}
            label={t("metrics.orders")}
            value={money(wallet?.totalOrderAmount)}
            hint={t("hints.orders")}
          />
          <Metric
            icon={<CreditCard size={18} />}
            label={t("metrics.platformHeld")}
            value={money(
              wallet?.platformCollectedAmount ?? wallet?.grossCollectedAmount,
            )}
            hint={t("hints.platformHeld")}
          />
          <Metric
            icon={<Info size={18} />}
            label={t("metrics.directCollected")}
            value={money(getDirectCollectedAmount(wallet))}
            hint={t("hints.directCollected")}
          />
          <Metric
            icon={<Info size={18} />}
            label={t("metrics.commission")}
            value={money(wallet?.commissionLiabilityAmount)}
            hint={t("hints.commission")}
          />
          <Metric
            icon={<Info size={18} />}
            label={t("metrics.vat", {
              rate:
                wallet?.vatPercentage ?? wallet?.activePlan?.vatPercentage ?? 0,
            })}
            value={money(wallet?.vatAmount)}
            hint={t("hints.vat")}
          />
          <Metric
            icon={<Banknote size={18} />}
            label={t("metrics.netContribution")}
            value={money(reconciliation.currentPeriod.amount)}
            hint={t("hints.netContribution")}
            strong
          />
        </WalletGroup>

        <WalletGroup
          title={t("groups.nextPayoutFee")}
          subtitle={t("groups.nextPayoutFeeSubtitle")}
        >
          <Metric
            icon={<Wallet size={18} />}
            label={t("metrics.payoutEstimate")}
            value={money(wallet?.availablePayoutBalance)}
            hint={t("hints.payoutEstimate")}
            strong
          />
          <Metric
            icon={<CalendarClock size={18} />}
            label={t("metrics.nextPayout")}
            value={date(wallet?.nextPayoutAt, true)}
            hint={t("hints.cadence", {
              cadence: prettyLabel(wallet?.payoutCycle),
            })}
          />
          <Metric
            icon={<CreditCard size={18} />}
            label={t("metrics.automaticPayout")}
            value={
              automaticProvider
                ? providerLabel(automaticProvider)
                : t("manualPayout")
            }
            hint={
              automaticPayout?.reason
                ? reasonLabel(automaticPayout.reason)
                : t("automaticStatus", { status: statusLabel(automaticStatus) })
            }
            tone={automaticEnabled ? "success" : "neutral"}
          />
          <Metric
            icon={<Banknote size={18} />}
            label={t("metrics.configuredFee")}
            value={money(
              wallet?.configuredMonthlyFeeAmount ?? wallet?.monthlyFeeAmount,
            )}
            hint={t("hints.configuredFee")}
          />
          <Metric
            icon={<Banknote size={18} />}
            label={t("metrics.collectedFee")}
            value={money(wallet?.monthlyFeeDeductedThisMonth)}
            hint={t("hints.collectedFee", {
              scheduled: money(wallet?.monthlyFeeScheduledToDate),
            })}
          />
          <Metric
            icon={<CalendarClock size={18} />}
            label={t("metrics.dueNext")}
            value={money(wallet?.monthlyFeeDueNextPayoutAmount)}
            hint={t("hints.dueNext")}
          />
          <Metric
            icon={<Info size={18} />}
            label={t("metrics.outstandingFee")}
            value={money(wallet?.monthlyFeeOutstandingAmount)}
            hint={t("hints.outstandingFee")}
          />
        </WalletGroup>

        <section
          className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4"
          aria-labelledby="customer-wallet-exposure-title"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-lg bg-amber-100 p-2 text-amber-800">
              <Wallet size={18} />
            </div>
            <div className="min-w-0">
              <h3
                id="customer-wallet-exposure-title"
                className="font-semibold text-amber-950"
              >
                {t("customerExposure.title")}
              </h3>
              <p className="mt-1 text-sm leading-5 text-amber-900">
                {t("customerExposure.description")}
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Metric
              label={t("customerExposure.total")}
              value={money(wallet?.customerWalletExposure?.totalBalance)}
            />
            <Metric
              label={t("customerExposure.accounts")}
              value={
                wallet?.customerWalletExposure?.accountCount === null ||
                wallet?.customerWalletExposure?.accountCount === undefined
                  ? t("notAvailable")
                  : String(wallet.customerWalletExposure.accountCount)
              }
            />
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[1fr_1.1fr]">
          {providerSettingsQuery.isLoading ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">
                {t("providerBlock.checkingTitle")}
              </h3>
              <p className="mt-1 text-sm text-slate-700">
                {t("providerBlock.checkingDescription")}
              </p>
            </div>
          ) : providerSettingsQuery.isError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <h3 className="font-semibold text-red-900">
                {t("providerBlock.unavailableTitle")}
              </h3>
              <p className="mt-1 text-sm text-red-800">
                {t("providerBlock.unavailableDescription")}
              </p>
              <p className="mt-2 text-sm font-medium text-red-900">
                {t("providerBlock.nextAction")}
              </p>
            </div>
          ) : manualRequestsBlocked ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="font-semibold text-amber-950">
                {t("providerBlock.title")}
              </h3>
              <p className="mt-1 text-sm leading-5 text-amber-900">
                {t(blockedReasonKey, {
                  providers: approvedProviderNames.join(", "),
                })}
              </p>
              <p className="mt-2 text-sm font-medium text-amber-950">
                {t("providerBlock.nextAction")}
              </p>
            </div>
          ) : automaticEnabled ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <h3 className="font-semibold text-emerald-900">
                {t("automaticReadyTitle")}
              </h3>
              <p className="mt-1 text-sm leading-5 text-emerald-800">
                {t("automaticReadyDescription", {
                  provider: providerLabel(automaticProvider),
                })}
              </p>
            </div>
          ) : (
            <div className="space-y-4 rounded-xl bg-gray-50 p-4">
              <div>
                <h3 className="font-semibold text-dark">
                  {t("request.title")}
                </h3>
                <p className="mt-1 text-sm text-gray">
                  {t("request.description")}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                <PayoutInput
                  id="payout-amount"
                  label={t("request.amount")}
                  value={amount}
                  onChange={setAmount}
                  placeholder="500"
                  inputMode="decimal"
                />
                <PayoutInput
                  id="payout-currency"
                  label={t("request.currency")}
                  value={currency}
                  onChange={(value) => setCurrency(value.toUpperCase())}
                  placeholder={walletCurrency || "EUR"}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <PayoutInput
                  id="payout-bank"
                  label={t("request.bankName")}
                  value={bankName}
                  onChange={setBankName}
                  placeholder="Bank"
                />
                <PayoutInput
                  id="payout-title"
                  label={t("request.accountTitle")}
                  value={accountTitle}
                  onChange={setAccountTitle}
                  placeholder={t("request.accountTitle")}
                />
                <PayoutInput
                  id="payout-number"
                  label={t("request.accountNumber")}
                  value={accountNumber}
                  onChange={setAccountNumber}
                  placeholder="1234567890"
                />
                <PayoutInput
                  id="payout-iban"
                  label={t("request.iban")}
                  value={iban}
                  onChange={setIban}
                  placeholder="DE00..."
                />
                <PayoutInput
                  id="payout-phone"
                  label={t("request.phone")}
                  value={phone}
                  onChange={setPhone}
                  placeholder="+49..."
                />
              </div>
              <div className={formGroupClassName}>
                <Label htmlFor="payout-note">{t("request.note")}</Label>
                <Textarea
                  id="payout-note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder={t("request.notePlaceholder")}
                  className="min-h-20 border-[#BBBBBB] focus:border-primary"
                />
              </div>
              <Button
                type="button"
                onClick={submit}
                disabled={!canSubmit}
                className="min-h-11 rounded-[10px]"
              >
                {createPayoutRequest.isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Send className="mr-2 size-4" />
                )}
                {t("request.submit")}
              </Button>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="font-semibold text-dark">{t("requests.title")}</h3>
            {payoutRequestsQuery.isLoading ? (
              <div className="h-44 animate-pulse rounded-xl bg-gray-100" />
            ) : null}
            {payoutRequestsQuery.isError ? (
              <p
                role="alert"
                className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {getApiErrorMessage(
                  payoutRequestsQuery.error,
                  t("requests.loadError"),
                )}
              </p>
            ) : null}
            {!payoutRequestsQuery.isLoading && !payoutRequestsQuery.isError ? (
              payoutRequestsQuery.data?.length ? (
                <div className="overflow-hidden rounded-xl border border-[#E8E8E8]">
                  {payoutRequestsQuery.data.slice(0, 8).map((request) => (
                    <div
                      key={request.id}
                      className="space-y-2 border-b border-[#E8E8E8] px-4 py-3 last:border-b-0"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-dark">
                          {formatMoney(
                            request.amount,
                            request.currency || walletCurrency,
                          )}
                        </span>
                        <StatusBadge status={request.status || "REQUESTED"} />
                      </div>
                      <p className="text-xs text-gray">
                        {formatBankDetails(
                          request.bankDetails,
                          t("requests.bankUnavailable"),
                        )}
                      </p>
                      {request.paymentReference ? (
                        <p className="text-xs font-medium text-dark">
                          {t("requests.reference", {
                            reference: request.paymentReference,
                          })}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl bg-gray-50 px-3 py-3 text-sm text-gray">
                  {t("requests.empty")}
                </p>
              )
            ) : null}
          </div>
        </div>
      </section>
    </TooltipProvider>
  );
}

function WalletGroup({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-2xl border border-[#EEF0F4] bg-[#FAFBFC] p-4">
      <div>
        <h3 className="text-base font-semibold text-dark">{title}</h3>
        <p className="mt-1 text-sm text-gray">{subtitle}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  );
}

function Metric({
  icon,
  label,
  value,
  hint,
  strong = false,
  tone = "neutral",
}: {
  icon?: ReactNode;
  label: string;
  value: string;
  hint?: string;
  strong?: boolean;
  tone?: "neutral" | "success";
}) {
  return (
    <article
      className={`rounded-xl border bg-white p-4 ${tone === "success" ? "border-emerald-200" : "border-[#E8E8E8]"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray">
          {label}
        </p>
        {hint ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-gray hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={label}
              >
                <Info size={15} />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-sm">{hint}</TooltipContent>
          </Tooltip>
        ) : icon ? (
          <span className="text-primary" aria-hidden="true">
            {icon}
          </span>
        ) : null}
      </div>
      <p
        className={`mt-2 break-words font-semibold text-dark ${strong ? "text-2xl" : "text-lg"}`}
      >
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs leading-5 text-gray">{hint}</p> : null}
    </article>
  );
}

function PayoutInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  inputMode?: "decimal";
}) {
  return (
    <div className={formGroupClassName}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={textInputClassName}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("settings.walletPayout.statuses");
  const normalized = status.toUpperCase();
  const className =
    normalized === "APPROVED" || normalized === "PAID"
      ? "bg-emerald-100 text-emerald-800"
      : normalized === "REJECTED"
        ? "bg-red-100 text-red-700"
        : "bg-amber-100 text-amber-800";
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      {normalized === "APPROVED" ||
      normalized === "PAID" ||
      normalized === "REJECTED" ||
      normalized === "REQUESTED"
        ? t(normalized.toLowerCase())
        : t("unknown")}
    </span>
  );
}

function formatBankDetails(details: Record<string, unknown>, fallback: string) {
  const values = [
    details.bankName,
    details.accountTitle,
    details.accountNumber,
    details.iban,
  ]
    .filter(Boolean)
    .map(String);
  return values.length ? values.join(" · ") : fallback;
}

function prettyLabel(value?: string | null) {
  return value
    ? value
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "-";
}
