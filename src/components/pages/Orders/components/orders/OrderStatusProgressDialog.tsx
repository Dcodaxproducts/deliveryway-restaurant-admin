"use client";

import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getOrderStatusProgressSteps } from "@/lib/order-status-transitions";
import { ORDER_STATUS_LABEL_KEYS } from "@/lib/status-labels";

type OrderStatusProgressDialogProps = {
  open: boolean;
  order: {
    orderType?: string | null;
    previousStatus?: string | null;
    status?: string | null;
  } | null;
  onOpenChange: (open: boolean) => void;
};

export function OrderStatusProgressDialog({
  open,
  order,
  onOpenChange,
}: OrderStatusProgressDialogProps) {
  const common = useTranslations("common");
  const t = useTranslations("orders");
  const steps = getOrderStatusProgressSteps({
    orderType: order?.orderType,
    previousStatus: order?.previousStatus,
    status: order?.status,
  });

  const getStepLabel = (status: string) =>
    ORDER_STATUS_LABEL_KEYS[status] ? t(ORDER_STATUS_LABEL_KEYS[status]) : status;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[460px] rounded-[24px] border-0 bg-white p-6 shadow-xl">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-[22px] font-bold text-gray-950">
            {t("statusProgressTitle")}
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-gray-500">
            {t("statusProgressDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-5 space-y-3">
          {steps.map((status) => (
            <div
              key={status}
              className="flex items-center gap-3 rounded-[14px] bg-gray-50 px-3 py-2.5"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                <CheckCircle2 size={17} />
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {getStepLabel(status)}
              </span>
            </div>
          ))}
        </div>

        <DialogFooter className="mt-6">
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-[44px] w-full rounded-full bg-primary text-white hover:bg-primary/90 sm:w-auto"
          >
            {common("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
