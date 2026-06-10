"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Loader2,
  TimerReset,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateOrderStatus } from "@/hooks/useOrders";
import { ORDER_STATUS_OPTIONS } from "@/types/orders";
import { ORDER_STATUS_LABEL_KEYS } from "@/lib/status-labels";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import {
  orderStatusUpdateSchema,
  type OrderStatusUpdateValues,
} from "@/validations/orders";

type OrderStatusUpdateDialogProps = {
  open: boolean;
  order: { id: string; status?: string } | null;
  onOpenChange: (open: boolean) => void;
};

const defaultValues: OrderStatusUpdateValues = {
  status: "",
  deliveryOtp: "",
};

type DeliveryDurationOption = {
  key: "20min" | "40min" | "60min" | "custom";
  labelKey: string;
  minutes?: number;
};

const deliveryDurationOptions: DeliveryDurationOption[] = [
  { key: "20min", labelKey: "deliveryDuration20Min", minutes: 20 },
  { key: "40min", labelKey: "deliveryDuration40Min", minutes: 40 },
  { key: "60min", labelKey: "deliveryDuration60Min", minutes: 60 },
  { key: "custom", labelKey: "deliveryDurationCustom" },
];

const getFutureOrderTimeIso = (minutes: number) => {
  const orderTime = new Date();
  orderTime.setMinutes(orderTime.getMinutes() + Math.max(minutes, 1));
  orderTime.setSeconds(0, 0);

  return orderTime.toISOString();
};

