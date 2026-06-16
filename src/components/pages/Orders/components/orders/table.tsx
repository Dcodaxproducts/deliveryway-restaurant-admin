"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Ban, Eye, MoreHorizontal, RefreshCw, XCircle } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import { useRouter } from "next/navigation";
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
import { useUpdateOrderStatus } from "@/hooks/useOrders";
import {
  canDirectlyUpdateOrderStatus,
  canTerminateOrderStatus,
  getNextOrderStatus,
  ORDER_STATUS_ACTION_LABEL_KEYS,
  ORDER_TERMINAL_ACTION_LABEL_KEYS,
} from "@/lib/order-status-transitions";
import { ORDER_STATUS_LABEL_KEYS } from "@/lib/status-labels";
import type { Order } from "@/types/orders";
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
  const common = useTranslations("common");
  const t = useTranslations("orders");
  const [statusOrder, setStatusOrder] = useState<OrdersTableRow | null>(null);
  const [progressOrder, setProgressOrder] = useState<OrderStatusProgressState | null>(null);
  const updateStatusMutation = useUpdateOrderStatus();
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

  if (loading) {
    return (
      <>
        <div className="lg:hidden text-sm text-gray-400 py-10 text-center">
          {t("loading")}
        </div>

        <TableSkeleton
          headers={[
            t("orderId"),
            t("date"),
            t("customerInfo"),
            t("address"),
            t("amount"),
            t("statusLabel"),
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

      <div className="hidden lg:block">
        <Table>
         <TableHeader>
  <TableRow className="border-none">
    <TableHead className="w-[50px]">
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
        <SortHeader label={t("orderId")} sortKey="id" activeKey={sortKey} direction={sortDir} onSort={onSort} />
        <SortHeader label={t("date")} sortKey="createdAt" activeKey={sortKey} direction={sortDir} onSort={onSort} />
        <SortHeader label={t("customerInfo")} sortKey="customerName" activeKey={sortKey} direction={sortDir} onSort={onSort} />
        <TableHead>{t("address")}</TableHead>
        <SortHeader label={t("amount")} sortKey="totalAmount" activeKey={sortKey} direction={sortDir} onSort={onSort} />
        <SortHeader label={t("statusLabel")} sortKey="status" activeKey={sortKey} direction={sortDir} onSort={onSort} />
      </>
    )}

    <TableHead className="text-center">{common("actions")}</TableHead>
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
    } = order;
    const customerNameValue = getCustomerName(order);
    const customerDetail = getCustomerDetail(order);
    const addressPreview = getAddressPreview(order);
    const canUpdateStatus = Boolean(getNextOrderStatus(order));
    const canUseTerminalActions = canTerminateOrderStatus(order);

    return (
    <TableRow key={id} className="border-none h-[70px]">
      <TableCell>
        <Checkbox />
      </TableCell>

      {activeTab === "reservations" ? (
        <>
          <TableCell className="px-4 text-gray-500">{id}</TableCell>

          <TableCell className="px-4 text-gray-600">
            {customerName?.trim() || "-"}
          </TableCell>

          <TableCell className="px-4">
            {guestCount}
          </TableCell>

          <TableCell className="px-4 text-gray-500">
            {reservationDate
              ? new Date(reservationDate).toLocaleString()
              : "-"}
          </TableCell>

          <TableCell className="px-4">
            <span className="text-yellow-600 font-medium">
              {getStatusLabel(status)}
            </span>
          </TableCell>
        </>
      ) : (
        <>
          <TableCell className="px-4 text-gray-500">{id}</TableCell>

          <TableCell className="px-4 text-gray-500">
            {createdAt
              ? new Date(createdAt).toLocaleDateString()
              : "-"}
          </TableCell>

          <TableCell className="max-w-[260px] px-4 whitespace-normal">
            <div className="min-w-0 space-y-1">
              <p className="truncate font-medium text-gray-700" title={customerNameValue}>
                {customerNameValue}
              </p>
              <p className="break-all text-sm leading-5 text-gray-500" title={customerDetail}>
                {customerDetail}
              </p>
            </div>
          </TableCell>

          <TableCell className="max-w-[260px] px-4">
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
            ${totalAmount ?? 0}
          </TableCell>

          <TableCell className="px-4">
            <span className="text-sm font-medium text-yellow-600">
              {getStatusLabel(status)}
            </span>
          </TableCell>
        </>
      )}

      <TableCell className="px-4">
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <button
            type="button"
            className="p-2 hover:text-primary"
            onClick={() => router.push(getOrderRoute(order))}
          >
            <Eye size={18} />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="p-2 hover:text-primary">
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
    </div>
  );
}
