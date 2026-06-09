"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarCheck2, CalendarDays, Clock3 } from "lucide-react";
import { useEffect, useState } from "react";
import { DayPicker } from "react-day-picker";
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
  orderDate: "",
  orderTimeClock: "",
};

const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const parseDateInput = (value?: string) => {
  if (!value) return undefined;

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;

  return new Date(year, month - 1, day);
};

const formatClockInput = (date: Date) => {
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");

  return `${hours}:${minutes}`;
};

const getMinimumOrderTime = () => {
  const nextMinute = new Date();
  nextMinute.setMinutes(nextMinute.getMinutes() + 1);
  nextMinute.setSeconds(0, 0);

  return nextMinute;
};

const isSameDay = (first?: Date, second?: Date) => {
  return (
    Boolean(first && second) &&
    first?.getFullYear() === second?.getFullYear() &&
    first?.getMonth() === second?.getMonth() &&
    first?.getDate() === second?.getDate()
  );
};

const buildOrderTimeIso = (dateValue?: string, timeValue?: string) => {
  const selectedDate = parseDateInput(dateValue);
  const [hours, minutes] = timeValue?.split(":").map(Number) ?? [];

  if (!selectedDate || hours === undefined || minutes === undefined) {
    return null;
  }

  const orderTime = new Date(selectedDate);
  orderTime.setHours(hours, minutes, 0, 0);

  return Number.isNaN(orderTime.getTime()) ? null : orderTime.toISOString();
};

