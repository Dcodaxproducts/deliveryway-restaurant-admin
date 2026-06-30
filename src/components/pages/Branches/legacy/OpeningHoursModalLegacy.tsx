"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useGetOpeningHours, useUpdateOpeningHours } from "@/hooks/useBranches";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Time24Picker } from "@/components/ui/time-24-picker";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  branchId: string;
  branchName: string;
}

type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

type WorkingHourMode = "same" | "specific";

interface BreakTime {
  startTime: string;
  endTime: string;
  note?: string;
}

interface OpeningHour {
  dayOfWeek: DayOfWeek;
  isClosed: boolean;
  openTime: string;
  closeTime: string;
  breakTimes: BreakTime[];
  note?: string;
}

const DAYS: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const DEFAULT_OPEN_TIME = "09:00";
const DEFAULT_CLOSE_TIME = "18:00";

const createDefaultOpeningHour = (dayOfWeek: DayOfWeek): OpeningHour => ({
  dayOfWeek,
  isClosed: true,
  openTime: "",
  closeTime: "",
  breakTimes: [],
  note: "",
});

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const normalizeBreakTimes = (breakTimes: unknown): BreakTime[] => {
  if (!Array.isArray(breakTimes)) return [];

  return breakTimes.map((breakTime) => {
    const record = toRecord(breakTime);

    return {
      startTime: String(record.startTime || ""),
      endTime: String(record.endTime || ""),
      note: String(record.note || ""),
    };
  });
};

const normalizeOpeningHours = (value: unknown): OpeningHour[] => {
  const rawHours = Array.isArray(value) ? value : [];

  const byDay = new Map<string, Record<string, unknown>>(
    rawHours.map((item) => {
      const record = toRecord(item);

      return [String(record.dayOfWeek || "").toUpperCase(), record];
    })
  );

  return DAYS.map((dayOfWeek) => {
    const existing = byDay.get(dayOfWeek);

    if (!existing) {
      return createDefaultOpeningHour(dayOfWeek);
    }

    return {
      dayOfWeek,
      isClosed: Boolean(existing?.isClosed),
      openTime: String(existing?.openTime || ""),
      closeTime: String(existing?.closeTime || ""),
      breakTimes: normalizeBreakTimes(existing?.breakTimes),
      note: String(existing?.note || ""),
    };
  });
};

const formatDayLabel = (day: string) => {
  return day
    .toLowerCase()
    .replace(/^\w/, (char) => char.toUpperCase());
};

const isTimeRangeInvalid = (startTime?: string, endTime?: string) => {
  if (!startTime || !endTime) return false;
  return startTime >= endTime;
};

const hasOpeningWindow = (day: OpeningHour) =>
  Boolean(day.openTime && day.closeTime);

const getResponseOpeningHours = (payload: unknown) => {
  const record = toRecord(payload);
  const dataRecord = toRecord(record.data);

  if (Array.isArray(record.data)) return record.data;
  if (Array.isArray(dataRecord.openingHours)) return dataRecord.openingHours;
  if (Array.isArray(record.openingHours)) return record.openingHours;

  return [];
};

const getDefaultTimesFromHours = (hours: OpeningHour[]) => {
  const firstOpenDay = hours.find((day) => !day.isClosed && day.openTime && day.closeTime);

  return {
    openTime: firstOpenDay?.openTime || DEFAULT_OPEN_TIME,
    closeTime: firstOpenDay?.closeTime || DEFAULT_CLOSE_TIME,
  };
};