export function OrderStatusUpdateDialog({
  open,
  order,
  onOpenChange,
}: OrderStatusUpdateDialogProps) {
  const updateStatusMutation = useUpdateOrderStatus();
  const common = useTranslations("common");
  const t = useTranslations("orders");
  const [durationKey, setDurationKey] =
    useState<DeliveryDurationOption["key"]>("20min");
  const [customHours, setCustomHours] = useState("0");
  const [customMinutes, setCustomMinutes] = useState("20");
  const [mode, setMode] = useState<"main" | "custom">("main");
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<OrderStatusUpdateValues>({
    resolver: zodResolver(orderStatusUpdateSchema),
    defaultValues,
    values: {
      status: order?.status || "",
      deliveryOtp: "",
    },
  });
  const selectedStatus = useWatch({ control, name: "status" });
  const isAcceptingPlacedOrder =
    order?.status === "PLACED" && selectedStatus === "CONFIRMED";
  const isLoading = updateStatusMutation.isPending;
  const selectedMinutes = useMemo(() => {
    if (durationKey === "custom") {
      return Number(customHours || 0) * 60 + Number(customMinutes || 0);
    }

    return (
      deliveryDurationOptions.find((item) => item.key === durationKey)
        ?.minutes ?? 20
    );
  }, [customHours, customMinutes, durationKey]);
  const deliveryTimePreview = useMemo(() => {
    const deliveryTime = new Date(getFutureOrderTimeIso(selectedMinutes));

    return deliveryTime.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }, [selectedMinutes]);
  const durationText = useMemo(() => {
    const hours = Math.floor(selectedMinutes / 60);
    const minutes = selectedMinutes % 60;
    const parts: string[] = [];

    if (hours > 0) parts.push(t("durationHours", { count: hours }));
    if (minutes > 0) {
      parts.push(t("durationMinutes", { count: minutes }));
    }

    return parts.length ? parts.join(` ${t("and")} `) : t("durationOneMinute");
  }, [selectedMinutes, t]);

  const resetDurationState = () => {
    setDurationKey("20min");
    setCustomHours("0");
    setCustomMinutes("20");
    setMode("main");
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetDurationState();
      reset(defaultValues);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: OrderStatusUpdateValues) => {
    if (!order) return;

    const orderTimeIso = isAcceptingPlacedOrder
      ? getFutureOrderTimeIso(selectedMinutes)
      : null;

    await updateStatusMutation.mutateAsync({
      orderId: order.id,
      payload: {
        status: values.status,
        ...(values.deliveryOtp?.trim()
          ? { deliveryOtp: values.deliveryOtp.trim() }
          : {}),
        ...(orderTimeIso ? { orderTime: orderTimeIso } : {}),
      },
    });
    handleOpenChange(false);
  };

  const handleDurationClick = (key: DeliveryDurationOption["key"]) => {
    setDurationKey(key);

    if (key === "custom") {
      setMode("custom");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-[520px] overflow-y-auto rounded-[28px] border-0 bg-white p-0">
        {mode === "main" ? (
          <form
            className="p-5 sm:p-7"
            noValidate
            onSubmit={handleSubmit(onSubmit)}
          >
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-[24px] font-bold text-gray-950">
                {isAcceptingPlacedOrder
                  ? t("acceptOrderTitle")
                  : t("updateStatusTitle")}
              </DialogTitle>
              <DialogDescription className="text-sm leading-6 text-gray-500">
                {isAcceptingPlacedOrder
                  ? t("acceptOrderDescription")
                  : t("updateStatusDescription")}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 space-y-2">
              <Label htmlFor="order-status">{common("status")}</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isLoading}
                  >
                    <SelectTrigger
                      id="order-status"
                      className="h-[52px] rounded-[14px]"
                    >
                      <SelectValue placeholder={common("selectStatus")} />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {ORDER_STATUS_LABEL_KEYS[status.value]
                            ? t(ORDER_STATUS_LABEL_KEYS[status.value])
                            : status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.status?.message ? (
                <p className="text-sm text-red-500">{errors.status.message}</p>
              ) : null}
            </div>

            {isAcceptingPlacedOrder ? (
              <div className="mt-4 rounded-[20px] bg-gray-50 p-4">
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-[14px] bg-white text-primary shadow-sm">
                    <TimerReset size={19} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-950">
                      {t("deliveryScheduleTitle")}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      {t("deliveryScheduleDescription")}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {deliveryDurationOptions.map((item) => {
                    const active = durationKey === item.key;

                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleDurationClick(item.key)}
                        disabled={isLoading}
                        className={cn(
                          "flex h-[82px] flex-col items-center justify-center gap-2 rounded-[16px] border bg-white transition hover:border-primary/40",
                          active
                            ? "border-primary shadow-sm"
                            : "border-transparent",
                        )}
                      >
                        <Clock3
                          size={19}
                          className={active ? "text-primary" : "text-gray-400"}
                        />
                        <span className="text-sm font-semibold text-gray-950">
                          {t(item.labelKey)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 flex gap-3 rounded-[16px] border-l-4 border-primary bg-white p-4">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Clock3 size={17} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {t("deliveryTimeWillBe")}{" "}
                      <span className="text-primary">
                        {deliveryTimePreview}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {t("deliveryTimeDurationNote", {
                        duration: durationText,
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-4 space-y-2">
              <Label htmlFor="order-delivery-otp">{t("deliveryOtp")}</Label>
              <Input
                id="order-delivery-otp"
                placeholder={common("optional")}
                disabled={isLoading}
                {...register("deliveryOtp")}
              />
              {errors.deliveryOtp?.message ? (
                <p className="text-sm text-red-500">
                  {errors.deliveryOtp.message}
                </p>
              ) : null}
            </div>

            <DialogFooter className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:space-x-0">
              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                onClick={() => handleOpenChange(false)}
                className="h-[48px] flex-1 rounded-full border-primary text-primary hover:bg-primary/5"
              >
                {common("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="h-[48px] flex-1 rounded-full bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90"
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  common("updateStatus")
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="p-5 sm:p-7">
            <DialogHeader>
              <DialogTitle className="text-[24px] font-bold text-gray-950">
                {t("setCustomDeliveryTime")}
              </DialogTitle>
              <DialogDescription className="text-sm leading-6 text-gray-500">
                {t("customDeliveryTimeDescription")}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="custom-delivery-hours">{t("hours")}</Label>
                <select
                  id="custom-delivery-hours"
                  value={customHours}
                  onChange={(event) => setCustomHours(event.target.value)}
                  disabled={isLoading}
                  className="mt-2 h-[52px] w-full rounded-full bg-gray-100 px-5 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {Array.from({ length: 13 }).map((_, index) => (
                    <option key={index} value={String(index)}>
                      {String(index).padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="custom-delivery-minutes">{t("minutes")}</Label>
                <select
                  id="custom-delivery-minutes"
                  value={customMinutes}
                  onChange={(event) => setCustomMinutes(event.target.value)}
                  disabled={isLoading}
                  className="mt-2 h-[52px] w-full rounded-full bg-gray-100 px-5 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {[0, 5, 10, 15, 20, 30, 40, 45, 50].map((minute) => (
                    <option key={minute} value={String(minute)}>
                      {String(minute).padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3 rounded-[16px] border-l-4 border-primary bg-gray-50 p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white">
                <Clock3 size={17} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {t("deliveryTimeWillBe")}{" "}
                  <span className="text-primary">{deliveryTimePreview}</span>
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {t("deliveryTimeDurationNote", { duration: durationText })}
                </p>
              </div>
            </div>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row">
              <Button
                type="button"
                variant="ghost"
                disabled={isLoading}
                onClick={() => {
                  setMode("main");
                  setDurationKey("20min");
                }}
                className="h-[48px] flex-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                <ArrowLeft size={17} />
                {t("back")}
              </Button>

              <Button
                type="button"
                disabled={isLoading}
                onClick={() => setMode("main")}
                className="h-[48px] flex-1 rounded-full bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90"
              >
                {t("confirmSetTime")}
                <CheckCircle2 size={17} />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