export function OrderStatusUpdateDialog({
  open,
  order,
  onOpenChange,
}: OrderStatusUpdateDialogProps) {
  const updateStatusMutation = useUpdateOrderStatus();
  const common = useTranslations("common");
  const t = useTranslations("orders");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [clockReference, setClockReference] = useState(getMinimumOrderTime);
  const today = new Date(clockReference);
  today.setHours(0, 0, 0, 0);
  const minimumOrderTime = clockReference;
  const {
    clearErrors,
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
  } = useForm<OrderStatusUpdateValues>({
    resolver: zodResolver(orderStatusUpdateSchema),
    defaultValues,
    values: {
      status: order?.status || "",
      deliveryOtp: "",
      orderDate: "",
      orderTimeClock: "",
    },
  });
  const selectedStatus = useWatch({ control, name: "status" });
  const selectedOrderDateValue = useWatch({ control, name: "orderDate" });
  const selectedOrderDate = parseDateInput(selectedOrderDateValue);
  const isAcceptingPlacedOrder =
    order?.status === "PLACED" && selectedStatus === "CONFIRMED";
  const selectedDateLabel = selectedOrderDate
    ? selectedOrderDate.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : t("selectOrderDate");
  const minTimeForSelectedDate = isSameDay(selectedOrderDate, minimumOrderTime)
    ? formatClockInput(minimumOrderTime)
    : undefined;

  useEffect(() => {
    if (open) setClockReference(getMinimumOrderTime());
  }, [open]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setCalendarOpen(false);
      reset(defaultValues);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: OrderStatusUpdateValues) => {
    if (!order) return;

    const orderTimeIso = isAcceptingPlacedOrder
      ? buildOrderTimeIso(values.orderDate, values.orderTimeClock)
      : null;

    if (isAcceptingPlacedOrder && !orderTimeIso) {
      setError("orderDate", {
        message: t("orderTimeRequired"),
        type: "manual",
      });
      return;
    }

    if (orderTimeIso && new Date(orderTimeIso).getTime() <= getMinimumOrderTime().getTime()) {
      setError("orderTimeClock", {
        message: t("orderTimeFutureRequired"),
        type: "manual",
      });
      return;
    }

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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[520px] overflow-y-auto rounded-[20px] p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-semibold">
            {isAcceptingPlacedOrder ? t("acceptOrderTitle") : t("updateStatusTitle")}
          </DialogTitle>
          <DialogDescription>
            {isAcceptingPlacedOrder
              ? t("acceptOrderDescription")
              : t("updateStatusDescription")}
          </DialogDescription>
        </DialogHeader>

        <form className="mt-5 space-y-4" noValidate onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="order-status">{common("status")}</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="order-status">
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
            <div className="rounded-[18px] border border-primary/15 bg-gradient-to-br from-primary/5 via-white to-amber-50/70 p-4 shadow-sm">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-primary text-white shadow-sm">
                  <CalendarCheck2 size={19} />
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

              <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
                <div className="space-y-2">
                  <Label htmlFor="order-date-picker">{t("orderDate")}</Label>
                  <button
                    id="order-date-picker"
                    type="button"
                    className="flex h-[52px] w-full items-center gap-3 rounded-[14px] border border-gray-200 bg-white px-3 text-left text-sm text-gray-900 shadow-xs outline-none transition hover:border-primary/35 focus-visible:border-primary/40 focus-visible:ring-3 focus-visible:ring-primary/15"
                    onClick={() => setCalendarOpen((current) => !current)}
                  >
                    <CalendarDays size={18} className="text-primary" />
                    <span
                      className={
                        selectedOrderDate ? "truncate" : "truncate text-gray-400"
                      }
                    >
                      {selectedDateLabel}
                    </span>
                  </button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="order-time-clock">{t("orderTime")}</Label>
                  <div className="relative">
                    <Clock3
                      size={17}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary"
                    />
                    <Input
                      id="order-time-clock"
                      type="time"
                      min={minTimeForSelectedDate}
                      className="bg-white pl-10 text-sm"
                      {...register("orderTimeClock", {
                        onChange: () => clearErrors(["orderDate", "orderTimeClock"]),
                      })}
                    />
                  </div>
                </div>
              </div>

              {calendarOpen ? (
                <div className="mt-3 rounded-[16px] border border-gray-200 bg-white p-3 shadow-xl">
                  <DayPicker
                    mode="single"
                    selected={selectedOrderDate}
                    onSelect={(date) => {
                      if (!date) return;
                      setValue("orderDate", formatDateInput(date), {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      clearErrors(["orderDate", "orderTimeClock"]);
                      setCalendarOpen(false);
                    }}
                    disabled={{ before: today }}
                    className="text-sm"
                    classNames={{
                      months: "flex",
                      month: "space-y-3",
                      month_caption:
                        "flex justify-center pb-2 text-sm font-semibold text-gray-900",
                      nav: "absolute left-3 right-3 top-3 flex items-center justify-between",
                      button_previous:
                        "rounded-full p-1 text-gray-500 hover:bg-gray-100",
                      button_next:
                        "rounded-full p-1 text-gray-500 hover:bg-gray-100",
                      weekdays: "grid grid-cols-7 gap-1 text-xs text-gray-400",
                      week: "grid grid-cols-7 gap-1",
                      day: "h-9 w-9 text-center text-sm",
                      day_button:
                        "h-9 w-9 rounded-full text-sm transition hover:bg-primary/10",
                      selected:
                        "[&>button]:bg-primary [&>button]:text-white [&>button]:hover:bg-primary",
                      today: "[&>button]:ring-1 [&>button]:ring-primary",
                      disabled:
                        "pointer-events-none text-gray-300 opacity-50",
                      outside: "text-gray-300",
                    }}
                  />
                </div>
              ) : null}

              {errors.orderDate?.message || errors.orderTimeClock?.message ? (
                <p className="mt-3 text-sm text-red-500">
                  {errors.orderDate?.message || errors.orderTimeClock?.message}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="order-delivery-otp">{t("deliveryOtp")}</Label>
            <Input
              id="order-delivery-otp"
              placeholder={common("optional")}
              {...register("deliveryOtp")}
            />
            {errors.deliveryOtp?.message ? (
              <p className="text-sm text-red-500">{errors.deliveryOtp.message}</p>
            ) : null}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              {common("cancel")}
            </Button>
            <Button type="submit" disabled={updateStatusMutation.isPending}>
              {updateStatusMutation.isPending ? common("updating") : common("updateStatus")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
