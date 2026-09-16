"use client";

import { useEffect, useRef, useState } from "react";
import {
  Ban,
  CalendarClock,
  Printer,
  RefreshCw,
  Truck,
  XCircle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import PageHeader from "@/components/common/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import {
  useSendOrderOutForDelivery,
  useSendOrderWithExternalDriver,
  useUpdateOrderStatus,
} from "@/hooks/useOrders";
import { reprintOrder } from "@/lib/accepted-order-printing";
import {
  canDirectlyUpdateOrderStatus,
  canSendDeliveryOrderOutDirectly,
  canTerminateOrderStatus,
  canUseExternalDeliveryFulfillment,
  getNextOrderStatus,
  ORDER_STATUS_ACTION_LABEL_KEYS,
  ORDER_TERMINAL_ACTION_LABEL_KEYS,
} from "@/lib/order-status-transitions";
import { ORDER_STATUS_LABEL_KEYS } from "@/lib/status-labels";
import { OrderStatusUpdateDialog } from "@/components/pages/Orders/components/orders/OrderStatusUpdateDialog";
import { OrderStatusProgressDialog } from "@/components/pages/Orders/components/orders/OrderStatusProgressDialog";
import { isFutureOrder } from "@/components/pages/Orders/utils/orders-schedule-filters";
import { formatDateTime24 } from "@/lib/date-time-format";

type OrderDetailsHeaderProps = {
  order: {
    id: string;
    restaurantId?: string | null;
    branchId?: string | null;
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const updateStatusMutation = useUpdateOrderStatus();
  const sendOutForDeliveryMutation = useSendOrderOutForDelivery();
  const externalDriverMutation = useSendOrderWithExternalDriver();

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const handledAutoOpen = useRef(false);
  const [isReprinting, setIsReprinting] = useState(false);
  const [progressOrder, setProgressOrder] =
    useState<OrderStatusProgressState | null>(null);

  const nextStatus = getNextOrderStatus(order);
  const statusLabel = ORDER_STATUS_LABEL_KEYS[order.status]
    ? t(ORDER_STATUS_LABEL_KEYS[order.status])
    : order.status;
  const canUpdateStatus = Boolean(nextStatus);
  const canSendOutForDelivery = canSendDeliveryOrderOutDirectly(order);
  const canUseExternalDriver = canUseExternalDeliveryFulfillment(order);
  const actionLabel =
    nextStatus && ORDER_STATUS_ACTION_LABEL_KEYS[nextStatus]
      ? t(ORDER_STATUS_ACTION_LABEL_KEYS[nextStatus])
      : common("updateStatus");
  const canUseTerminalActions = canTerminateOrderStatus(order);
  const isPreorder = isFutureOrder({
    isScheduled: order.isScheduled === true,
    orderTime: order.orderTime,
  });
  const scheduledTime = isPreorder
    ? formatDateTime24({ value: order.orderTime })
    : null;

  useEffect(() => {
    if (handledAutoOpen.current || searchParams.get("acceptOrder") !== "1") {
      return;
    }

    handledAutoOpen.current = true;
    router.replace(`/orders/details/${order.id}`, { scroll: false });
    if (nextStatus && !canDirectlyUpdateOrderStatus(order)) {
      setStatusDialogOpen(true);
    }
  }, [nextStatus, order, router, searchParams]);

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

  const handleTerminalStatusAction = async (
    status: "CANCELLED" | "REJECTED",
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
  const handleExternalDriverAction = async () => {
    const updatedOrder = await externalDriverMutation.mutateAsync({
      orderId: order.id,
    });
    setProgressOrder({
      orderType: updatedOrder.orderType ?? order.orderType,
      previousStatus: order.status,
      status: updatedOrder.status ?? "OUT_FOR_DELIVERY",
    });
  };
  const handleReprintAction = async () => {
    const restaurantId = order.restaurantId ?? user?.restaurantId;
    if (!restaurantId || isReprinting) return;

    setIsReprinting(true);
    try {
      const result = await reprintOrder({
        orderId: order.id,
        restaurantId,
        branchId: order.branchId ?? undefined,
      });
      if (result === "printed") toast.success(t("orderReprinted"));
      else toast.error(t("orderPrintUnavailable"));
    } catch {
      toast.error(t("orderPrintFailed"));
    } finally {
      setIsReprinting(false);
    }
  };

  return (
    <>
      {isPreorder && scheduledTime ? (
        <div
          className="mb-5 flex items-center gap-3 rounded-xl border-2 border-red-600 bg-red-50 px-4 py-3 text-red-900 shadow-sm"
          role="status"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-red-600 text-white">
            <CalendarClock size={24} />
          </span>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em]">
              {t("preorder")}
            </p>
            <p className="text-lg font-extrabold sm:text-xl">{scheduledTime}</p>
          </div>
        </div>
      ) : null}
      <PageHeader
        className="mb-6"
        title={t("detailsTitle", { id: order.id })}
        breadcrumbs={
          <p className="text-sm text-[var(--ui-text-muted)]">
            <span className="text-primary">{breadcrumbParts[0]}</span>
            <span aria-hidden="true"> / </span>
            {breadcrumbParts[1]}
          </p>
        }
        actions={
          <>
            <span className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[var(--ui-radius-control)] bg-emerald-500 px-4 text-sm font-medium text-white sm:w-auto">
              <Truck size={16} className="sm:w-[18px] sm:h-[18px]" />
              {statusLabel}
            </span>

            <Button
              type="button"
              variant="outline"
              disabled={
                isReprinting || !(order.restaurantId ?? user?.restaurantId)
              }
              onClick={() => {
                void handleReprintAction();
              }}
              className="w-full gap-2 sm:w-auto"
            >
              <Printer size={16} />
              {isReprinting ? t("reprintingOrder") : t("reprintOrder")}
            </Button>

            {canUpdateStatus ? (
              <Button
                type="button"
                variant="outline"
                disabled={updateStatusMutation.isPending}
                onClick={() => {
                  void handleStatusAction();
                }}
                className="w-full gap-2 sm:w-auto"
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
                className="w-full border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary sm:w-auto"
              >
                <Truck size={16} />
                {t("sendOutForDeliveryDirect")}
              </Button>
            ) : null}

            {canUseExternalDriver ? (
              <Button
                type="button"
                variant="outline"
                disabled={externalDriverMutation.isPending}
                onClick={() => {
                  void handleExternalDriverAction();
                }}
                className="w-full border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary sm:w-auto"
              >
                <Truck size={16} />
                {t("externalDriver")}
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
                  className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 sm:w-auto"
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
                  className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 sm:w-auto"
                >
                  <Ban size={16} />
                  {t(ORDER_TERMINAL_ACTION_LABEL_KEYS.REJECTED)}
                </Button>
              </>
            ) : null}
          </>
        }
      />

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
