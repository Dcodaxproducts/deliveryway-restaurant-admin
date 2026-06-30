"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, Loader2, Plus, Trash2, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { Time24Picker } from "@/components/ui/time-24-picker";
import {
  useGetDeliveryHours,
  useUpdateDeliveryHours,
} from "@/hooks/useBranches";

type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

type BreakTime = {
  startTime: string;
  endTime: string;
};

type DeliveryHour = {
  dayOfWeek: DayOfWeek;
  isClosed: boolean;
  openTime: string;
  closeTime: string;
  breakTimes: BreakTime[];
};

type DeliveryHoursModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  branchName: string;
};

const DAYS: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const DEFAULT_OPEN_TIME = "10:00";
const DEFAULT_CLOSE_TIME = "22:00";

const createDefaultDeliveryHour = (dayOfWeek: DayOfWeek): DeliveryHour => ({
  dayOfWeek,
  isClosed: true,
  openTime: "",
  closeTime: "",
  breakTimes: [],
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const normalizeBreakTimes = (breakTimes: unknown): BreakTime[] => {
  if (!Array.isArray(breakTimes)) return [];

  return breakTimes.map((breakTime) => {
    const record = isRecord(breakTime) ? breakTime : {};

    return {
      startTime: String(record.startTime || ""),
      endTime: String(record.endTime || ""),
    };
  });
};

const normalizeDeliveryHours = (value: unknown): DeliveryHour[] => {
  const rawHours = Array.isArray(value) ? value : [];
  const byDay = new Map<string, unknown>(
    rawHours.map((item) => [
      String(isRecord(item) ? item.dayOfWeek || "" : "").toUpperCase(),
      item,
    ])
  );

  return DAYS.map((dayOfWeek) => {
    const existing = byDay.get(dayOfWeek);

    if (!isRecord(existing)) {
      return createDefaultDeliveryHour(dayOfWeek);
    }

    return {
      dayOfWeek,
      isClosed: Boolean(existing.isClosed),
      openTime: String(existing.openTime || ""),
      closeTime: String(existing.closeTime || ""),
      breakTimes: normalizeBreakTimes(existing.breakTimes),
    };
  });
};

const getResponseDeliveryHours = (payload: unknown) => {
  if (!isRecord(payload)) return [];
  if (Array.isArray(payload.data)) return payload.data;

  const data = isRecord(payload.data) ? payload.data : {};
  if (Array.isArray(data.deliveryHours)) return data.deliveryHours;
  if (Array.isArray(payload.deliveryHours)) return payload.deliveryHours;

  return [];
};

const formatDayLabel = (day: string) =>
  day.toLowerCase().replace(/^\w/, (char) => char.toUpperCase());

const isTimeRangeInvalid = (startTime?: string, endTime?: string) => {
  if (!startTime || !endTime) return false;
  return startTime >= endTime;
};

const hasDeliveryWindow = (day: DeliveryHour) =>
  Boolean(day.openTime && day.closeTime);

export default function DeliveryHoursModal({
  open,
  onOpenChange,
  branchId,
  branchName,
}: DeliveryHoursModalProps) {
  const t = useTranslations("branches");
  const commonT = useTranslations("common");
  const [hours, setHours] = useState<DeliveryHour[]>(
    DAYS.map(createDefaultDeliveryHour)
  );

  const {
    data: deliveryHoursResponse,
    isLoading,
    isFetching,
  } = useGetDeliveryHours(open && branchId ? branchId : "");
  const updateDeliveryHoursMutation = useUpdateDeliveryHours();
  const loading = updateDeliveryHoursMutation.isPending;
  const fetching = isLoading || isFetching;

  const openCount = useMemo(
    () => hours.filter((day) => !day.isClosed).length,
    [hours]
  );
  const closedCount = useMemo(
    () => hours.filter((day) => day.isClosed).length,
    [hours]
  );

  useEffect(() => {
    if (!open || !deliveryHoursResponse) return;

    setHours(normalizeDeliveryHours(getResponseDeliveryHours(deliveryHoursResponse)));
  }, [open, deliveryHoursResponse]);

  const handleHourChange = (
    index: number,
    field: keyof DeliveryHour,
    value: string | boolean
  ) => {
    setHours((prev) =>
      prev.map((day, dayIndex) =>
        dayIndex === index
          ? {
              ...day,
              [field]: value,
              ...(field === "isClosed" && value === false
                ? {
                    openTime: day.openTime || DEFAULT_OPEN_TIME,
                    closeTime: day.closeTime || DEFAULT_CLOSE_TIME,
                  }
                : {}),
            }
          : day
      )
    );
  };

  const addBreakTime = (dayIndex: number) => {
    setHours((prev) =>
      prev.map((day, index) =>
        index === dayIndex
          ? {
              ...day,
              breakTimes: [...day.breakTimes, { startTime: "", endTime: "" }],
            }
          : day
      )
    );
  };

  const updateBreakTime = (
    dayIndex: number,
    breakIndex: number,
    field: keyof BreakTime,
    value: string
  ) => {
    setHours((prev) =>
      prev.map((day, index) => {
        if (index !== dayIndex) return day;

        return {
          ...day,
          breakTimes: day.breakTimes.map((breakTime, currentBreakIndex) =>
            currentBreakIndex === breakIndex
              ? {
                  ...breakTime,
                  [field]: value,
                }
              : breakTime
          ),
        };
      })
    );
  };

  const removeBreakTime = (dayIndex: number, breakIndex: number) => {
    setHours((prev) =>
      prev.map((day, index) => {
        if (index !== dayIndex) return day;

        return {
          ...day,
          breakTimes: day.breakTimes.filter(
            (_, currentBreakIndex) => currentBreakIndex !== breakIndex
          ),
        };
      })
    );
  };

  const validateDeliveryHours = () => {
    for (const day of hours) {
      if (!day.isClosed && !hasDeliveryWindow(day)) {
        toast.error(`${formatDayLabel(day.dayOfWeek)} ${t("deliveryHoursRequired")}`);
        return false;
      }

      if (!day.isClosed && isTimeRangeInvalid(day.openTime, day.closeTime)) {
        toast.error(`${formatDayLabel(day.dayOfWeek)} ${t("closeAfterOpenTime")}`);
        return false;
      }

      if (day.isClosed) continue;

      for (const breakTime of day.breakTimes) {
        const hasAnyBreakValue = breakTime.startTime || breakTime.endTime;
        if (!hasAnyBreakValue) continue;

        if (!breakTime.startTime || !breakTime.endTime) {
          toast.error(`${formatDayLabel(day.dayOfWeek)} ${t("breakRequiresTime")}`);
          return false;
        }

        if (isTimeRangeInvalid(breakTime.startTime, breakTime.endTime)) {
          toast.error(`${formatDayLabel(day.dayOfWeek)} ${t("breakEndAfterStart")}`);
          return false;
        }

        if (breakTime.startTime < day.openTime || breakTime.endTime > day.closeTime) {
          toast.error(`${formatDayLabel(day.dayOfWeek)} ${t("breakWithinHours")}`);
          return false;
        }
      }
    }

    return true;
  };

  const sanitizeDeliveryHours = () =>
    hours.map((day) => ({
      dayOfWeek: day.dayOfWeek,
      isClosed: Boolean(day.isClosed),
      ...(day.isClosed
        ? {}
        : {
            openTime: day.openTime || DEFAULT_OPEN_TIME,
            closeTime: day.closeTime || DEFAULT_CLOSE_TIME,
            breakTimes: day.breakTimes
              .filter((breakTime) => breakTime.startTime && breakTime.endTime)
              .map((breakTime) => ({
                startTime: breakTime.startTime,
                endTime: breakTime.endTime,
              })),
          }),
    }));

  const handleSubmit = async () => {
    if (!validateDeliveryHours()) return;

    try {
      await updateDeliveryHoursMutation.mutateAsync({
        branchId,
        data: {
          deliveryHours: sanitizeDeliveryHours(),
        },
      });

      onOpenChange(false);
    } catch {
      // useUpdateDeliveryHours surfaces the backend error message.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogContent
        className="max-h-[95vh] w-[calc(100vw-2rem)] max-w-[860px] overflow-y-auto overflow-x-hidden rounded-[24px] bg-[#F5F5F5] p-4 sm:p-6"
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <DialogHeader className="min-w-0">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-primary text-white shadow-lg shadow-primary/20">
              <Truck size={22} />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-2xl font-semibold">
                {t("deliveryHours")}
              </DialogTitle>
              <p className="mt-1 text-sm text-gray-500">{branchName}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-5 w-full min-w-0 space-y-5">
          <section className="w-full min-w-0 overflow-hidden rounded-[16px] bg-white p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-gray-900">
                  {t("weeklyDeliveryHours")}
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  {t("weeklyDeliveryHoursDescription")}
                </p>
              </div>

              <div className="grid min-w-[180px] grid-cols-2 gap-2">
                <DeliveryHoursSummaryCard
                  label={t("open")}
                  value={openCount}
                  tone="open"
                />
                <DeliveryHoursSummaryCard
                  label={t("closed")}
                  value={closedCount}
                  tone="closed"
                />
              </div>
            </div>

            {fetching ? (
              <div className="flex items-center gap-2 rounded-[12px] border border-gray-100 bg-gray-50 p-4 text-sm text-gray-500">
                <Loader2 size={16} className="animate-spin" />
                {t("loadingDeliveryHours")}
              </div>
            ) : (
              <div className="space-y-4">
                {hours.map((day, index) => (
                  <div
                    key={day.dayOfWeek}
                    className="min-w-0 rounded-[14px] border border-gray-100 bg-white p-4 shadow-sm"
                  >
                    <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900">
                          {t(`days.${day.dayOfWeek}`)}
                        </h4>
                        <p className="mt-0.5 text-xs text-gray-400">
                          {day.isClosed
                            ? t("closedFullDay")
                            : hasDeliveryWindow(day)
                              ? `${day.openTime} - ${day.closeTime}`
                              : t("deliveryHoursNotConfigured")}
                        </p>
                      </div>

                      <label className="flex cursor-pointer items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm">
                        <input
                          type="checkbox"
                          checked={day.isClosed}
                          onChange={(event) =>
                            handleHourChange(index, "isClosed", event.target.checked)
                          }
                          className="accent-[var(--primary)]"
                        />
                        {t("closed")}
                      </label>
                    </div>

                    {!day.isClosed ? (
                      <div className="mt-4 space-y-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <TimeInput
                            label={t("openTime")}
                            value={day.openTime}
                            onChange={(value) =>
                              handleHourChange(index, "openTime", value)
                            }
                          />
                          <TimeInput
                            label={t("closeTime")}
                            value={day.closeTime}
                            onChange={(value) =>
                              handleHourChange(index, "closeTime", value)
                            }
                          />
                        </div>

                        <div className="min-w-0 rounded-[14px] border border-dashed border-gray-200 bg-gray-50/70 p-3">
                          <div className="mb-3 flex min-w-0 flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <Clock size={15} className="text-primary" />
                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                                {t("breakTimes")}
                              </p>
                            </div>

                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => addBreakTime(index)}
                              className="h-9 shrink-0 rounded-full border-primary/20 bg-white px-3 text-xs font-medium text-primary hover:bg-primary/5"
                            >
                              <Plus size={13} />
                              {t("addBreak")}
                            </Button>
                          </div>

                          {day.breakTimes.length === 0 ? (
                            <p className="text-xs text-gray-400">
                              {t("noDeliveryBreak")}
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {day.breakTimes.map((breakTime, breakIndex) => (
                                <div
                                  key={`${day.dayOfWeek}-delivery-break-${breakIndex}`}
                                  className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
                                >
                                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
                                    <TimeInput
                                      label={t("breakStart")}
                                      value={breakTime.startTime}
                                      onChange={(value) =>
                                        updateBreakTime(
                                          index,
                                          breakIndex,
                                          "startTime",
                                          value
                                        )
                                      }
                                    />
                                    <TimeInput
                                      label={t("breakEnd")}
                                      value={breakTime.endTime}
                                      onChange={(value) =>
                                        updateBreakTime(
                                          index,
                                          breakIndex,
                                          "endTime",
                                          value
                                        )
                                      }
                                    />
                                    <div className="flex items-end">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeBreakTime(index, breakIndex)}
                                        className="h-11 w-full rounded-[10px] text-red-500 hover:bg-red-50 hover:text-red-600 sm:w-11"
                                        aria-label={t("removeBreakTime")}
                                      >
                                        <Trash2 size={16} />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </section>

          <Button
            onClick={handleSubmit}
            disabled={loading || fetching}
            className="w-full rounded-[10px] bg-primary py-4 hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? commonT("saving") : t("saveDeliveryHours")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DeliveryHoursSummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "open" | "closed";
}) {
  const isOpen = tone === "open";

  return (
    <div
      className={`rounded-[14px] border px-3 py-2 shadow-sm ${
        isOpen
          ? "border-emerald-100 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-700"
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide opacity-75">
        {label}
      </p>
      <p className="mt-0.5 text-xl font-semibold leading-none">{value}</p>
    </div>
  );
}

function TimeInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="min-w-0 space-y-1.5">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <Time24Picker
        value={value || ""}
        onChange={onChange}
        className="h-11 w-full rounded-[10px] border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10"
      />
    </label>
  );
}
