"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Loader2,
  TimerReset,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { DateTimePickerField } from "@/components/forms/common/DateTimePickerField";
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
import { cn } from "@/lib/utils";
import { ORDER_STATUS_LABEL_KEYS } from "@/lib/status-labels";
import { ORDER_STATUS_OPTIONS } from "@/types/orders";
import {
  orderStatusUpdateSchema,
  type OrderStatusUpdateValues,
} from "@/validations/orders";
import { useTranslations } from "next-intl";

type OrderStatusUpdateDialogProps = {
  open: boolean;
  order: { id: string; status?: string; orderTime?: string; deliveryOtp?: string } | null;
  onOpenChange: (open: boolean) => void;
};

type DurationOption = {
  key: "20min" | "40min" | "60min" | "custom";
  labelKey: string;
  minutes?: number;
};

const durationOptions: DurationOption[] = [
  { key: "20min", labelKey: "duration20Min", minutes: 20 },
  { key: "40min", labelKey: "duration40Min", minutes: 40 },
  { key: "60min", labelKey: "duration60Min", minutes: 60 },
  { key: "custom", labelKey: "durationCustom" },
];

const defaultValues: OrderStatusUpdateValues = {
  status: "",
  deliveryOtp: "",
};

const formatDateTime = (date?: Date | null) => {
  if (!date || Number.isNaN(date.getTime())) return null;

  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const parseOrderTime = (value?: string) => {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const buildFutureOrderTime = (minutes: number) => {
  const date = new Date();
  date.setMinutes(date.getMinutes() + Math.max(minutes, 1));
  date.setSeconds(0, 0);
  return date;
};

export function OrderStatusUpdateDialog({
  open,
  order,
  onOpenChange,
}: OrderStatusUpdateDialogProps) {
  const updateStatusMutation = useUpdateOrderStatus();
  const common = useTranslations("common");
  const t = useTranslations("orders");
  const [durationKey, setDurationKey] = useState<DurationOption["key"]>("20min");
  const [customDateTime, setCustomDateTime] = useState(() =>
    buildFutureOrderTime(20)
  );
  const [mode, setMode] = useState<"main" | "custom">("main");
  const [deliveryTimeEditing, setDeliveryTimeEditing] = useState(false);

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
      deliveryOtp: order?.deliveryOtp || "",
    },
  });
  const selectedStatus = useWatch({ control, name: "status" });
  const isConfirmingPlacedOrder = order?.status === "PLACED" && selectedStatus === "CONFIRMED";
  const isConfirmedOrder = order?.status === "CONFIRMED" && selectedStatus === "CONFIRMED";
  const savedDeliveryTime = parseOrderTime(order?.orderTime);
  const canEditDeliveryTime = isConfirmingPlacedOrder || deliveryTimeEditing;

  useEffect(() => {
    if (open) {
      setDurationKey("20min");
      setCustomDateTime(buildFutureOrderTime(20));
      setMode("main");
      setDeliveryTimeEditing(order?.status === "PLACED");
    }
  }, [open, order?.status]);

  const durationMinutes = useMemo(() => {
    return durationOptions.find((item) => item.key === durationKey)?.minutes ?? 20;
  }, [durationKey]);

  const computedDeliveryTime = useMemo(
    () =>
      durationKey === "custom"
        ? customDateTime
        : buildFutureOrderTime(durationMinutes),
    [customDateTime, durationKey, durationMinutes]
  );

  const durationText = useMemo(() => {
    if (durationKey === "20min") return t("duration20Minutes");
    if (durationKey === "40min") return t("duration40Minutes");
    if (durationKey === "60min") return t("duration60Minutes");

    return formatDateTime(customDateTime) ?? t("durationCustom");
  }, [durationKey, customDateTime, t]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setMode("main");
      setDeliveryTimeEditing(false);
      reset(defaultValues);
    }
    onOpenChange(nextOpen);
  };

  const handleDurationClick = (key: DurationOption["key"]) => {
    setDurationKey(key);
    if (key === "custom") {
      setCustomDateTime(savedDeliveryTime ?? buildFutureOrderTime(20));
      setMode("custom");
    }
  };

  const onSubmit = async (values: OrderStatusUpdateValues) => {
    if (!order) return;

    const orderTimeIso = canEditDeliveryTime
      ? computedDeliveryTime.toISOString()
      : undefined;

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

  const isLoading = updateStatusMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-[520px] overflow-y-auto rounded-[28px] border-0 bg-white p-0">
        {mode === "main" ? (
          <form className="p-5 sm:p-7" noValidate onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-[24px] font-bold text-gray-950">
                {isConfirmingPlacedOrder ? t("acceptOrderTitle") : t("updateStatusTitle")}
              </DialogTitle>
              <DialogDescription className="text-sm leading-6 text-gray-500">
                {isConfirmingPlacedOrder
                  ? t("acceptOrderDescription")
                  : t("updateStatusDescription")}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="order-status">{common("status")}</Label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="order-status" className="h-[48px] rounded-[14px]">
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

              {isConfirmedOrder && savedDeliveryTime && !deliveryTimeEditing ? (
                <div className="rounded-[20px] border border-primary/15 bg-gradient-to-br from-primary/5 via-white to-red-50/70 p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-[16px] bg-primary text-white shadow-lg shadow-primary/20">
                      <CalendarCheck2 size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
                        {t("selectedDeliveryTime")}
                      </p>
                      <div className="mt-2 inline-flex max-w-full rounded-full bg-white px-3.5 py-2 shadow-sm ring-1 ring-primary/10">
                        <p className="truncate text-[15px] font-bold leading-none text-gray-950 sm:text-base">
                          {formatDateTime(savedDeliveryTime)}
                        </p>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-gray-500">
                        {t("selectedDeliveryTimeDescription")}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isLoading}
                    onClick={() => setDeliveryTimeEditing(true)}
                    className="mt-4 h-[44px] w-full rounded-full border-primary bg-white text-primary hover:bg-primary/5 hover:text-primary"
                  >
                    <TimerReset size={17} />
                    {t("updateDeliveryTime")}
                  </Button>
                </div>
              ) : null}

              {canEditDeliveryTime ? (
                <div className="rounded-[20px] bg-gray-50 p-4">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-950">
                        {t("deliveryScheduleTitle")}
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-gray-500">
                        {t("deliveryDurationDescription")}
                      </p>
                    </div>
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-primary">
                      <Clock3 size={17} />
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {durationOptions.map((item) => {
                      const active = durationKey === item.key;

                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => handleDurationClick(item.key)}
                          disabled={isLoading}
                          className={cn(
                            "h-[82px] rounded-[16px] border bg-white transition hover:border-primary/40",
                            "flex flex-col items-center justify-center gap-2",
                            active ? "border-primary shadow-sm" : "border-transparent"
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
                      <CalendarCheck2 size={17} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {t("deliveryTimeWillBe")} {" "}
                        <span className="text-primary">{formatDateTime(computedDeliveryTime)}</span>
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {t("deliveryInDuration", { duration: durationText })}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="order-delivery-otp">{t("deliveryOtp")}</Label>
                <Input
                  id="order-delivery-otp"
                  placeholder={common("optional")}
                  className="h-[48px] rounded-[14px]"
                  {...register("deliveryOtp")}
                />
                {errors.deliveryOtp?.message ? (
                  <p className="text-sm text-red-500">{errors.deliveryOtp.message}</p>
                ) : null}
              </div>
            </div>

            <DialogFooter className="mt-6 flex-col-reverse gap-3 sm:flex-row">
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
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : common("updateStatus")}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="p-5 sm:p-7">
            <DialogHeader>
              <DialogTitle className="text-[24px] font-bold text-gray-950">
                {t("setCustomDeliveryTime")}
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm leading-6 text-gray-500">
                {t("customDeliveryTimeDescription")}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6">
              <DateTimePickerField
                label={t("selectDateAndTime")}
                value={customDateTime}
                minDate={new Date()}
                disabled={isLoading}
                helperText={t("customDeliveryTimeDescription")}
                onChange={setCustomDateTime}
              />
            </div>

            <div className="mt-6 flex gap-3 rounded-[16px] border-l-4 border-primary bg-gray-50 p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white">
                <Clock3 size={17} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {t("deliveryTimeWillBe")}{" "}
                  <span className="text-primary">{durationText}</span>
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {formatDateTime(computedDeliveryTime)}
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
