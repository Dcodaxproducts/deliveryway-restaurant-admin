"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Ban, CalendarClock, CreditCard, Eye, MoreHorizontal, RefreshCw, Truck, XCircle } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ClickTooltip } from "@/components/common/ClickTooltip";
import TableSkeleton from "@/components/common/TableSkeleton";
import SortHeader from "@/components/common/sort-header";
import { formatDeliveryAddress } from "@/components/pages/Orders/components/orders/details/order-details-utils";
import { OrderStatusUpdateDialog } from "@/components/pages/Orders/components/orders/OrderStatusUpdateDialog";
import { OrderStatusProgressDialog } from "@/components/pages/Orders/components/orders/OrderStatusProgressDialog";
import { PaymentStatusUpdateDialog } from "@/components/pages/Orders/components/orders/PaymentStatusUpdateDialog";
import {
  getOrderTimeDate,
  isFutureOrder,
} from "@/components/pages/Orders/utils/orders-schedule-filters";
import { useAuth } from "@/hooks/useAuth";
import { useSendOrderOutForDelivery, useUpdateOrderStatus } from "@/hooks/useOrders";
import { formatDateTime24 } from "@/lib/date-time-format";
import { getOrderById } from "@/services/orders/orders.api";
import {
  canDirectlyUpdateOrderStatus,
  canSendDeliveryOrderOutDirectly,
  canTerminateOrderStatus,
  getNextOrderStatus,
  ORDER_STATUS_ACTION_LABEL_KEYS,
  ORDER_TERMINAL_ACTION_LABEL_KEYS,
} from "@/lib/order-status-transitions";
import { ORDER_STATUS_LABEL_KEYS } from "@/lib/status-labels";
import type { Order, PaymentTransaction } from "@/types/orders";
import { useTranslations } from "next-intl";

export type OrdersTableRow = Order & {
  customerName?: string;
  guestCount?: number;
  reservationDate?: string;
};

type OrderStatusProgressState = {
  orderType?: string | null;
  previousStatus?: string | null;
  status?: string | null;
};

type PaymentStatusDialogState = {
  order: OrdersTableRow;
  transaction: PaymentTransaction;
};

const formatShortDate = (value?: string) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString();
};

const formatOrderTime = (value?: string) => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return formatDateTime24({
    value: date,
    options: {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    },
  });
};

interface OrdersTableProps {
  orders: OrdersTableRow[];
  loading: boolean;
  sortKey: keyof OrdersTableRow | null;
  sortDir: "asc" | "desc";
  onSort: (key: keyof OrdersTableRow) => void;
  activeTab: string;
}

