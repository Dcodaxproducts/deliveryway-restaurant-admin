"use client";

import { useState } from "react";
import { Ban, RefreshCw, Truck, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { useSendOrderOutForDelivery, useUpdateOrderStatus } from "@/hooks/useOrders";
import {
  canDirectlyUpdateOrderStatus,
  canSendDeliveryOrderOutDirectly,
  canTerminateOrderStatus,
  getNextOrderStatus,
  ORDER_STATUS_ACTION_LABEL_KEYS,
  ORDER_TERMINAL_ACTION_LABEL_KEYS,
} from "@/lib/order-status-transitions";
import { ORDER_STATUS_LABEL_KEYS } from "@/lib/status-labels";
import { OrderStatusUpdateDialog } from "@/components/pages/Orders/components/orders/OrderStatusUpdateDialog";
import { OrderStatusProgressDialog } from "@/components/pages/Orders/components/orders/OrderStatusProgressDialog";

type OrderDetailsHeaderProps = {
  order: {
    id: string;
    orderType?: string | null;
    status: string;
    orderTime?: string;
    isScheduled?: boolean | null;
    deliveryOtp?: string;
  };
};

type OrderStatusProgressState = {
  orderType?: string | null;
  previousStatus?: string | null;
  status?: string | null;
};

const OrderDetailsHeader = ({ order }: OrderDetailsHeaderProps) => {
  const t = useTranslations("orders");
  const common = useTranslations("common");
  const updateStatusMutation = useUpdateOrderStatus();
  const sendOutForDeliveryMutation = useSendOrderOutForDelivery();

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [progressOrder, setProgressOrder] = useState<OrderStatusProgressState | null>(null);

  const nextStatus = getNextOrderStatus(order);
  const statusLabel = ORDER_STATUS_LABEL_KEYS[order.status]
    ? t(ORDER_STATUS_LABEL_KEYS[order.status])
    : order.status;
  const canUpdateStatus = Boolean(nextStatus);
  const canSendOutForDelivery = canSendDeliveryOrderOutDirectly(order);
  const actionLabel = nextStatus && ORDER_STATUS_ACTION_LABEL_KEYS[nextStatus]
    ? t(ORDER_STATUS_ACTION_LABEL_KEYS[nextStatus])
    : common("updateStatus");
  const canUseTerminalActions = canTerminateOrderStatus(order);

  const breadcrumbParts = t("breadcrumbDetails").split(" / ");

  const handleStatusAction = async () => {
    if (!nextStatus) {
      return;
    }

    if (!canDirectlyUpdateOrderStatus(order)) {
      setStatusDialogOpen(true);
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

  const handleTerminalStatusAction = async (status: "CANCELLED" | "REJECTED") => {
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
  const handleSendOutForDeliveryAction = async () => {
    const updatedOrder = await sendOutForDeliveryMutation.mutateAsync({
      orderId: order.id,
    });
    setProgressOrder({
      orderType: updatedOrder.orderType ?? order.orderType,
      previousStatus: order.status,
      status: updatedOrder.status ?? "OUT_FOR_DELIVERY",
    });
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        {/* Left Section */}
        <div className="flex flex-col gap-1">
          <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 break-all">
            {t("detailsTitle", { id: order.id })}
          </h1>

          <p className="text-xs sm:text-sm text-gray-500">
            <span className="text-primary">{breadcrumbParts[0]} /</span>{" "}
            {breadcrumbParts[1]}
          </p>
        </div>

        {/* Right Section */}
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* Existing Status Display */}
          <Button
            type="button"
            variant="ghost"
            className="w-full sm:w-auto justify-center sm:justify-start rounded-[10px] h-10 bg-green-500 text-white hover:bg-green-500 text-xs sm:text-sm font-medium px-4 flex items-center gap-2 cursor-default"
          >
            <Truck size={16} className="sm:w-[18px] sm:h-[18px]" />
            {statusLabel}
          </Button>

          {canUpdateStatus ? (
            <Button
              type="button"
              variant="outline"
              disabled={updateStatusMutation.isPending}
              onClick={() => {
                void handleStatusAction();
              }}
              className="w-full sm:w-auto justify-center rounded-[10px] h-10 text-xs sm:text-sm font-medium px-4 flex items-center gap-2"
            >
              <RefreshCw size={16} />
              {actionLabel}
            </Button>
          ) : null}

          {canSendOutForDelivery ? (
            <Button
              type="button"
              variant="outline"
              disabled={sendOutForDeliveryMutation.isPending}
              onClick={() => {
                void handleSendOutForDeliveryAction();
              }}
              className="w-full justify-center rounded-[10px] border-primary/30 bg-primary/5 px-4 text-xs font-medium text-primary hover:bg-primary/10 hover:text-primary sm:w-auto sm:text-sm"
            >
              <Truck size={16} />
              {t("sendOutForDeliveryDirect")}
            </Button>
          ) : null}

          {canUseTerminalActions ? (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={updateStatusMutation.isPending}
                onClick={() => {
                  void handleTerminalStatusAction("CANCELLED");
                }}
                className="w-full sm:w-auto justify-center rounded-[10px] h-10 text-xs sm:text-sm font-medium px-4 flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <XCircle size={16} />
                {t(ORDER_TERMINAL_ACTION_LABEL_KEYS.CANCELLED)}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={updateStatusMutation.isPending}
                onClick={() => {
                  void handleTerminalStatusAction("REJECTED");
                }}
                className="w-full sm:w-auto justify-center rounded-[10px] h-10 text-xs sm:text-sm font-medium px-4 flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Ban size={16} />
                {t(ORDER_TERMINAL_ACTION_LABEL_KEYS.REJECTED)}
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <OrderStatusUpdateDialog
        open={statusDialogOpen}
        order={order}
        onOpenChange={setStatusDialogOpen}
        onStatusUpdated={setProgressOrder}
      />
      <OrderStatusProgressDialog
        open={Boolean(progressOrder)}
        order={progressOrder}
        onOpenChange={(open) => {
          if (!open) setProgressOrder(null);
        }}
      />
    </>
  );
};

export default OrderDetailsHeader;
