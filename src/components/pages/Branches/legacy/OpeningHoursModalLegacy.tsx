"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { httpClient } from "@/lib/axios";
import { toast } from "sonner";

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

interface HolidayRange {
  id?: string;
  fromDate: string;
  toDate: string;
  isClosed: boolean;
  openTime: string;
  closeTime: string;
  note?: string;
}

type OpeningHoursSettings = Record<string, any> & {
  holidayRanges?: HolidayRange[];
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

const DEFAULT_OPEN_TIME = "09:00";
const DEFAULT_CLOSE_TIME = "18:00";

const createDefaultOpeningHour = (dayOfWeek: DayOfWeek): OpeningHour => ({
  dayOfWeek,
  isClosed: dayOfWeek === "SUNDAY",
  openTime: DEFAULT_OPEN_TIME,
  closeTime: DEFAULT_CLOSE_TIME,
  breakTimes: [],
  note: "",
});

const createDefaultHolidayRange = (): HolidayRange => ({
  fromDate: "",
  toDate: "",
  isClosed: true,
  openTime: DEFAULT_OPEN_TIME,
  closeTime: DEFAULT_CLOSE_TIME,
  note: "",
});

const normalizeBreakTimes = (breakTimes: any): BreakTime[] => {
  if (!Array.isArray(breakTimes)) return [];

  return breakTimes.map((breakTime) => ({
    startTime: String(breakTime?.startTime || ""),
    endTime: String(breakTime?.endTime || ""),
    note: String(breakTime?.note || ""),
  }));
};

const normalizeOpeningHours = (value: any): OpeningHour[] => {
  const rawHours = Array.isArray(value) ? value : [];

  const byDay = new Map<string, any>(
    rawHours.map((item) => [String(item?.dayOfWeek || "").toUpperCase(), item])
  );

  return DAYS.map((dayOfWeek) => {
    const existing = byDay.get(dayOfWeek);

    if (!existing) {
      return createDefaultOpeningHour(dayOfWeek);
    }

    return {
      dayOfWeek,
      isClosed: Boolean(existing?.isClosed),
      openTime: String(existing?.openTime || DEFAULT_OPEN_TIME),
      closeTime: String(existing?.closeTime || DEFAULT_CLOSE_TIME),
      breakTimes: normalizeBreakTimes(existing?.breakTimes),
      note: String(existing?.note || ""),
    };
  });
};

const normalizeHolidayRanges = (value: any): HolidayRange[] => {
  if (!Array.isArray(value)) return [];

  return value.map((holiday) => ({
    id: holiday?.id,
    fromDate: String(
      holiday?.fromDate || holiday?.startDate || holiday?.dateFrom || ""
    ),
    toDate: String(holiday?.toDate || holiday?.endDate || holiday?.dateTo || ""),
    isClosed: Boolean(holiday?.isClosed),
    openTime: String(holiday?.openTime || DEFAULT_OPEN_TIME),
    closeTime: String(holiday?.closeTime || DEFAULT_CLOSE_TIME),
    note: String(holiday?.note || ""),
  }));
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

const getResponseOpeningHours = (payload: any) => {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.openingHours)) return payload.data.openingHours;
  if (Array.isArray(payload?.openingHours)) return payload.openingHours;

  return [];
};

const getResponseSettings = (payload: any): OpeningHoursSettings => {
  if (payload?.data?.settings && typeof payload.data.settings === "object") {
    return payload.data.settings;
  }

  if (payload?.settings && typeof payload.settings === "object") {
    return payload.settings;
  }

  return {};
};

