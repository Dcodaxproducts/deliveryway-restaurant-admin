"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Banknote,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Loader2,
  Navigation,
  ReceiptText,
  RotateCcw,
  TicketPercent,
  Timer,
  Truck,
  UserRound,
  WalletCards,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import {
  formatDeliveryAddress,
  formatPaymentMethod,
  getMapsUrl,
  getSelectedPaymentMethod,
} from "@/components/pages/Orders/components/orders/details/order-details-utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime24 } from "@/lib/date-time-format";
import { formatMoney as formatCurrencyAmount } from "@/lib/currency";
import { ORDER_STATUS_LABEL_KEYS } from "@/lib/status-labels";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import {
  useRefundPaymentTransaction,
  useUpdatePaymentTransactionStatus,
} from "@/hooks/useOrders";

type NamedEntity = {
  id?: string | null;
  name?: string | null;
  slug?: string | null;
  logoUrl?: string | null;
  coverImage?: string | null;
};

type Customer = {
  id?: string | null;
  email?: string | null;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  isGuest?: boolean | null;
};

type DeliveryAddress = {
  street?: string | null;
  area?: string | null;
  postalCode?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  lat?: number | null;
  lng?: number | null;
};

type OrderItem = {
  id?: string | null;
  menuItemName?: string | null;
  variationName?: string | null;
  quantity?: number | null;
  unitPrice?: number | null;
  lineTotal?: number | null;
  note?: string | null;
  snapshotModifiers?: Array<{
    name?: string | null;
    quantity?: number | null;
    unitPrice?: number | null;
  }> | null;
  menuItem?: {
    imageUrl?: string | null;
    category?: { name?: string | null } | null;
  } | null;
  imageUrl?: string | null;
};

type Transaction = {
  id?: string | null;
  paymentMethod?: string | null;
  type?: string | null;
  status?: string | null;
  amount?: number | null;
  currency?: string | null;
  providerRef?: string | null;
  note?: string | null;
  processedAt?: string | null;
  createdAt?: string | null;
};

type OrderDetails = {
  id?: string | null;
  restaurantId?: string | null;
  branchId?: string | null;
  couponId?: string | null;
  deliverymanId?: string | null;
  deliveryOtp?: string | null;
  orderType?: string | null;
  paymentMethod?: string | null;
  orderTime?: string | null;
  isScheduled?: boolean | null;
  status?: string | null;
  paymentStatus?: string | null;
  currency?: string | null;
  subtotal?: number | null;
  taxAmount?: number | null;
  deliveryFee?: number | null;
  serviceChargeAmount?: number | null;
  tipAmount?: number | null;
  discountAmount?: number | null;
  loyaltyDiscountAmount?: number | null;
  walletAppliedAmount?: number | null;
  totalAmount?: number | null;
  payableAmount?: number | null;
  customerNote?: string | null;
  assignedAt?: string | null;
  deliveredAt?: string | null;
  paidAt?: string | null;
  cancelledAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  restaurant?: NamedEntity | null;
  branch?: NamedEntity | null;
  coupon?: { code?: string | null; title?: string | null } | null;
  customer?: Customer | null;
  availablePaymentMethods?: string[] | null;
  paymentOptions?: { selected?: string | null; available?: string[] | null } | null;
  isGroupOrder?: boolean | null;
  groupOrderInviteCode?: string | null;
  participantCount?: number | null;
  itemCount?: number | null;
  deliveryAddress?: DeliveryAddress | null;
  deliveryman?: NamedEntity | null;
  transactions?: Transaction[] | null;
  items?: OrderItem[] | null;
};

const formatDate = (date?: string | null) => {
  if (!date) return "-";
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? "-"
    : formatDateTime24({ value: parsed });
};

const formatMoney = (amount?: number | null, currency?: string | null) => {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "-";

  return formatCurrencyAmount(amount, currency);
};

const getTransactionAmount = (transaction: Transaction) => {
  const amount = Number(transaction.amount || 0);
  return Number.isFinite(amount) ? amount : 0;
};

