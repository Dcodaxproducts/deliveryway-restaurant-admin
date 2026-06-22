"use client";

import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCurrency } from "@/hooks/useCurrency";
import { useUpdatePaymentTransactionStatus } from "@/hooks/useOrders";
import type { PaymentTransaction } from "@/types/orders";

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

type PaymentStatusUpdateDialogProps = {
  open: boolean;
  orderId?: string | null;
  orderPaymentStatus?: string | null;
  paymentMethod?: string | null;
  transaction?: PaymentTransaction | null;
  onOpenChange: (open: boolean) => void;
};

export function PaymentStatusUpdateDialog({
  open,
  orderId,
  orderPaymentStatus,
  paymentMethod,
  transaction,
  onOpenChange,
}: PaymentStatusUpdateDialogProps) {
  const t = useTranslations("orders");
  const { formatMoney } = useCurrency();
  const paymentStatusMutation = useUpdatePaymentTransactionStatus(orderId);
  const [paymentStatus, setPaymentStatus] = useState<AdminPaymentStatus>("PAID");
  const [paymentStatusNote, setPaymentStatusNote] = useState(t("paymentStatusNote"));
  const [isConfirming, setIsConfirming] = useState(false);
  const selectedPaymentMethodKey = paymentMethod?.toUpperCase();
  const submitDisabled =
    paymentStatusMutation.isPending || !transaction?.id || !paymentStatusNote.trim();

  useEffect(() => {
    if (!open) return;

    setPaymentStatus(
      orderPaymentStatus === "FAILED"
        ? "FAILED"
        : orderPaymentStatus === "CANCELLED"
          ? "CANCELLED"
          : "PAID"
    );
    setPaymentStatusNote(t("paymentStatusNote"));
    setIsConfirming(false);
  }, [open, orderPaymentStatus, t]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setIsConfirming(false);
    }

    onOpenChange(nextOpen);
  };

  const handleSubmit = () => {
    if (!transaction?.id || submitDisabled) return;

    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }

    paymentStatusMutation.mutate(
      {
        paymentId: transaction.id,
        status: paymentStatus,
        note: paymentStatusNote.trim(),
      },
      {
        onSuccess: () => {
          handleOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
                  {formatStatus(orderPaymentStatus)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-400">
                  {t("transactionStatus")}
                </p>
                <p className="mt-1 text-sm font-bold text-gray-950">
                  {formatStatus(transaction?.status)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-400">
                  {t("amount")}
                </p>
                <p className="mt-1 text-sm font-bold text-gray-950">
                  {formatMoney(transaction?.amount, transaction?.currency)}
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
                setIsConfirming(false);
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
                setIsConfirming(false);
              }}
              rows={4}
              className="resize-y rounded-xl border-gray-200 text-sm"
            />
          </div>

          {isConfirming ? (
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
            onClick={() => handleOpenChange(false)}
            disabled={paymentStatusMutation.isPending}
            className="h-10 rounded-xl border-gray-200"
          >
            {t("cancelPaymentStatusUpdate")}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitDisabled}
            className="h-10 rounded-xl bg-primary text-white hover:bg-primary/90"
          >
            {paymentStatusMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            {paymentStatusMutation.isPending
              ? t("updatingPaymentStatus")
              : isConfirming
                ? t("confirmPaymentStatusUpdate")
                : t("continuePaymentStatusUpdate")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