export function OrdersTable({
  orders,
  loading,
  sortKey,
  sortDir,
  onSort,
  activeTab
}: OrdersTableProps) {
  const router = useRouter();
  const { role } = useAuth();
  const common = useTranslations("common");
  const t = useTranslations("orders");
  const [statusOrder, setStatusOrder] = useState<OrdersTableRow | null>(null);
  const [progressOrder, setProgressOrder] = useState<OrderStatusProgressState | null>(null);
  const [paymentStatusOrder, setPaymentStatusOrder] =
    useState<PaymentStatusDialogState | null>(null);
  const [loadingPaymentStatusOrderId, setLoadingPaymentStatusOrderId] =
    useState<string | null>(null);
  const updateStatusMutation = useUpdateOrderStatus();
  const sendOutForDeliveryMutation = useSendOrderOutForDelivery();
  const canUpdatePaymentStatusRole =
    role === "BUSINESS_ADMIN" || role === "SUPER_ADMIN" || role === "BRANCH_ADMIN";
  const getStatusLabel = (status?: string) =>
    status && ORDER_STATUS_LABEL_KEYS[status]
      ? t(ORDER_STATUS_LABEL_KEYS[status])
      : status;
  const getCustomerName = (order: OrdersTableRow) => {
    const customer = order.customer;
    const fullName =
      customer?.fullName ||
      customer?.name ||
      `${customer?.firstName ?? ""} ${customer?.lastName ?? ""}`.trim();

    return fullName || order.customerName || t("unknownUser");
  };
  const getCustomerDetail = (order: OrdersTableRow) =>
    order.customer?.email || order.customer?.phone || order.customer?.id || "-";
  const getAddressPreview = (order: OrdersTableRow) => {
    if (order.orderType !== "DELIVERY") {
      return {
        primary: t("takeawayOrder"),
        secondary: order.branch?.name || t("noBranch"),
        full: order.branch?.name || t("noBranch"),
      };
    }

    const formattedAddress = formatDeliveryAddress(order.deliveryAddress);
    const [primaryAddress, ...secondaryAddress] = formattedAddress?.split("\n") ?? [];

    return {
      primary: primaryAddress || t("addressPending"),
      secondary: secondaryAddress.join(", ") || order.branch?.name || t("noBranch"),
      full: formattedAddress || t("addressPending"),
    };
  };
  const getStatusActionLabel = (order: OrdersTableRow) => {
    const nextStatus = getNextOrderStatus(order);

    return nextStatus && ORDER_STATUS_ACTION_LABEL_KEYS[nextStatus]
      ? t(ORDER_STATUS_ACTION_LABEL_KEYS[nextStatus])
      : common("updateStatus");
  };
  const getPaymentStatusTransaction = (order: Pick<OrdersTableRow, "transactions">) =>
    order.transactions?.find((transaction) => transaction.type === "CHARGE" && transaction.id);
  const handleStatusAction = async (order: OrdersTableRow) => {
    const nextStatus = getNextOrderStatus(order);

    if (!nextStatus) {
      return;
    }

    if (!canDirectlyUpdateOrderStatus(order)) {
      setStatusOrder(order);
      return;
    }

    const updatedOrder = await updateStatusMutation.mutateAsync({
      orderId: order.id,
      payload: {
        status: nextStatus,
        ...(order.deliveryOtp?.trim()
          ? { deliveryOtp: order.deliveryOtp.trim() }
          : {}),
      },
    });
    setProgressOrder({
      orderType: updatedOrder.orderType ?? order.orderType,
      previousStatus: order.status,
      status: updatedOrder.status ?? nextStatus,
    });
  };
  const handleTerminalStatusAction = async (
    order: OrdersTableRow,
    status: "CANCELLED" | "REJECTED"
  ) => {
    const updatedOrder = await updateStatusMutation.mutateAsync({
      orderId: order.id,
      payload: { status },
    });
    setProgressOrder({
      orderType: updatedOrder.orderType ?? order.orderType,
      previousStatus: order.status,
      status: updatedOrder.status ?? status,
    });
  };
  const handleSendOutForDeliveryAction = async (order: OrdersTableRow) => {
    const updatedOrder = await sendOutForDeliveryMutation.mutateAsync({
      orderId: order.id,
    });
    setProgressOrder({
      orderType: updatedOrder.orderType ?? order.orderType,
      previousStatus: order.status,
      status: updatedOrder.status ?? "OUT_FOR_DELIVERY",
    });
  };
  const handlePaymentStatusAction = async (order: OrdersTableRow) => {
    if (!canUpdatePaymentStatusRole || loadingPaymentStatusOrderId) return;

    const rowTransaction = getPaymentStatusTransaction(order);
    if (rowTransaction?.id) {
      setPaymentStatusOrder({ order, transaction: rowTransaction });
      return;
    }

    setLoadingPaymentStatusOrderId(order.id);

    try {
      const detailedOrder = await getOrderById(order.id);
      const transaction = getPaymentStatusTransaction(detailedOrder);

      if (!transaction?.id) {
        toast.error(t("paymentStatusTransactionMissing"));
        return;
      }

      setPaymentStatusOrder({
        order: {
          ...order,
          paymentMethod: detailedOrder?.paymentMethod ?? order.paymentMethod,
          paymentStatus: detailedOrder?.paymentStatus ?? order.paymentStatus,
          transactions: detailedOrder?.transactions ?? order.transactions,
        },
        transaction,
      });
    } catch {
      toast.error(t("paymentStatusLoadFailed"));
    } finally {
      setLoadingPaymentStatusOrderId(null);
    }
  };

  if (loading) {
    return (
      <>
        <div className="lg:hidden text-sm text-gray-400 py-10 text-center">
          {t("loading")}
        </div>

        <TableSkeleton
          headers={[
            t("date"),
            t("customerInfo"),
            t("address"),
            t("amount"),
            t("statusLabel"),
            t("paymentStatus"),
          ]}
          rows={6}
          showCheckbox
          showActions
        />
      </>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <EmptyState
        title={t("emptyTitle")}
        description={t("emptyDescription")}
      />
    );
  }

  const getOrderRoute = ({ id, isGroupOrder }: OrdersTableRow) =>
    isGroupOrder
      ? `/orders/group/${id}`
      : `/orders/details/${id}`;

  return (
    <div className="space-y-4">

      <div className="hidden max-w-full overflow-hidden lg:block">
        <Table className="table-fixed">
         <TableHeader>
  <TableRow className="border-none">
    <TableHead className="w-10">
      <Checkbox />
    </TableHead>

    {activeTab === "reservations" ? (
      <>
        <SortHeader label={t("reservationId")} sortKey="id" activeKey={sortKey} direction={sortDir} onSort={onSort} />
        <SortHeader label={t("customer")} sortKey="customerName" activeKey={sortKey} direction={sortDir} onSort={onSort} />
        <SortHeader label={t("guests")} sortKey="guestCount" activeKey={sortKey} direction={sortDir} onSort={onSort} />
        <SortHeader label={t("reservationDate")} sortKey="reservationDate" activeKey={sortKey} direction={sortDir} onSort={onSort} />
        <SortHeader label={t("statusLabel")} sortKey="status" activeKey={sortKey} direction={sortDir} onSort={onSort} />
      </>
    ) : (
      <>
        <SortHeader label={t("date")} sortKey="createdAt" activeKey={sortKey} direction={sortDir} onSort={onSort} className="w-[20%]" />
        <SortHeader label={t("customerInfo")} sortKey="customerName" activeKey={sortKey} direction={sortDir} onSort={onSort} className="w-[22%]" />
        <TableHead className="w-[16%]">{t("address")}</TableHead>
        <SortHeader label={t("amount")} sortKey="totalAmount" activeKey={sortKey} direction={sortDir} onSort={onSort} className="w-[11%]" />
        <SortHeader label={t("statusLabel")} sortKey="status" activeKey={sortKey} direction={sortDir} onSort={onSort} className="w-[11%]" />
        <SortHeader label={t("paymentStatus")} sortKey="paymentStatus" activeKey={sortKey} direction={sortDir} onSort={onSort} className="w-[12%]" />
      </>
    )}

    <TableHead className="w-20 text-center">{common("actions")}</TableHead>
  </TableRow>
</TableHeader>

        <TableBody>
  {orders.map((order) => {
    const {
      id,
      customerName,
      guestCount,
      reservationDate,
      status,
      createdAt,
      totalAmount,
      paymentStatus,
    } = order;
    const customerNameValue = getCustomerName(order);
    const customerDetail = getCustomerDetail(order);
    const addressPreview = getAddressPreview(order);
    const canUpdateStatus = Boolean(getNextOrderStatus(order));
    const canSendOutForDelivery = canSendDeliveryOrderOutDirectly(order);
    const canUseTerminalActions = canTerminateOrderStatus(order);
    const orderTime = getOrderTimeDate(order);
    const orderTimeLabel = formatOrderTime(order.orderTime);
    const isPreorder = isFutureOrder(order);
    const canUpdatePaymentStatus =
      canUpdatePaymentStatusRole && paymentStatus !== "REFUNDED";
    const paymentStatusLoading = loadingPaymentStatusOrderId === id;

    return (
    <TableRow key={id} className="border-none h-[70px]">
      <TableCell>
        <Checkbox />
      </TableCell>

      {activeTab === "reservations" ? (
        <>
          <TableCell className="px-4 text-gray-500">
            <span className="block max-w-full truncate" title={id}>
              {id}
            </span>
          </TableCell>

          <TableCell className="px-4 text-gray-600">
            {customerName?.trim() || "-"}
          </TableCell>

          <TableCell className="px-4">
            {guestCount}
          </TableCell>

          <TableCell className="px-4 text-gray-500">
            {formatDateTime24({ value: reservationDate })}
          </TableCell>

          <TableCell className="px-4">
            <span className="text-yellow-600 font-medium">
              {getStatusLabel(status)}
            </span>
          </TableCell>
        </>
      ) : (
        <>
          <TableCell className="px-4 text-gray-500 whitespace-normal">
            <div className="space-y-2">
              <p>{formatShortDate(createdAt)}</p>
              {orderTimeLabel ? (
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  {isPreorder ? (
                    <Badge className="border-primary/20 bg-primary/10 text-primary">
                      <CalendarClock size={12} />
                      {t("preorder")}
                    </Badge>
                  ) : null}
                  <span
                    className="inline-flex max-w-full items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600"
                    title={formatDateTime24({ value: orderTime })}
                  >
                    <CalendarClock size={12} />
                    <span className="truncate">{orderTimeLabel}</span>
                  </span>
                </div>
              ) : (
                <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500">
                  {t("asap")}
                </span>
              )}
            </div>
          </TableCell>

          <TableCell className="px-4 whitespace-normal">
            <div className="min-w-0 space-y-1">
              <p className="truncate font-medium text-gray-700" title={customerNameValue}>
                {customerNameValue}
              </p>
              <p className="break-all text-sm leading-5 text-gray-500" title={customerDetail}>
                {customerDetail}
              </p>
            </div>
          </TableCell>

          <TableCell className="px-4 whitespace-normal">
            <ClickTooltip
              content={
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {t("address")}
                  </p>
                  <p className="whitespace-pre-line break-words font-medium leading-6 text-gray-800">
                    {addressPreview.full}
                  </p>
                </div>
              }
            >
              <button
                type="button"
                className="block w-full min-w-0 cursor-pointer rounded-md text-left outline-none transition-colors hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-primary/40"
                aria-label={addressPreview.full}
              >
                <span className="block truncate font-medium text-gray-700">
                  {addressPreview.primary}
                </span>
                <span className="block truncate text-sm text-gray-500">
                  {addressPreview.secondary}
                </span>
              </button>
            </ClickTooltip>
          </TableCell>

          <TableCell className="px-4 font-medium text-green-600">
            <span className="block truncate">${totalAmount ?? 0}</span>
          </TableCell>

          <TableCell className="px-4">
            <span className="block truncate text-sm font-medium text-yellow-600">
              {getStatusLabel(status)}
            </span>
          </TableCell>

          <TableCell className="px-4">
            <Badge className="max-w-full border-gray-200 bg-gray-100 text-gray-700">
              <span className="truncate">{paymentStatus ? paymentStatus.replaceAll("_", " ") : "-"}</span>
            </Badge>
          </TableCell>
        </>
      )}

      <TableCell className="px-4">
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <button
            type="button"
            className="p-2 hover:text-primary"
            onClick={() => router.push(getOrderRoute(order))}
            aria-label={t("viewOrderDetails")}
          >
            <Eye size={18} />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-2 hover:text-primary"
                aria-label={t("orderActions")}
              >
                <MoreHorizontal size={18} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => router.push(getOrderRoute(order))}>
                <Eye size={16} />
                {common("viewDetails")}
              </DropdownMenuItem>
              {canUpdateStatus ? (
                <DropdownMenuItem
                  disabled={updateStatusMutation.isPending}
                  onClick={() => {
                    void handleStatusAction(order);
                  }}
                >
                  <RefreshCw size={16} />
                  {getStatusActionLabel(order)}
                </DropdownMenuItem>
              ) : null}
              {canSendOutForDelivery ? (
                <DropdownMenuItem
                  disabled={sendOutForDeliveryMutation.isPending}
                  onClick={() => {
                    void handleSendOutForDeliveryAction(order);
                  }}
                >
                  <Truck size={16} />
                  {t("sendOutForDeliveryDirect")}
                </DropdownMenuItem>
              ) : null}
              {canUpdatePaymentStatus ? (
                <DropdownMenuItem
                  disabled={paymentStatusLoading}
                  onClick={() => {
                    void handlePaymentStatusAction(order);
                  }}
                >
                  <CreditCard size={16} />
                  {paymentStatusLoading ? t("loadingPaymentStatus") : t("updatePaymentStatus")}
                </DropdownMenuItem>
              ) : null}
              {canUseTerminalActions ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={updateStatusMutation.isPending}
                    variant="destructive"
                    onClick={() => {
                      void handleTerminalStatusAction(order, "CANCELLED");
                    }}
                  >
                    <XCircle size={16} />
                    {t(ORDER_TERMINAL_ACTION_LABEL_KEYS.CANCELLED)}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={updateStatusMutation.isPending}
                    variant="destructive"
                    onClick={() => {
                      void handleTerminalStatusAction(order, "REJECTED");
                    }}
                  >
                    <Ban size={16} />
                    {t(ORDER_TERMINAL_ACTION_LABEL_KEYS.REJECTED)}
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
  })}
</TableBody>
        </Table>
      </div>

      <OrderStatusUpdateDialog
        open={Boolean(statusOrder)}
        order={statusOrder}
        onOpenChange={(open) => {
          if (!open) setStatusOrder(null);
        }}
        onStatusUpdated={setProgressOrder}
      />
      <OrderStatusProgressDialog
        open={Boolean(progressOrder)}
        order={progressOrder}
        onOpenChange={(open) => {
          if (!open) setProgressOrder(null);
        }}
      />
      <PaymentStatusUpdateDialog
        open={Boolean(paymentStatusOrder)}
        orderId={paymentStatusOrder?.order.id}
        orderPaymentStatus={paymentStatusOrder?.order.paymentStatus}
        paymentMethod={paymentStatusOrder?.order.paymentMethod}
        transaction={paymentStatusOrder?.transaction}
        onOpenChange={(open) => {
          if (!open) setPaymentStatusOrder(null);
        }}
      />
    </div>
  );
}