const getRefundableAmounts = (transactions: Transaction[]) => {
  const chargeAmount = transactions
    .filter((transaction) => transaction.type === "CHARGE")
    .reduce((sum, transaction) => sum + getTransactionAmount(transaction), 0);
  const refundedAmount = transactions
    .filter((transaction) => transaction.type === "REFUND" && transaction.status === "REFUNDED")
    .reduce((sum, transaction) => sum + getTransactionAmount(transaction), 0);

  return {
    chargeAmount,
    refundedAmount,
    remainingRefundableAmount: Math.max(chargeAmount - refundedAmount, 0),
  };
};

type AdminPaymentStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED";

const ADMIN_PAYMENT_STATUSES: AdminPaymentStatus[] = [
  "PAID",
  "FAILED",
  "PENDING",
  "CANCELLED",
];

const formatStatus = (status?: string | null) =>
  status
    ? status
        .toLowerCase()
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : "-";

function DetailCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5 ${className}`}>
      {children}
    </section>
  );
}

function SectionTitle({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </span>
      <div>
        <h3 className="text-base font-semibold text-gray-950">{title}</h3>
        {description ? <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p> : null}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 last:border-b-0">
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</span>
      <span className="min-w-0 max-w-[65%] break-words text-right text-sm font-semibold text-gray-900 [overflow-wrap:anywhere]">
        {value || "-"}
      </span>
    </div>
  );
}

const OrderDetailsMain = ({ order }: { order: OrderDetails }) => {
  const t = useTranslations("orders");
  const { role } = useAuth();
  const { resolveCurrency: resolveDisplayCurrency } = useCurrency(order.restaurantId);
  const refundMutation = useRefundPaymentTransaction(order.id);
  const paymentStatusMutation = useUpdatePaymentTransactionStatus(order.id);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [refundMode, setRefundMode] = useState<"full" | "partial">("full");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundNote, setRefundNote] = useState(t("refundNote"));
  const [isRefundConfirming, setIsRefundConfirming] = useState(false);
  const [isPaymentStatusDialogOpen, setIsPaymentStatusDialogOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<AdminPaymentStatus>("PAID");
  const [paymentStatusNote, setPaymentStatusNote] = useState(t("paymentStatusNote"));
  const [isPaymentStatusConfirming, setIsPaymentStatusConfirming] = useState(false);
  const items = order.items || [];
  const selectedPaymentMethod = getSelectedPaymentMethod(order);
  const paymentLabel = formatPaymentMethod(selectedPaymentMethod);
  const selectedPaymentMethodKey = selectedPaymentMethod?.toUpperCase();
  const deliveryAddress = formatDeliveryAddress(order.deliveryAddress);
  const mapsUrl = getMapsUrl(order.deliveryAddress);
  const transactions = order.transactions || [];
  const latestTransaction = transactions[0];
  const paymentStatusTransaction = transactions.find(
    (transaction) => transaction.type === "CHARGE" && transaction.id
  );
  const refundableTransaction = transactions.find(
    (transaction) => transaction.type === "CHARGE" && transaction.status === "PAID"
  );
  const { chargeAmount, refundedAmount, remainingRefundableAmount } =
    getRefundableAmounts(transactions);
  const canRefundRole = role === "BUSINESS_ADMIN" || role === "SUPER_ADMIN";
  const canUpdatePaymentStatusRole =
    role === "BUSINESS_ADMIN" || role === "SUPER_ADMIN" || role === "BRANCH_ADMIN";
  const canUpdatePaymentStatus = Boolean(
    canUpdatePaymentStatusRole &&
      paymentStatusTransaction?.id &&
      order.paymentStatus !== "REFUNDED"
  );
  const canRefund = Boolean(
    canRefundRole && refundableTransaction?.id && remainingRefundableAmount > 0,
  );
  const statusLabel = order.status && ORDER_STATUS_LABEL_KEYS[order.status]
    ? t(ORDER_STATUS_LABEL_KEYS[order.status])
    : formatStatus(order.status);
  const paymentMethods = order.paymentOptions?.available || order.availablePaymentMethods || [];
  const primaryCurrency = resolveDisplayCurrency(
    order.currency,
    latestTransaction?.currency
  );
  const parsedRefundAmount = Number(refundAmount);
  const partialAmountInvalid =
    refundMode === "partial" &&
    (!Number.isFinite(parsedRefundAmount) ||
      parsedRefundAmount <= 0 ||
      parsedRefundAmount > remainingRefundableAmount);
  const refundSubmitDisabled =
    refundMutation.isPending ||
    !refundableTransaction?.id ||
    !refundNote.trim() ||
    partialAmountInvalid;
  const paymentStatusSubmitDisabled =
    paymentStatusMutation.isPending ||
    !paymentStatusTransaction?.id ||
    !paymentStatusNote.trim();
  const metadata: Array<[string, React.ReactNode]> = [
    [t("orderType"), formatStatus(order.orderType)],
    [t("statusLabel"), statusLabel],
    [t("paymentStatus"), formatStatus(order.paymentStatus)],
    [t("scheduled"), order.isScheduled ? t("yes") : t("no")],
    [t("groupOrder"), order.isGroupOrder ? t("yes") : t("no")],
    [t("itemCount"), order.itemCount ?? items.length],
    [t("participantCount"), order.participantCount ?? 0],
    [t("createdAt"), formatDate(order.createdAt)],
    [t("updatedAt"), formatDate(order.updatedAt)],
  ];
  const timeline = [
    [t("orderCreated"), order.createdAt],
    [t("assignedAt"), order.assignedAt],
    [t("deliveryTime"), order.orderTime],
    [t("paidAt"), order.paidAt],
    [t("orderDelivered"), order.deliveredAt],
    [t("cancelledAt"), order.cancelledAt],
  ];
  const totals = [
    [t("subtotal"), order.subtotal],
    [t("tax"), order.taxAmount],
    [t("deliveryFee"), order.deliveryFee],
    [t("serviceCharge"), order.serviceChargeAmount],
    [t("tipAmount"), order.tipAmount],
    [t("discountAmount"), order.discountAmount],
    [t("loyaltyDiscount"), order.loyaltyDiscountAmount],
    [t("walletApplied"), order.walletAppliedAmount],
    [t("total"), order.totalAmount],
    [t("payableAmount"), order.payableAmount],
  ] satisfies Array<[string, number | null | undefined]>;

  const openRefundDialog = () => {
    if (!refundableTransaction?.id || refundMutation.isPending) return;

    setRefundMode("full");
    setRefundAmount("");
    setRefundNote(t("refundNote"));
    setIsRefundConfirming(false);
    setIsRefundDialogOpen(true);
  };

  const handleRefundSubmit = () => {
    if (!refundableTransaction?.id || refundSubmitDisabled) return;

    if (!isRefundConfirming) {
      setIsRefundConfirming(true);
      return;
    }

    const amount =
      refundMode === "partial" ? Number(refundAmount) : undefined;

    refundMutation.mutate({
      paymentId: refundableTransaction.id,
      amount,
      note: refundNote.trim(),
    }, {
      onSuccess: () => {
        setIsRefundDialogOpen(false);
        setIsRefundConfirming(false);
      },
    });
  };

  const openPaymentStatusDialog = () => {
    if (!paymentStatusTransaction?.id || paymentStatusMutation.isPending) return;

    setPaymentStatus(
      order.paymentStatus === "FAILED"
        ? "FAILED"
        : order.paymentStatus === "CANCELLED"
          ? "CANCELLED"
          : "PAID"
    );
    setPaymentStatusNote(t("paymentStatusNote"));
    setIsPaymentStatusConfirming(false);
    setIsPaymentStatusDialogOpen(true);
  };

  const handlePaymentStatusSubmit = () => {
    if (!paymentStatusTransaction?.id || paymentStatusSubmitDisabled) return;

    if (!isPaymentStatusConfirming) {
      setIsPaymentStatusConfirming(true);
      return;
    }

    paymentStatusMutation.mutate(
      {
        paymentId: paymentStatusTransaction.id,
        status: paymentStatus,
        note: paymentStatusNote.trim(),
      },
      {
        onSuccess: () => {
          setIsPaymentStatusDialogOpen(false);
          setIsPaymentStatusConfirming(false);
        },
      }
    );
  };

  return (
    <div className="mt-6 w-full space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <DetailCard className="overflow-hidden p-0">
            <div className="relative min-h-[170px] bg-gradient-to-br from-gray-950 via-gray-900 to-primary/80 p-5 text-white sm:p-6">
              {order.restaurant?.coverImage ? (
                <Image
                  src={order.restaurant.coverImage}
                  alt={order.restaurant.name || t("restaurant")}
                  width={960}
                  height={280}
                  className="absolute inset-0 h-full w-full object-cover opacity-25"
                  unoptimized
                />
              ) : null}
              <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
                <div className="flex items-center gap-4">
                  <Image
                    src={order.restaurant?.logoUrl || "/branch_logo.jpg"}
                    alt={order.restaurant?.name || t("restaurant")}
                    width={64}
                    height={64}
                    className="size-16 rounded-2xl border border-white/20 object-cover shadow-xl"
                    unoptimized
                  />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
                      {t("restaurant")}
                    </p>
                    <h2 className="mt-1 text-2xl font-bold">{order.restaurant?.name || "-"}</h2>
                    <p className="mt-1 text-sm text-white/75">{order.branch?.name || t("noBranch")}</p>
                  </div>
                </div>
                <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-xs text-white/70">{t("deliveryTime")}</p>
                  <p className="mt-1 text-lg font-bold">{formatDate(order.orderTime)}</p>
                </div>
              </div>
            </div>
          </DetailCard>

          <DetailCard>
            <SectionTitle
              icon={<ReceiptText size={19} />}
              title={t("itemsOverview")}
              description={t("itemsOverviewDescription")}
            />
            <div className="space-y-3">
              {items.map((item, index) => {
                const imageUrl = item.menuItem?.imageUrl || item.imageUrl || "/burgerOne.jpg";
                const modifiers = item.snapshotModifiers || [];

                return (
                  <div key={item.id || index} className="rounded-2xl border border-gray-100 bg-gray-50/60 p-3">
                    <div className="flex gap-4">
                      <Image
                        src={imageUrl}
                        alt={item.menuItemName || t("itemFallback")}
                        width={64}
                        height={64}
                        className="size-16 rounded-xl object-cover"
                        unoptimized
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase text-primary">
                              {item.menuItem?.category?.name || t("itemFallback")}
                            </p>
                            <h4 className="mt-1 font-semibold text-gray-950">{item.menuItemName || t("itemFallback")}</h4>
                            <p className="text-xs text-gray-500">{item.variationName || "-"}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-950">{formatMoney(item.lineTotal, primaryCurrency)}</p>
                            <p className="text-xs text-gray-500">
                              {item.quantity ?? 0} x {formatMoney(item.unitPrice, primaryCurrency)}
                            </p>
                          </div>
                        </div>

                        {modifiers.length ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {modifiers.map((modifier, modifierIndex) => (
                              <span
                                key={`${modifier.name}-${modifierIndex}`}
                                className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-100"
                              >
                                {modifier.name} x{modifier.quantity ?? 1}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        {item.note ? <p className="mt-3 text-xs text-gray-500">{item.note}</p> : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </DetailCard>

          <DetailCard>
            <SectionTitle icon={<Timer size={19} />} title={t("timeline")} />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {timeline.map(([label, date]) => (
                <div key={label} className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">{formatDate(date)}</p>
                </div>
              ))}
            </div>
          </DetailCard>
        </div>

        <div className="space-y-6">
          <DetailCard>
            <SectionTitle icon={<CalendarClock size={19} />} title={t("orderOverview")} />
            {metadata.map(([label, value]) => (
              <InfoRow key={label} label={label} value={value} />
            ))}
          </DetailCard>

          <DetailCard>
            <SectionTitle icon={<Truck size={19} />} title={t("deliveryDetails")} />
            <InfoRow label={t("deliveryOtp")} value={order.deliveryOtp || "-"} />
            <InfoRow label={t("deliveryman")} value={order.deliveryman?.name || order.deliverymanId || "-"} />
            <div className="pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{t("deliveryAddress")}</p>
              <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-6 text-gray-900">
                {deliveryAddress || t("takeawayOrder")}
              </p>
              {order.deliveryAddress?.lat && order.deliveryAddress?.lng ? (
                <p className="mt-2 text-xs text-gray-500">
                  {order.deliveryAddress.lat}, {order.deliveryAddress.lng}
                </p>
              ) : null}
              {mapsUrl ? (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80"
                >
                  <Navigation className="size-3.5" />
                  {t("openInMaps")}
                </a>
              ) : null}
            </div>
          </DetailCard>

          <DetailCard>
            <SectionTitle icon={<UserRound size={19} />} title={t("customer")} />
            <InfoRow label={t("customerName")} value={order.customer?.fullName || "-"} />
            <InfoRow label={t("phone")} value={order.customer?.phone || "-"} />
            <InfoRow label={t("email")} value={order.customer?.email || "-"} />
            <InfoRow label={t("guestCustomer")} value={order.customer?.isGuest ? t("yes") : t("no")} />
            <InfoRow label={t("customerNote")} value={order.customerNote || t("noOrderNote")} />
          </DetailCard>

          <DetailCard>
            <SectionTitle icon={<CreditCard size={19} />} title={t("payment")} />
            <InfoRow label={t("selectedPaymentMethod")} value={paymentLabel || t("notAvailable")} />
            <InfoRow label={t("paymentStatus")} value={formatStatus(order.paymentStatus)} />
            {paymentStatusTransaction?.id ? (
              <InfoRow
                label={t("paymentAttempt")}
                value={`${formatStatus(paymentStatusTransaction.status)} · ${formatMoney(
                  paymentStatusTransaction.amount,
                  paymentStatusTransaction.currency || primaryCurrency
                )}`}
              />
            ) : null}
            <InfoRow
              label={t("refundableAmount")}
              value={formatMoney(remainingRefundableAmount, primaryCurrency)}
            />
            {canUpdatePaymentStatus ? (
              <button
                type="button"
                onClick={openPaymentStatusDialog}
                disabled={paymentStatusMutation.isPending}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary ring-1 ring-primary/15 transition hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <CheckCircle2 className="size-4" />
                {paymentStatusMutation.isPending
                  ? t("updatingPaymentStatus")
                  : t("updatePaymentStatus")}
              </button>
            ) : null}
            {canRefund ? (
              <button
                type="button"
                onClick={openRefundDialog}
                disabled={refundMutation.isPending}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 ring-1 ring-red-100 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <RotateCcw className="size-4" />
                {refundMutation.isPending ? t("refundingPayment") : t("refundPayment")}
              </button>
            ) : null}
            <div className="py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{t("availablePaymentMethods")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {paymentMethods.length ? paymentMethods.map((method) => (
                  <span key={method} className="rounded-full bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600 ring-1 ring-gray-100">
                    {formatPaymentMethod(method)}
                  </span>
                )) : <span className="text-sm font-semibold text-gray-900">-</span>}
              </div>
            </div>
          </DetailCard>

          {order.coupon ? (
            <DetailCard>
              <SectionTitle icon={<TicketPercent size={19} />} title={t("coupon")} />
              <InfoRow label={t("couponCode")} value={order.coupon.code || "-"} />
              <InfoRow label={t("couponTitle")} value={order.coupon.title || "-"} />
            </DetailCard>
          ) : null}

          <DetailCard>
            <SectionTitle icon={<Banknote size={19} />} title={t("orderSummary")} />
            {totals.map(([label, amount]) => (
              <InfoRow key={label} label={label} value={formatMoney(amount, primaryCurrency)} />
            ))}
          </DetailCard>

          <DetailCard>
            <SectionTitle icon={<WalletCards size={19} />} title={t("transactions")} />
            <div className="space-y-3">
              {transactions.length ? transactions.map((transaction, index) => (
                <div key={transaction.id || index} className="rounded-2xl bg-gray-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-gray-950">{formatPaymentMethod(transaction.paymentMethod)}</p>
                      <p className="mt-1 text-xs text-gray-500">{formatStatus(transaction.type)} · {formatDate(transaction.createdAt)}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-primary ring-1 ring-gray-100">
                      {formatStatus(transaction.status)}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-xs text-gray-500">{transaction.providerRef || transaction.note || t("notAvailable")}</span>
                    <span className="text-sm font-bold text-gray-950">{formatMoney(transaction.amount, transaction.currency || primaryCurrency)}</span>
                  </div>
                </div>
              )) : <p className="text-sm text-gray-500">{t("noTransactions")}</p>}
            </div>
          </DetailCard>
        </div>
      </div>

      <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-gray-100 p-0 sm:max-w-xl">
          <DialogHeader className="border-b border-gray-100 px-6 py-5">
            <DialogTitle className="text-xl text-gray-950">{t("refundDialogTitle")}</DialogTitle>
            <DialogDescription className="text-sm leading-6 text-gray-500">
              {t("refundDialogDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 px-6 py-5">
            <div className="grid gap-3 rounded-2xl bg-gray-50 p-4 sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase text-gray-400">{t("chargedAmount")}</p>
                <p className="mt-1 text-sm font-bold text-gray-950">
                  {formatMoney(chargeAmount, primaryCurrency)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-400">{t("refundedAmount")}</p>
                <p className="mt-1 text-sm font-bold text-gray-950">
                  {formatMoney(refundedAmount, primaryCurrency)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-400">{t("remainingRefundable")}</p>
                <p className="mt-1 text-sm font-bold text-gray-950">
                  {formatMoney(remainingRefundableAmount, primaryCurrency)}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setRefundMode("full");
                  setRefundAmount("");
                  setIsRefundConfirming(false);
                }}
                className={`rounded-2xl border p-4 text-left transition ${
                  refundMode === "full"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-gray-100 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <p className="text-sm font-bold">{t("fullRefund")}</p>
                <p className="mt-1 text-xs leading-5">{t("fullRefundDescription")}</p>
              </button>
              <button
                type="button"
                onClick={() => {
                  setRefundMode("partial");
                  setIsRefundConfirming(false);
                }}
                className={`rounded-2xl border p-4 text-left transition ${
                  refundMode === "partial"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-gray-100 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <p className="text-sm font-bold">{t("partialRefund")}</p>
                <p className="mt-1 text-xs leading-5">{t("partialRefundDescription")}</p>
              </button>
            </div>

            {refundMode === "partial" ? (
              <div className="space-y-2">
                <label htmlFor="refund-amount" className="text-sm font-semibold text-gray-900">
                  {t("refundAmount")}
                </label>
                <Input
                  id="refund-amount"
                  type="number"
                  min="0.01"
                  max={remainingRefundableAmount}
                  step="0.01"
                  value={refundAmount}
                  onChange={(event) => {
                    setRefundAmount(event.target.value);
                    setIsRefundConfirming(false);
                  }}
                  placeholder={remainingRefundableAmount.toFixed(2)}
                  className="h-11 rounded-xl border-gray-200 text-sm"
                />
                {partialAmountInvalid ? (
                  <p className="text-xs font-medium text-red-600">
                    {t("refundAmountHelp", {
                      amount: formatMoney(remainingRefundableAmount, primaryCurrency),
                    })}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">
                    {t("refundAmountHelp", {
                      amount: formatMoney(remainingRefundableAmount, primaryCurrency),
                    })}
                  </p>
                )}
              </div>
            ) : null}

            <div className="space-y-2">
              <label htmlFor="refund-note" className="text-sm font-semibold text-gray-900">
                {t("refundReason")}
              </label>
              <Textarea
                id="refund-note"
                value={refundNote}
                onChange={(event) => {
                  setRefundNote(event.target.value);
                  setIsRefundConfirming(false);
                }}
                rows={4}
                className="resize-y rounded-xl border-gray-200 text-sm"
              />
            </div>

            {isRefundConfirming ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                {t("refundFinalConfirm", {
                  amount: formatMoney(
                    refundMode === "partial" ? parsedRefundAmount : remainingRefundableAmount,
                    primaryCurrency,
                  ),
                })}
              </div>
            ) : null}
          </div>

          <DialogFooter className="border-t border-gray-100 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRefundDialogOpen(false)}
              disabled={refundMutation.isPending}
              className="h-10 rounded-xl border-gray-200"
            >
              {t("cancelRefund")}
            </Button>
            <Button
              type="button"
              onClick={handleRefundSubmit}
              disabled={refundSubmitDisabled}
              className="h-10 rounded-xl bg-red-600 text-white hover:bg-red-700"
            >
              {refundMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
              {refundMutation.isPending
                ? t("refundingPayment")
                : isRefundConfirming
                  ? t("confirmRefund")
                  : t("continueRefund")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isPaymentStatusDialogOpen}
        onOpenChange={setIsPaymentStatusDialogOpen}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-gray-100 p-0 sm:max-w-xl">
          <DialogHeader className="border-b border-gray-100 px-6 py-5">
            <DialogTitle className="text-xl text-gray-950">
              {t("paymentStatusDialogTitle")}
            </DialogTitle>
            <DialogDescription className="text-sm leading-6 text-gray-500">
              {t("paymentStatusDialogDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 px-6 py-5">
            <div className="rounded-2xl bg-gray-50 p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400">
                    {t("currentPaymentStatus")}
                  </p>
                  <p className="mt-1 text-sm font-bold text-gray-950">
                    {formatStatus(order.paymentStatus)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400">
                    {t("transactionStatus")}
                  </p>
                  <p className="mt-1 text-sm font-bold text-gray-950">
                    {formatStatus(paymentStatusTransaction?.status)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400">
                    {t("amount")}
                  </p>
                  <p className="mt-1 text-sm font-bold text-gray-950">
                    {formatMoney(
                      paymentStatusTransaction?.amount,
                      paymentStatusTransaction?.currency || primaryCurrency
                    )}
                  </p>
                </div>
              </div>
            </div>

            {selectedPaymentMethodKey === "STRIPE" ? (
              <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <p>{t("stripePaymentStatusWarning")}</p>
              </div>
            ) : null}

            <div className="space-y-2">
              <label htmlFor="payment-status" className="text-sm font-semibold text-gray-900">
                {t("newPaymentStatus")}
              </label>
              <Select
                value={paymentStatus}
                onValueChange={(value) => {
                  setPaymentStatus(value as AdminPaymentStatus);
                  setIsPaymentStatusConfirming(false);
                }}
              >
                <SelectTrigger id="payment-status" className="h-11 rounded-xl border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADMIN_PAYMENT_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {formatStatus(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="payment-status-note" className="text-sm font-semibold text-gray-900">
                {t("paymentStatusReason")}
              </label>
              <Textarea
                id="payment-status-note"
                value={paymentStatusNote}
                onChange={(event) => {
                  setPaymentStatusNote(event.target.value);
                  setIsPaymentStatusConfirming(false);
                }}
                rows={4}
                className="resize-y rounded-xl border-gray-200 text-sm"
              />
            </div>

            {isPaymentStatusConfirming ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                {t("paymentStatusFinalConfirm", {
                  status: formatStatus(paymentStatus),
                })}
              </div>
            ) : null}
          </div>

          <DialogFooter className="border-t border-gray-100 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPaymentStatusDialogOpen(false)}
              disabled={paymentStatusMutation.isPending}
              className="h-10 rounded-xl border-gray-200"
            >
              {t("cancelPaymentStatusUpdate")}
            </Button>
            <Button
              type="button"
              onClick={handlePaymentStatusSubmit}
              disabled={paymentStatusSubmitDisabled}
              className="h-10 rounded-xl bg-primary text-white hover:bg-primary/90"
            >
              {paymentStatusMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              {paymentStatusMutation.isPending
                ? t("updatingPaymentStatus")
                : isPaymentStatusConfirming
                  ? t("confirmPaymentStatusUpdate")
                  : t("continuePaymentStatusUpdate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderDetailsMain;
