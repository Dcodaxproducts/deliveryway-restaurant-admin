"use client";

import { useMemo } from "react";
import {
  Banknote,
  Check,
  CreditCard,
  Landmark,
  ShieldCheck,
  Store,
  WalletCards,
} from "lucide-react";

import { useRestaurantPaymentManagement } from "@/hooks/useRestaurantPaymentManagement";
import { getApiErrorMessage } from "@/lib/errors";
import {
  PAYMENT_METHOD_LABELS,
  type PaymentMethodCode,
} from "@/types/payment-methods";
import { useTranslations } from "next-intl";

type RestaurantPaymentMethodsSectionProps = {
  restaurantId?: string | null;
};

const methodIcons: Record<PaymentMethodCode, typeof CreditCard> = {
  COD: Banknote,
  CARD_ON_DELIVERY: CreditCard,
  STRIPE: CreditCard,
  PAYPAL: WalletCards,
  EASYPAISA: WalletCards,
  JAZZCASH: WalletCards,
  BANK_TRANSFER: Landmark,
  WALLET: WalletCards,
};

export function RestaurantPaymentMethodsSection({
  restaurantId,
}: RestaurantPaymentMethodsSectionProps) {
  const t = useTranslations("branches");
  const managementQuery = useRestaurantPaymentManagement(restaurantId);

  const availableMethods = useMemo(
    () => managementQuery.data?.allowedPaymentMethods ?? [],
    [managementQuery.data?.allowedPaymentMethods],
  );
  const savedMethods = useMemo(
    () => managementQuery.data?.customerPaymentMethods ?? [],
    [managementQuery.data?.customerPaymentMethods],
  );

  return (
    <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
      <header className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_right,rgba(204,0,0,0.08),transparent_42%)] px-5 py-6 sm:px-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-[15px] bg-primary text-white shadow-[0_8px_20px_rgba(204,0,0,0.2)]">
              <Store size={22} aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                {t("restaurantWideCheckout")}
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
                {t("customerPaymentMethods")}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {t("customerPaymentMethodsReadOnlyDescription")}
              </p>
            </div>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-[10px] bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
            <ShieldCheck size={15} aria-hidden="true" />
            {t("allBranchesInheritPaymentSetup")}
          </div>
        </div>
      </header>

      <div className="p-5 sm:p-7">
        {managementQuery.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-[16px] bg-slate-100"
              />
            ))}
          </div>
        ) : null}

        {managementQuery.error ? (
          <p className="rounded-[12px] border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {getApiErrorMessage(
              managementQuery.error,
              t("paymentMethodsLoadFailed"),
            )}
          </p>
        ) : null}

        {!managementQuery.isLoading &&
        !managementQuery.error &&
        availableMethods.length === 0 ? (
          <div className="rounded-[16px] border border-dashed border-amber-300 bg-amber-50 px-5 py-7 text-center">
            <CreditCard
              className="mx-auto size-6 text-amber-700"
              aria-hidden="true"
            />
            <p className="mt-2 text-sm font-semibold text-amber-950">
              {t("noPaymentMethodsAvailable")}
            </p>
            <p className="mt-1 text-sm text-amber-800">
              {t("superAdminAssignsPaymentMethods")}
            </p>
          </div>
        ) : null}

        {availableMethods.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {availableMethods.map((method) => {
              const checked = savedMethods.includes(method);
              const Icon = methodIcons[method];

              return (
                <div
                  key={method}
                  className={`group flex min-h-24 items-center gap-4 rounded-[16px] border p-4 text-left ${
                    checked
                      ? "border-primary/30 bg-primary/[0.045] shadow-[0_8px_24px_rgba(204,0,0,0.07)]"
                      : "border-slate-200 bg-slate-50/70 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
                  }`}
                >
                  <span
                    className={`flex size-11 shrink-0 items-center justify-center rounded-[13px] ${checked ? "bg-primary text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}
                  >
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-950">
                      {PAYMENT_METHOD_LABELS[method]}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {checked
                        ? t("shownAtCustomerCheckout")
                        : t("hiddenFromCustomerCheckout")}
                    </span>
                  </span>
                  <span
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full border ${checked ? "border-primary bg-primary text-white" : "border-slate-300 bg-white text-transparent"}`}
                  >
                    <Check size={14} aria-hidden="true" />
                  </span>
                </div>
              );
            })}
          </div>
        ) : null}

        {availableMethods.length > 0 ? (
          <footer className="mt-6 border-t border-slate-200 pt-5">
            <p className="text-sm text-slate-500">
              {t("paymentMethodsVisibleCount", {
                enabled: savedMethods.length,
                total: availableMethods.length,
              })}
            </p>
          </footer>
        ) : null}
      </div>
    </section>
  );
}