export default function OpeningHoursModal({
  open,
  onOpenChange,
  branchId,
  branchName,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [hours, setHours] = useState<OpeningHour[]>(
    DAYS.map(createDefaultOpeningHour)
  );
  const [settings, setSettings] = useState<OpeningHoursSettings>({});
  const [holidayRanges, setHolidayRanges] = useState<HolidayRange[]>([]);

  const hasHolidayRanges = holidayRanges.length > 0;

  const visibleHolidayRanges = useMemo(() => {
    return hasHolidayRanges ? holidayRanges : [createDefaultHolidayRange()];
  }, [hasHolidayRanges, holidayRanges]);

  useEffect(() => {
    if (!open || !branchId) return;

    const fetchHours = async () => {
      try {
        setFetching(true);

        const data = await httpClient.get<Record<string, any>>(`/branches/${branchId}/opening-hours`);

        const nextSettings = getResponseSettings(data);
        const nextOpeningHours = normalizeOpeningHours(
          getResponseOpeningHours(data)
        );

        const nextHolidayRanges = normalizeHolidayRanges(
          nextSettings?.holidayRanges ||
            data?.data?.holidayRanges ||
            data?.holidayRanges ||
            []
        );

        setHours(nextOpeningHours);
        setSettings(nextSettings);
        setHolidayRanges(nextHolidayRanges);
      } catch (err: any) {
        toast.error(err.message || "Failed to fetch opening hours");
      } finally {
        setFetching(false);
      }
    };

    fetchHours();
  }, [open, branchId]);

  const handleHourChange = (
    index: number,
    field: keyof OpeningHour,
    value: any
  ) => {
    setHours((prev) =>
      prev.map((day, dayIndex) =>
        dayIndex === index
          ? {
              ...day,
              [field]: value,
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

  const ensureHolidayRangesVisible = () => {
    if (!hasHolidayRanges) {
      setHolidayRanges([createDefaultHolidayRange()]);
    }
  };

  const addHolidayRange = () => {
    setHolidayRanges((prev) => [...prev, createDefaultHolidayRange()]);
  };

  const updateHolidayRange = (
    index: number,
    field: keyof HolidayRange,
    value: any
  ) => {
    ensureHolidayRangesVisible();

    setHolidayRanges((prev) => {
      const current = prev.length ? prev : [createDefaultHolidayRange()];

      return current.map((holiday, holidayIndex) =>
        holidayIndex === index
          ? {
              ...holiday,
              [field]: value,
            }
          : holiday
      );
    });
  };

  const removeHolidayRange = (index: number) => {
    setHolidayRanges((prev) =>
      prev.filter((_, holidayIndex) => holidayIndex !== index)
    );
  };

  const validateOpeningHours = () => {
    for (const day of hours) {
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

    for (const holiday of holidayRanges) {
      const hasAnyHolidayValue =
        holiday.fromDate ||
        holiday.toDate ||
        holiday.note ||
        (!holiday.isClosed && (holiday.openTime || holiday.closeTime));

      if (!hasAnyHolidayValue) continue;

      if (!holiday.fromDate || !holiday.toDate) {
        toast.error("Holiday range requires both from and to dates");
        return false;
      }

      if (holiday.fromDate > holiday.toDate) {
        toast.error("Holiday to date must be the same as or after from date");
        return false;
      }

      if (
        !holiday.isClosed &&
        isTimeRangeInvalid(holiday.openTime, holiday.closeTime)
      ) {
        toast.error("Holiday close time must be after open time");
        return false;
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

  const sanitizeHolidayRanges = () => {
    return holidayRanges
      .filter(
        (holiday) =>
          holiday.fromDate ||
          holiday.toDate ||
          holiday.note ||
          (!holiday.isClosed && (holiday.openTime || holiday.closeTime))
      )
      .map((holiday) => ({
        ...(holiday.id ? { id: holiday.id } : {}),
        fromDate: holiday.fromDate,
        toDate: holiday.toDate,
        isClosed: Boolean(holiday.isClosed),
        openTime: holiday.openTime || DEFAULT_OPEN_TIME,
        closeTime: holiday.closeTime || DEFAULT_CLOSE_TIME,
        note: holiday.note?.trim() || undefined,
      }));
  };

  const handleSubmit = async () => {
    if (!validateOpeningHours()) return;

    try {
      setLoading(true);

      const payload = {
        openingHours: sanitizeOpeningHours(),
        settings: {
          ...settings,
          holidayRanges: sanitizeHolidayRanges(),
        },
      };

      await httpClient.put(`/branches/${branchId}/opening-hours`, payload);

      toast.success("Opening hours saved");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally {
      setLoading(false);
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
          Opening Hours
        </DialogTitle>
        <p className="text-sm text-gray-500">{branchName}</p>
      </DialogHeader>

      <div className="mt-5 w-full min-w-0 space-y-5">
        <section className="w-full min-w-0 overflow-hidden rounded-[16px] bg-white p-4 sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-gray-900">
                Weekly business hours
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Configure regular opening hours and daily break times.
              </p>
            </div>
          </div>

          {fetching ? (
            <div className="flex items-center gap-2 rounded-[12px] border border-gray-100 bg-gray-50 p-4 text-sm text-gray-500">
              <Loader2 size={16} className="animate-spin" />
              Loading opening hours...
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
                        {formatDayLabel(day.dayOfWeek)}
                      </h4>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {day.isClosed
                          ? "Closed for the full day"
                          : `${day.openTime || "--:--"} - ${
                              day.closeTime || "--:--"
                            }`}
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
                      Closed
                    </label>
                  </div>

                  {!day.isClosed ? (
                    <div className="mt-4 space-y-4">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="min-w-0 space-y-1.5">
                          <span className="text-xs font-medium text-gray-500">
                            Open time
                          </span>

                          <input
                            type="time"
                            value={day.openTime || ""}
                            onChange={(e) =>
                              handleHourChange(
                                index,
                                "openTime",
                                e.target.value
                              )
                            }
                            className="h-11 w-full rounded-[10px] border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none [color-scheme:light] focus:border-primary focus:ring-2 focus:ring-primary/10"
                          />
                        </label>

                        <label className="min-w-0 space-y-1.5">
                          <span className="text-xs font-medium text-gray-500">
                            Close time
                          </span>

                          <input
                            type="time"
                            value={day.closeTime || ""}
                            onChange={(e) =>
                              handleHourChange(
                                index,
                                "closeTime",
                                e.target.value
                              )
                            }
                            className="h-11 w-full rounded-[10px] border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none [color-scheme:light] focus:border-primary focus:ring-2 focus:ring-primary/10"
                          />
                        </label>
                      </div>

                      <div className="min-w-0 rounded-[14px] border border-dashed border-gray-200 bg-gray-50/70 p-3">
                        <div className="mb-3 flex min-w-0 flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Clock size={15} className="text-primary" />
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                              Break times
                            </p>
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => addBreakTime(index)}
                            className="h-9 shrink-0 rounded-full border-primary/20 bg-white px-3 text-xs font-medium text-primary hover:bg-primary/5"
                          >
                            <Plus size={13} />
                            Add break
                          </Button>
                        </div>

                        {day.breakTimes.length === 0 ? (
                          <p className="text-xs text-gray-400">
                            No regular break configured for this day.
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
                                      Break start
                                    </label>

                                    <input
                                      type="time"
                                      value={breakTime.startTime || ""}
                                      onChange={(e) =>
                                        updateBreakTime(
                                          index,
                                          breakIndex,
                                          "startTime",
                                          e.target.value
                                        )
                                      }
                                      className="h-11 w-full rounded-[10px] border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none [color-scheme:light] focus:border-primary focus:ring-2 focus:ring-primary/10"
                                    />
                                  </div>

                                  <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-500">
                                      Break end
                                    </label>

                                    <input
                                      type="time"
                                      value={breakTime.endTime || ""}
                                      onChange={(e) =>
                                        updateBreakTime(
                                          index,
                                          breakIndex,
                                          "endTime",
                                          e.target.value
                                        )
                                      }
                                      className="h-11 w-full rounded-[10px] border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none [color-scheme:light] focus:border-primary focus:ring-2 focus:ring-primary/10"
                                    />
                                  </div>
                                </div>

                                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
                                  <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-500">
                                      Note
                                    </label>

                                    <input
                                      type="text"
                                      placeholder="Break note e.g. Lunch break"
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
                                      aria-label="Remove break time"
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
                    placeholder="Note (optional)"
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

        <section className="w-full min-w-0 overflow-hidden rounded-[16px] bg-white p-4 sm:p-5">
          <div className="mb-4 flex min-w-0 flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <CalendarDays size={17} className="text-primary" />
                <h3 className="text-base font-semibold text-gray-900">
                  Holiday date ranges
                </h3>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Add holidays using a from-to date range instead of a single date.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={addHolidayRange}
              className="h-10 shrink-0 rounded-full border-primary/20 bg-primary/5 px-4 text-sm font-medium text-primary hover:bg-primary/10"
            >
              <Plus size={15} />
              Add holiday range
            </Button>
          </div>

          {!hasHolidayRanges ? (
            <div className="rounded-[12px] border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
              No holiday range configured yet. Click “Add holiday range” to add
              one.
            </div>
          ) : (
            <div className="space-y-3">
              {visibleHolidayRanges.map((holiday, index) => (
                <div
                  key={`holiday-range-${holiday.id || index}`}
                  className="min-w-0 rounded-[14px] border border-gray-100 bg-gray-50/70 p-4"
                >
                  <div className="mb-3 flex min-w-0 flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-900">
                      Holiday range {index + 1}
                    </p>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeHolidayRange(index)}
                      className="h-9 w-9 rounded-md text-red-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="min-w-0 space-y-1.5">
                      <span className="text-xs font-medium text-gray-500">
                        From date
                      </span>

                      <input
                        type="date"
                        value={holiday.fromDate}
                        onChange={(e) =>
                          updateHolidayRange(
                            index,
                            "fromDate",
                            e.target.value
                          )
                        }
                        className="h-11 w-full rounded-[10px] border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none [color-scheme:light] focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                    </label>

                    <label className="min-w-0 space-y-1.5">
                      <span className="text-xs font-medium text-gray-500">
                        To date
                      </span>

                      <input
                        type="date"
                        value={holiday.toDate}
                        onChange={(e) =>
                          updateHolidayRange(index, "toDate", e.target.value)
                        }
                        className="h-11 w-full rounded-[10px] border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none [color-scheme:light] focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                    </label>
                  </div>

                  <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={holiday.isClosed}
                      onChange={(e) =>
                        updateHolidayRange(index, "isClosed", e.target.checked)
                      }
                      className="accent-[var(--primary)]"
                    />
                    Closed during this holiday range
                  </label>

                  {!holiday.isClosed ? (
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className="min-w-0 space-y-1.5">
                        <span className="text-xs font-medium text-gray-500">
                          Holiday open time
                        </span>

                        <input
                          type="time"
                          value={holiday.openTime || ""}
                          onChange={(e) =>
                            updateHolidayRange(
                              index,
                              "openTime",
                              e.target.value
                            )
                          }
                          className="h-11 w-full rounded-[10px] border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none [color-scheme:light] focus:border-primary focus:ring-2 focus:ring-primary/10"
                        />
                      </label>

                      <label className="min-w-0 space-y-1.5">
                        <span className="text-xs font-medium text-gray-500">
                          Holiday close time
                        </span>

                        <input
                          type="time"
                          value={holiday.closeTime || ""}
                          onChange={(e) =>
                            updateHolidayRange(
                              index,
                              "closeTime",
                              e.target.value
                            )
                          }
                          className="h-11 w-full rounded-[10px] border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none [color-scheme:light] focus:border-primary focus:ring-2 focus:ring-primary/10"
                        />
                      </label>
                    </div>
                  ) : null}

                  <input
                    type="text"
                    placeholder="Holiday note (optional)"
                    value={holiday.note || ""}
                    onChange={(e) =>
                      updateHolidayRange(index, "note", e.target.value)
                    }
                    className="mt-3 h-11 w-full min-w-0 rounded-[10px] border border-gray-200 bg-white px-3 text-sm outline-none placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
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
          {loading ? "Saving..." : "Save Opening Hours"}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);
}
