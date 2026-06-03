"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Coins,
  History,
  Loader2,
  MinusCircle,
  PlusCircle,
  RefreshCcw,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AsyncSelect from "@/components/ui/AsyncSelect";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useAuth } from "@/hooks/useAuth";
import {
  useAdjustCustomerLoyaltyPoints,
  useGetCustomerLoyaltySummary,
} from "@/hooks/useLoyalty";
import { getCustomersList } from "@/services/customers/customers.api";
import { useLocale, useTranslations } from "next-intl";

type AdjustmentForm = {
  points: string;
  isCredit: boolean;
  note: string;
};

type CustomerOption = {
  id: string;
  displayName: string;
  email?: string;
  phone?: string;
  raw?: any;
};

const defaultAdjustmentForm: AdjustmentForm = {
  points: "",
  isCredit: true,
  note: "",
};

const toNumber = (value: string) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const formatDate = (value?: string | null, locale = "en-US") => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const pickNumber = (data: any, keys: string[], fallback = 0) => {
  for (const key of keys) {
    const value = data?.[key];

    if (value !== undefined && value !== null && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }

  return fallback;
};

const normalizeHistory = (data: any) => {
  const candidates = [
    data?.history,
    data?.transactions,
    data?.entries,
    data?.loyaltyHistory,
    data?.pointHistory,
  ];

  const raw = candidates.find((item) => Array.isArray(item));

  return Array.isArray(raw) ? raw : [];
};

const extractCustomers = (response: any) => {
  const candidates = [
    response?.data?.items,
    response?.data?.customers,
    response?.data?.data?.items,
    response?.data?.data?.customers,
    response?.data?.data,
    response?.items,
    response?.customers,
    response?.data,
    response,
  ];

  const raw = candidates.find((candidate) => Array.isArray(candidate));

  return Array.isArray(raw) ? raw : [];
};

const extractMeta = (response: any) => {
  return (
    response?.data?.pagination ||
    response?.data?.meta ||
    response?.data?.data?.pagination ||
    response?.data?.data?.meta ||
    response?.pagination ||
    response?.meta ||
    {}
  );
};

const getCustomerId = (customer: any) => {
  return (
    customer?.id ||
    customer?.customerId ||
    customer?.userId ||
    customer?.customer?.id ||
    ""
  );
};

const getCustomerName = (customer: any) => {
  const firstName =
    customer?.firstName ||
    customer?.customer?.firstName ||
    customer?.user?.firstName ||
    "";

  const lastName =
    customer?.lastName ||
    customer?.customer?.lastName ||
    customer?.user?.lastName ||
    "";

  return (
    customer?.name ||
    customer?.fullName ||
    customer?.customer?.name ||
    customer?.user?.name ||
    `${firstName} ${lastName}`.trim()
  );
};

const getCustomerEmail = (customer: any) => {
  return (
    customer?.email || customer?.customer?.email || customer?.user?.email || ""
  );
};

const getCustomerPhone = (customer: any) => {
  return (
    customer?.phone || customer?.customer?.phone || customer?.user?.phone || ""
  );
};

const mapCustomerToOption = (
  customer: any,
  fallbackLabel: string,
): CustomerOption | null => {
  const id = String(getCustomerId(customer) || "").trim();

  if (!id) return null;

  const name = getCustomerName(customer);
  const email = getCustomerEmail(customer);
  const phone = getCustomerPhone(customer);

  const displayName =
    [name, email].filter(Boolean).join(" · ") ||
    phone ||
    `${fallbackLabel} ${id.slice(-8)}`;

  return {
    id,
    displayName,
    email,
    phone,
    raw: customer,
  };
};

const getHistoryType = (row: any) => {
  if (typeof row?.isCredit === "boolean") {
    return row.isCredit ? "Credit" : "Debit";
  }

  if (row?.type) return String(row.type);
  if (row?.action) return String(row.action);
  if (Number(row?.points || 0) >= 0) return "Credit";

  return "Debit";
};

const getHistoryPoints = (row: any) => {
  const value = row?.points ?? row?.amount ?? row?.pointChange ?? 0;
  return Number(value || 0);
};

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

export default function CustomerLoyaltyManager() {
  const { restaurantId, branchId, isBranchAdmin } = useAuth();
  const t = useTranslations("loyalty");
  const commonT = useTranslations("common");
  const locale = useLocale();
  const dateLocale = locale === "de" ? "de-DE" : "en-US";

  const normalizedRestaurantId = restaurantId ?? undefined;
  const normalizedBranchId = isBranchAdmin
    ? (branchId ?? undefined)
    : undefined;

  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerOption | null>(null);

  const [activeCustomerId, setActiveCustomerId] = useState("");
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState<AdjustmentForm>(
    defaultAdjustmentForm,
  );

  const {
    data: summaryResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetCustomerLoyaltySummary(
    activeCustomerId
      ? {
          customerId: activeCustomerId,
        }
      : undefined,
  );

  const { mutate: adjustPoints, isPending: isAdjusting } =
    useAdjustCustomerLoyaltyPoints({
      messages: {
        creditSuccess: t("messages.pointsAdded"),
        debitSuccess: t("messages.pointsDeducted"),
        error: t("messages.failedAdjust"),
      },
    });

  const fetchCustomerOptions = useCallback(
    async ({ search, page }: { search: string; page: number }) => {
      const response = await getCustomersList({
        page,
        search: search || undefined,
        sortOrder: "DESC",
        includeInactive: true,
        restaurantId: normalizedRestaurantId,
        branchId: normalizedBranchId,
      });

      const customers = extractCustomers(response)
        .map((customer) => mapCustomerToOption(customer, t("customer")))
        .filter(Boolean) as CustomerOption[];

      return {
        data: customers,
        meta: extractMeta(response),
      };
    },
    [normalizedRestaurantId, normalizedBranchId, t],
  );

  const summary = summaryResponse?.data;

  const history = useMemo(() => {
    return normalizeHistory(summary);
  }, [summary]);

  const stats = useMemo(() => {
    return [
      {
        title: t("availablePoints"),
        value: pickNumber(summary, [
          "availablePoints",
          "currentPoints",
          "balance",
          "points",
          "totalPoints",
        ]),
        icon: <Coins size={18} />,
      },
      {
        title: t("totalPoints"),
        value: pickNumber(summary, ["totalPoints", "earnedPoints"]),
        icon: <WalletCards size={18} />,
      },
      {
        title: t("redeemedPoints"),
        value: pickNumber(summary, ["redeemedPoints", "usedPoints"]),
        icon: <MinusCircle size={18} />,
      },
      {
        title: t("expiredPoints"),
        value: pickNumber(summary, ["expiredPoints"]),
        icon: <History size={18} />,
      },
    ];
  }, [summary, t]);

  const handleCustomerChange = (customer: CustomerOption | null) => {
    setSelectedCustomer(customer);
    setActiveCustomerId(customer?.id || "");
  };

  const resetAdjustment = () => {
    setAdjustmentForm(defaultAdjustmentForm);
  };

  const handleAdjust = () => {
    if (isBranchAdmin) {
      toast.error(t("validation.branchAdjustmentReadOnly"));
      return;
    }

    if (!activeCustomerId) {
      toast.error(t("validation.selectCustomerFirst"));
      return;
    }

    const points = toNumber(adjustmentForm.points);

    if (points <= 0) {
      toast.error(t("validation.pointsPositive"));
      return;
    }

    adjustPoints(
      {
        customerId: activeCustomerId,
        payload: {
          points,
          isCredit: adjustmentForm.isCredit,
          note: adjustmentForm.note.trim(),
        },
      },
      {
        onSuccess: () => {
          setAdjustOpen(false);
          resetAdjustment();
          refetch();
        },
      },
    );
  };

  return (
    <section className="rounded-[20px] bg-white p-4 shadow-sm lg:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-950">
            {t("customerLoyalty")}
          </h2>
          <p className="mt-1 text-sm leading-6 text-gray-500">
            {isBranchAdmin
              ? t("customerLoyaltyBranchDescription")
              : t("customerLoyaltyDescription")}
          </p>
        </div>

        {!isBranchAdmin ? (
          <Button
            type="button"
            disabled={!activeCustomerId || isLoading || isFetching}
            onClick={() => setAdjustOpen(true)}
            className="h-[42px] rounded-[12px] bg-primary px-5 text-white hover:bg-primary/90"
          >
            <PlusCircle size={16} className="mr-2" />
            {t("adjustPoints")}
          </Button>
        ) : null}
      </div>

      <div className="mt-6 rounded-[18px] border border-gray-100 bg-[#FAFAFA] p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex-1 space-y-1.5">
            <label className="text-sm font-semibold text-gray-900">
              {t("selectCustomer")}
            </label>

            <AsyncSelect
              value={selectedCustomer}
              onChange={handleCustomerChange}
              placeholder={t("searchCustomer")}
              fetchOptions={fetchCustomerOptions}
              labelKey="displayName"
              valueKey="id"
            />
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={!activeCustomerId || isFetching}
            onClick={() => refetch()}
            className="h-[44px] rounded-[12px]"
          >
            {isFetching ? (
              <Loader2 size={16} className="mr-2 animate-spin" />
            ) : (
              <RefreshCcw size={16} className="mr-2" />
            )}
            {t("refresh")}
          </Button>
        </div>

        {selectedCustomer ? (
          <div className="mt-4 rounded-[14px] border border-primary/10 bg-primary/[0.04] p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
                <UserRound size={18} />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-950">
                  {selectedCustomer.displayName}
                </p>

                <p className="mt-1 break-all text-xs text-gray-500">
                  {t("customerId")}:{" "}
                  <span className="font-semibold text-gray-700">
                    {selectedCustomer.id}
                  </span>
                </p>

                {selectedCustomer.phone ? (
                  <p className="mt-1 text-xs text-gray-500">
                    {t("phone")}: {selectedCustomer.phone}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {!activeCustomerId ? (
        <div className="mt-6 rounded-[18px] border border-dashed border-gray-200 bg-white p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-primary/10 text-primary">
            <UserRound size={26} />
          </div>

          <h3 className="mt-4 text-base font-semibold text-gray-950">
            {t("selectCustomerLoyalty")}
          </h3>

          <p className="mx-auto mt-1 max-w-[420px] text-sm leading-6 text-gray-500">
            {t("selectCustomerLoyaltyDescription")}
          </p>
        </div>
      ) : isLoading ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-[90px] animate-pulse rounded-[16px] bg-gray-100"
            />
          ))}
        </div>
      ) : (
        <>
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

          <div className="mt-6 overflow-hidden rounded-[18px] border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-[#FAFAFA] px-4 py-4">
              <h3 className="text-sm font-semibold text-gray-950">
                {t("loyaltyHistory")}
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                {t("loyaltyHistoryDescription")}
              </p>
            </div>

            {history.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">
                {t("emptyHistory")}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b bg-white text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <th className="px-4 py-3">{t("date")}</th>
                      <th className="px-4 py-3">{t("type")}</th>
                      <th className="px-4 py-3 text-right">{t("points")}</th>
                      <th className="px-4 py-3">{t("note")}</th>
                      <th className="px-4 py-3">{t("reference")}</th>
                    </tr>
                  </thead>

                  <tbody>
                    {history.map((row: any, index: number) => {
                      const points = getHistoryPoints(row);
                      const type = getHistoryType(row);
                      const isCredit =
                        type.toLowerCase().includes("credit") || points > 0;

                      return (
                        <tr
                          key={row?.id || index}
                          className="border-b border-gray-100 transition hover:bg-[#FAFAFA]"
                        >
                          <td className="px-4 py-4 text-gray-700">
                            {formatDate(
                              row?.createdAt ||
                                row?.date ||
                                row?.processedAt ||
                                row?.updatedAt,
                              dateLocale,
                            )}
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                isCredit
                                  ? "bg-green-50 text-green"
                                  : "bg-red-50 text-red-600"
                              }`}
                            >
                              {isCredit ? t("credit") : t("debit")}
                            </span>
                          </td>

                          <td
                            className={`px-4 py-4 text-right font-semibold ${
                              isCredit ? "text-green" : "text-red-600"
                            }`}
                          >
                            {isCredit ? "+" : "-"}
                            {Math.abs(points)}
                          </td>

                          <td className="px-4 py-4 text-gray-600">
                            {row?.note || row?.description || "-"}
                          </td>

                          <td className="px-4 py-4 text-gray-500">
                            {row?.orderId ||
                              row?.reference ||
                              row?.source ||
                              "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen} modal>
        <DialogContent
          className="max-w-[520px] rounded-[22px] border-0 bg-white p-0 shadow-xl"
          onCloseAutoFocus={(event) => event.preventDefault()}
        >
          <DialogHeader className="border-b border-gray-100 px-5 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-xl font-semibold text-gray-950">
                  {t("adjustLoyaltyPoints")}
                </DialogTitle>

                <p className="mt-1 text-sm text-gray-500">
                  {t("adjustLoyaltyPointsDescription")}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAdjustOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                aria-label={t("closeModal")}
              >
                <X size={18} />
              </button>
            </div>
          </DialogHeader>

          <div className="space-y-4 px-5 py-5">
            <div className="rounded-[14px] border border-primary/10 bg-primary/[0.04] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {t("customer")}
              </p>

              <p className="mt-1 break-all text-sm font-semibold text-gray-900">
                {selectedCustomer?.displayName || activeCustomerId}
              </p>

              <p className="mt-1 break-all text-xs text-gray-500">
                ID: {activeCustomerId}
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-900">
                {t("adjustmentType")}
              </label>

              <div className="grid grid-cols-2 gap-2 rounded-[14px] bg-[#F7F7F7] p-1">
                <button
                  type="button"
                  onClick={() =>
                    setAdjustmentForm((prev) => ({
                      ...prev,
                      isCredit: true,
                    }))
                  }
                  className={`h-[40px] rounded-[11px] text-sm font-semibold transition ${
                    adjustmentForm.isCredit
                      ? "bg-white text-green shadow-sm"
                      : "text-gray-500 hover:bg-white/70"
                  }`}
                >
                  {t("addPoints")}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setAdjustmentForm((prev) => ({
                      ...prev,
                      isCredit: false,
                    }))
                  }
                  className={`h-[40px] rounded-[11px] text-sm font-semibold transition ${
                    !adjustmentForm.isCredit
                      ? "bg-white text-red-600 shadow-sm"
                      : "text-gray-500 hover:bg-white/70"
                  }`}
                >
                  {t("deductPoints")}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-900">
                {t("points")}
              </label>

              <Input
                type="number"
                min={1}
                value={adjustmentForm.points}
                onChange={(event) =>
                  setAdjustmentForm((prev) => ({
                    ...prev,
                    points: event.target.value,
                  }))
                }
                placeholder="100"
                className="h-[44px] rounded-[12px] border-gray-300 focus:border-gray-400"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-900">
                {t("note")}
              </label>

              <textarea
                value={adjustmentForm.note}
                onChange={(event) =>
                  setAdjustmentForm((prev) => ({
                    ...prev,
                    note: event.target.value,
                  }))
                }
                placeholder={t("adjustmentReason")}
                rows={4}
                className="w-full resize-none rounded-[12px] border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-400"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-gray-100 px-5 py-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={isAdjusting}
              onClick={() => {
                setAdjustOpen(false);
                resetAdjustment();
              }}
              className="rounded-[12px]"
            >
              {commonT("cancel")}
            </Button>

            <Button
              type="button"
              disabled={isAdjusting}
              onClick={handleAdjust}
              className="rounded-[12px] bg-primary text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {isAdjusting ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  {t("saving")}
                </>
              ) : adjustmentForm.isCredit ? (
                <>
                  <PlusCircle size={16} className="mr-2" />
                  {t("addPoints")}
                </>
              ) : (
                <>
                  <MinusCircle size={16} className="mr-2" />
                  {t("deductPoints")}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