export function OpeningHoursModalLegacy({
  open,
  onOpenChange,
  branchId,
  branchName,
}: Props) {
  const t = useTranslations("branches");
  const commonT = useTranslations("common");
  const [hours, setHours] = useState<OpeningHour[]>(
    DAYS.map(createDefaultOpeningHour)
  );
  const [workingHourMode, setWorkingHourMode] =
    useState<WorkingHourMode>("specific");
  const [defaultTimes, setDefaultTimes] = useState({
    openTime: DEFAULT_OPEN_TIME,
    closeTime: DEFAULT_CLOSE_TIME,
  });
  const {
    data: openingHoursResponse,
    isLoading: fetching,
    isFetching,
  } = useGetOpeningHours(open && branchId ? branchId : "");
  const updateOpeningHoursMutation = useUpdateOpeningHours();
  const loading = updateOpeningHoursMutation.isPending;

  useEffect(() => {
    if (!open || !openingHoursResponse) return;

    const normalizedHours = normalizeOpeningHours(
      getResponseOpeningHours(openingHoursResponse)
    );

    setHours(normalizedHours);
    setWorkingHourMode("specific");
    setDefaultTimes(getDefaultTimesFromHours(normalizedHours));
  }, [open, openingHoursResponse]);

  const applyDefaultWorkingHours = (openTime: string, closeTime: string) => {
    setHours((prev) =>
      prev.map((day) => ({
        ...day,
        isClosed: false,
        openTime,
        closeTime,
      }))
    );
  };

  const handleWorkingHourModeChange = (mode: WorkingHourMode) => {
    setWorkingHourMode(mode);

    if (mode === "same") {
      applyDefaultWorkingHours(defaultTimes.openTime, defaultTimes.closeTime);
    }
  };

  const handleDefaultTimeChange = (
    field: keyof typeof defaultTimes,
    value: string
  ) => {
    const nextTimes = { ...defaultTimes, [field]: value };

    setDefaultTimes(nextTimes);

    if (workingHourMode === "same") {
      applyDefaultWorkingHours(nextTimes.openTime, nextTimes.closeTime);
    }
  };

  const handleHourChange = (
    index: number,
    field: keyof OpeningHour,
    value: boolean | string | BreakTime[]
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
              breakTimes: [
                ...(Array.isArray(day.breakTimes) ? day.breakTimes : []),
                {
                  startTime: "",
                  endTime: "",
                  note: "",
                },
              ],
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

  const validateOpeningHours = () => {
    for (const day of hours) {
      if (!day.isClosed && !hasOpeningWindow(day)) {
        toast.error(`${formatDayLabel(day.dayOfWeek)} ${t("openingHoursRequired")}`);
        return false;
      }

      if (!day.isClosed && isTimeRangeInvalid(day.openTime, day.closeTime)) {
        toast.error(`${formatDayLabel(day.dayOfWeek)} close time must be after open time`);
        return false;
      }

      if (!day.isClosed) {
        for (const breakTime of day.breakTimes || []) {
          const hasAnyBreakValue =
            breakTime.startTime || breakTime.endTime || breakTime.note;

          if (!hasAnyBreakValue) continue;

          if (!breakTime.startTime || !breakTime.endTime) {
            toast.error(
              `${formatDayLabel(day.dayOfWeek)} break requires start and end time`
            );
            return false;
          }

          if (isTimeRangeInvalid(breakTime.startTime, breakTime.endTime)) {
            toast.error(
              `${formatDayLabel(day.dayOfWeek)} break end time must be after start time`
            );
            return false;
          }

          if (
            breakTime.startTime < day.openTime ||
            breakTime.endTime > day.closeTime
          ) {
            toast.error(
              `${formatDayLabel(day.dayOfWeek)} break must be within opening hours`
            );
            return false;
          }
        }
      }
    }

    return true;
  };

  const sanitizeOpeningHours = () => {
    return hours.map((day) => ({
      dayOfWeek: day.dayOfWeek,
      isClosed: Boolean(day.isClosed),
      openTime: day.openTime || DEFAULT_OPEN_TIME,
      closeTime: day.closeTime || DEFAULT_CLOSE_TIME,
      breakTimes: day.isClosed
        ? []
        : (day.breakTimes || [])
            .filter((breakTime) => breakTime.startTime && breakTime.endTime)
            .map((breakTime) => ({
              startTime: breakTime.startTime,
              endTime: breakTime.endTime,
              note: breakTime.note?.trim() || undefined,
            })),
      note: day.note?.trim() || undefined,
    }));
  };

  const handleSubmit = async () => {
    if (!validateOpeningHours()) return;

    try {
      const payload = {
        openingHours: sanitizeOpeningHours(),
      };

      await updateOpeningHoursMutation.mutateAsync({ branchId, data: payload });

      onOpenChange(false);
    } catch {
      // useUpdateOpeningHours already surfaces the backend error message.
    }
  };

  useEffect(() => {
    if (!open) {
      document.body.style.pointerEvents = "";
      document.body.style.overflow = "";
    }
  }, [open]);

 return (
  <Dialog open={open} onOpenChange={onOpenChange} modal>
    <DialogContent
      className="max-h-[95vh] w-[calc(100vw-2rem)] max-w-[820px] overflow-y-auto overflow-x-hidden rounded-[24px] bg-[#F5F5F5] p-4 sm:p-6"
      onCloseAutoFocus={(e) => e.preventDefault()}
    >
      <DialogHeader className="min-w-0">
        <DialogTitle className="text-2xl font-semibold">
          {t("openingHours")}
        </DialogTitle>
        <p className="text-sm text-gray-500">{branchName}</p>
      </DialogHeader>

      <div className="mt-5 w-full min-w-0 space-y-5">
        <section className="w-full min-w-0 overflow-hidden rounded-[16px] bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-col gap-1">
            <h3 className="text-base font-semibold text-gray-900">
              {t("defaultWorkingHour")}
            </h3>
            <p className="text-xs leading-5 text-gray-500">
              {t("defaultWorkingHourDescription")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handleWorkingHourModeChange("same")}
              className={`rounded-[14px] border p-4 text-left transition ${
                workingHourMode === "same"
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-gray-100 bg-gray-50 hover:border-primary/30 hover:bg-white"
              }`}
            >
              <span className="flex items-center gap-3">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    workingHourMode === "same"
                      ? "border-primary"
                      : "border-gray-300"
                  }`}
                >
                  {workingHourMode === "same" ? (
                    <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                  ) : null}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {t("sameTimeEveryDay")}
                </span>
              </span>
              <span className="mt-2 block text-xs leading-5 text-gray-500">
                {t("sameTimeEveryDayDescription")}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleWorkingHourModeChange("specific")}
              className={`rounded-[14px] border p-4 text-left transition ${
                workingHourMode === "specific"
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-gray-100 bg-gray-50 hover:border-primary/30 hover:bg-white"
              }`}
            >
              <span className="flex items-center gap-3">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    workingHourMode === "specific"
                      ? "border-primary"
                      : "border-gray-300"
                  }`}
                >
                  {workingHourMode === "specific" ? (
                    <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                  ) : null}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {t("setSpecificTime")}
                </span>
              </span>
              <span className="mt-2 block text-xs leading-5 text-gray-500">
                {t("setSpecificTimeDescription")}
              </span>
            </button>
          </div>

          {workingHourMode === "same" ? (
            <div className="mt-4 grid grid-cols-1 gap-3 rounded-[14px] border border-dashed border-primary/20 bg-primary/5 p-3 sm:grid-cols-2">
              <div className="rounded-[10px] bg-white px-3 py-2 text-xs font-medium text-primary shadow-sm sm:col-span-2">
                {t("appliesEveryDay")}
              </div>

              <label className="min-w-0 space-y-1.5">
                <span className="text-xs font-medium text-gray-600">
                  {t("openTime")}
                </span>
                <Time24Picker
                  value={defaultTimes.openTime}
                  onChange={(value) => handleDefaultTimeChange("openTime", value)}
                  className="h-12 w-full min-w-0 rounded-[10px] border border-gray-200 bg-white px-4 text-base text-gray-900 outline-none focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10"
                />
              </label>

              <label className="min-w-0 space-y-1.5">
                <span className="text-xs font-medium text-gray-600">
                  {t("closeTime")}
                </span>
                <Time24Picker
                  value={defaultTimes.closeTime}
                  onChange={(value) => handleDefaultTimeChange("closeTime", value)}
                  className="h-12 w-full min-w-0 rounded-[10px] border border-gray-200 bg-white px-4 text-base text-gray-900 outline-none focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10"
                />
              </label>
            </div>
          ) : null}
        </section>

        <section className="w-full min-w-0 overflow-hidden rounded-[16px] bg-white p-4 sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-gray-900">
                {t("weeklyBusinessHours")}
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                {t("weeklyBusinessHoursDescription")}
              </p>
            </div>
          </div>

          {fetching || isFetching ? (
            <div className="flex items-center gap-2 rounded-[12px] border border-gray-100 bg-gray-50 p-4 text-sm text-gray-500">
              <Loader2 size={16} className="animate-spin" />
              {t("loadingOpeningHours")}
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
                          : hasOpeningWindow(day)
                            ? `${day.openTime} - ${day.closeTime}`
                            : t("openingHoursNotConfigured")}
                      </p>
                    </div>

                    <label className="flex cursor-pointer items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm">
                      <input
                        type="checkbox"
                        checked={day.isClosed}
                        onChange={(e) =>
                          handleHourChange(
                            index,
                            "isClosed",
                            e.target.checked
                          )
                        }
                        className="accent-[var(--primary)]"
                      />
                      {t("closed")}
                    </label>
                  </div>

                  {!day.isClosed ? (
                    <div className="mt-4 space-y-4">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="min-w-0 space-y-1.5">
                          <span className="text-xs font-medium text-gray-500">
                            {t("openTime")}
                          </span>

                          <Time24Picker
                            value={day.openTime || ""}
                            onChange={(value) =>
                              handleHourChange(index, "openTime", value)
                            }
                            className="h-11 w-full rounded-[10px] border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10"
                          />
                        </label>

                        <label className="min-w-0 space-y-1.5">
                          <span className="text-xs font-medium text-gray-500">
                            {t("closeTime")}
                          </span>

                          <Time24Picker
                            value={day.closeTime || ""}
                            onChange={(value) =>
                              handleHourChange(index, "closeTime", value)
                            }
                            className="h-11 w-full rounded-[10px] border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10"
                          />
                        </label>
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
                            {t("noRegularBreak")}
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {day.breakTimes.map((breakTime, breakIndex) => (
                              <div
                                key={`${day.dayOfWeek}-break-${breakIndex}`}
                                className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
                              >
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                  <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-500">
                                      {t("breakStart")}
                                    </label>

                                    <Time24Picker
                                      value={breakTime.startTime || ""}
                                      onChange={(value) =>
                                        updateBreakTime(index, breakIndex, "startTime", value)
                                      }
                                      className="h-11 w-full rounded-[10px] border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10"
                                    />
                                  </div>

                                  <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-500">
                                      {t("breakEnd")}
                                    </label>

                                    <Time24Picker
                                      value={breakTime.endTime || ""}
                                      onChange={(value) =>
                                        updateBreakTime(index, breakIndex, "endTime", value)
                                      }
                                      className="h-11 w-full rounded-[10px] border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10"
                                    />
                                  </div>
                                </div>

                                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
                                  <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-500">
                                      {commonT("note")}
                                    </label>

                                    <input
                                      type="text"
                                      placeholder={t("breakNotePlaceholder")}
                                      value={breakTime.note || ""}
                                      onChange={(e) =>
                                        updateBreakTime(
                                          index,
                                          breakIndex,
                                          "note",
                                          e.target.value
                                        )
                                      }
                                      className="h-11 w-full rounded-[10px] border border-gray-200 bg-white px-3 text-sm outline-none placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/10"
                                    />
                                  </div>

                                  <div className="flex items-end">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        removeBreakTime(index, breakIndex)
                                      }
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

                  <input
                    type="text"
                    placeholder={t("noteOptional")}
                    value={day.note || ""}
                    onChange={(e) =>
                      handleHourChange(index, "note", e.target.value)
                    }
                    className="mt-4 h-11 w-full min-w-0 rounded-[10px] border border-gray-200 bg-white px-3 text-sm outline-none placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        <Button
          onClick={handleSubmit}
          disabled={loading || fetching || isFetching}
          className="w-full rounded-[10px] bg-primary py-4 hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? commonT("saving") : t("saveOpeningHours")}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);
}
