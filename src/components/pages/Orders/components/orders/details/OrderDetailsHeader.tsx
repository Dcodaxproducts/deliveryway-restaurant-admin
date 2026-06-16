"use client";

import { useState } from "react";
import { RefreshCw, Truck } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { useUpdateOrderStatus } from "@/hooks/useOrders";
import {
  canDirectlyUpdateOrderStatus,
  getNextOrderStatus,
  ORDER_STATUS_ACTION_LABEL_KEYS,
} from "@/lib/order-status-transitions";
import { ORDER_STATUS_LABEL_KEYS } from "@/lib/status-labels";
import { OrderStatusUpdateDialog } from "@/components/pages/Orders/components/orders/OrderStatusUpdateDialog";

type OrderDetailsHeaderProps = {
  order: {
    id: string;
    orderType?: string | null;
    status: string;
    orderTime?: string;
    deliveryOtp?: string;
  };
};

const OrderDetailsHeader = ({ order }: OrderDetailsHeaderProps) => {
  const t = useTranslations("orders");
  const common = useTranslations("common");
  const updateStatusMutation = useUpdateOrderStatus();

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  const nextStatus = getNextOrderStatus(order);
  const statusLabel = ORDER_STATUS_LABEL_KEYS[order.status]
    ? t(ORDER_STATUS_LABEL_KEYS[order.status])
    : order.status;
  const canUpdateStatus = Boolean(nextStatus);
  const actionLabel = nextStatus && ORDER_STATUS_ACTION_LABEL_KEYS[nextStatus]
    ? t(ORDER_STATUS_ACTION_LABEL_KEYS[nextStatus])
    : common("updateStatus");

  const breadcrumbParts = t("breadcrumbDetails").split(" / ");

  const handleStatusAction = async () => {
    if (!nextStatus) {
      return;
    }

    if (!canDirectlyUpdateOrderStatus(order)) {
      setStatusDialogOpen(true);
      return;
    }

    await updateStatusMutation.mutateAsync({
      orderId: order.id,
      payload: {
        status: nextStatus,
        ...(order.deliveryOtp?.trim()
          ? { deliveryOtp: order.deliveryOtp.trim() }
          : {}),
      },
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
        </div>
      </div>

      <OrderStatusUpdateDialog
        open={statusDialogOpen}
        order={order}
        onOpenChange={setStatusDialogOpen}
      />
    </>
  );
};

export default OrderDetailsHeader;
