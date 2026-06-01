"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Radio } from "@/components/ui/radioBtn";
import { Switch } from "@/components/ui/switch";
import {
  blockInvalidNumberKeys,
  blockNegativeNumberPaste,
  sanitizeNonNegativeNumber,
} from "@/lib/number-input";
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Clock,
  Clock3,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";

const DAYS = [
  { label: "Sunday", value: "SUNDAY" },
  { label: "Monday", value: "MONDAY" },
  { label: "Tuesday", value: "TUESDAY" },
  { label: "Wednesday", value: "WEDNESDAY" },
  { label: "Thursday", value: "THURSDAY" },
  { label: "Friday", value: "FRIDAY" },
  { label: "Saturday", value: "SATURDAY" },
];

type BreakTime = {
  startTime: string;
  endTime: string;
  note?: string;
};

type OpeningHour = {
  dayOfWeek: string;
  isClosed: boolean;
  openTime: string;
  closeTime: string;
  breakTimes: BreakTime[];
  note?: string;
};

type HolidayRange = {
  fromDate: string;
  toDate: string;
  isClosed: boolean;
  openTime?: string;
  closeTime?: string;
  note?: string;
};

const defaultOpeningHour = (dayOfWeek: string): OpeningHour => ({
  dayOfWeek,
  isClosed: dayOfWeek === "SUNDAY",
  openTime: "09:00",
  closeTime: "18:00",
  breakTimes: [],
  note: "",
});

const normalizeBreakTimes = (breakTimes: any): BreakTime[] => {
  if (!Array.isArray(breakTimes)) return [];

  return breakTimes
    .map((item) => ({
      startTime: String(item?.startTime || ""),
      endTime: String(item?.endTime || ""),
      note: String(item?.note || ""),
    }))
    .filter((item) => item.startTime || item.endTime || item.note);
};

const normalizeOpeningHours = (openingHours: any): OpeningHour[] => {
  const rawHours = Array.isArray(openingHours) ? openingHours : [];

  return DAYS.map(({ value }) => {
    const existing = rawHours.find((item: any) => item?.dayOfWeek === value);

    return {
      ...defaultOpeningHour(value),
      ...(existing || {}),
      dayOfWeek: value,
      isClosed: Boolean(existing?.isClosed ?? value === "SUNDAY"),
      openTime: existing?.openTime || "09:00",
      closeTime: existing?.closeTime || "18:00",
      breakTimes: normalizeBreakTimes(existing?.breakTimes),
      note: existing?.note || "",
    };
  });
};

const normalizeHolidayRanges = (holidayRanges: any): HolidayRange[] => {
  if (!Array.isArray(holidayRanges)) return [];

  return holidayRanges
    .map((item) => ({
      fromDate: String(item?.fromDate || item?.startDate || item?.date || ""),
      toDate: String(item?.toDate || item?.endDate || item?.date || ""),
      isClosed: Boolean(item?.isClosed ?? true),
      openTime: item?.openTime || "09:00",
      closeTime: item?.closeTime || "18:00",
      note: String(item?.note || ""),
    }))
    .filter((item) => item.fromDate || item.toDate || item.note);
};

const createEmptyHolidayRange = (): HolidayRange => ({
  fromDate: "",
  toDate: "",
  isClosed: true,
  openTime: "09:00",
  closeTime: "18:00",
  note: "",
});

const createEmptyBreakTime = (): BreakTime => ({
  startTime: "14:00",
  endTime: "15:00",
  note: "",
});

export default function EditBranchStepThree({ data, setData }: any) {
  const [mode, setMode] = useState<"global" | "custom">("custom");
  const [globalTime, setGlobalTime] = useState({
    openTime: "09:00",
    closeTime: "18:00",
  });

  const settings = data?.settings || {};
  const hours = normalizeOpeningHours(settings.openingHours);
  const holidayRanges = normalizeHolidayRanges(settings.holidayRanges);

  const updateSettings = (patch: Record<string, any>) => {
    if (!data) return;

    setData({
      ...data,
      settings: {
        ...settings,
        ...patch,
      },
    });
  };

  // ================= APPLY GLOBAL =================
  const applyGlobalToAll = (openTime: string, closeTime: string) => {
    if (!data) return;

    const updated = hours.map((item) => ({
      ...item,
      isClosed: false,
      openTime,
      closeTime,
      note: item.note || "Global timing",
      breakTimes: normalizeBreakTimes(item.breakTimes),
    }));

    updateSettings({ openingHours: updated });
  };

  useEffect(() => {
    if (mode === "global" && data) {
      applyGlobalToAll(globalTime.openTime, globalTime.closeTime);
    }
    // intentionally driven by global mode/time only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalTime.openTime, globalTime.closeTime, mode]);

  if (!data) return null;

  // ================= DAY UPDATE =================
  const updateDay = (day: string, patch: Partial<OpeningHour>) => {
    const updated = hours.map((item) =>
      item.dayOfWeek === day ? { ...item, ...patch } : item
    );

    updateSettings({ openingHours: updated });
  };

  const addBreakTime = (day: string) => {
    const item = hours.find((entry) => entry.dayOfWeek === day);
    const breakTimes = [...normalizeBreakTimes(item?.breakTimes), createEmptyBreakTime()];

    updateDay(day, { breakTimes });
  };

  const updateBreakTime = (
    day: string,
    breakIndex: number,
    field: keyof BreakTime,
    value: string
  ) => {
    const item = hours.find((entry) => entry.dayOfWeek === day);
    const breakTimes = normalizeBreakTimes(item?.breakTimes).map((entry, index) =>
      index === breakIndex ? { ...entry, [field]: value } : entry
    );

    updateDay(day, { breakTimes });
  };

  const removeBreakTime = (day: string, breakIndex: number) => {
    const item = hours.find((entry) => entry.dayOfWeek === day);
    const breakTimes = normalizeBreakTimes(item?.breakTimes).filter(
      (_entry, index) => index !== breakIndex
    );

    updateDay(day, { breakTimes });
  };

  const addHolidayRange = () => {
    updateSettings({
      holidayRanges: [...holidayRanges, createEmptyHolidayRange()],
    });
  };

  const updateHolidayRange = (
    index: number,
    field: keyof HolidayRange,
    value: string | boolean
  ) => {
    const updated = holidayRanges.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [field]: value } : item
    );

    updateSettings({ holidayRanges: updated });
  };

  const removeHolidayRange = (index: number) => {
    updateSettings({
      holidayRanges: holidayRanges.filter((_item, itemIndex) => itemIndex !== index),
    });
  };

  const getDay = (day: string) => {
    return hours.find((item) => item.dayOfWeek === day) || defaultOpeningHour(day);
  };

  return (
    <div className="bg-white rounded-[14px]">
      <div className="mb-[24px] rounded-[16px] border border-gray-100 bg-white p-[24px] shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[12px] bg-primary/10 text-primary">
              <Clock3 size={20} />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Delivery Time
              </h3>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                Set the estimated delivery time customers will see for this branch.
              </p>
            </div>
          </div>

          <div className="flex w-full items-center gap-3 md:w-auto">
            <div className="relative w-full md:w-[180px]">
              <Input
                type="number"
                min={0}
                value={data.settings?.deliveryTime ?? ""}
                onKeyDown={blockInvalidNumberKeys}
                onPaste={blockNegativeNumberPaste}
                onChange={(e) =>
                  setData({
                    ...data,
                    settings: {
                      ...(data.settings || {}),
                      deliveryTime:
                        e.target.value === ""
                          ? null
                          : Number(sanitizeNonNegativeNumber(e.target.value)),
                    },
                  })
                }
                placeholder="eg. 30"
                className="h-[42px] rounded-[10px] pr-[72px]"
              />

              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
                min
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-[32px] rounded-[16px] border border-gray-100 bg-white p-[30px] shadow-sm">
        <div className="mb-[16px]">
          <span className="text-sm font-medium border-b border-black pb-[4px]">
            Default Working Hour
          </span>
        </div>

        <div className="flex flex-wrap gap-[32px]">
          <button type="button" onClick={() => setMode("global")}>
            <Radio label="Same time every day" active={mode === "global"} />
          </button>

          <button type="button" onClick={() => setMode("custom")}>
            <Radio label="Set specific time" active={mode === "custom"} />
          </button>
        </div>

        {mode === "global" && (
          <div className="mt-6 flex flex-wrap items-center gap-[16px]">
            <TimeInput
              value={globalTime.openTime}
              onChange={(val: string) =>
                setGlobalTime((prev) => ({ ...prev, openTime: val }))
              }
            />

            <span className="text-sm text-gray-500">to</span>

            <TimeInput
              value={globalTime.closeTime}
              onChange={(val: string) =>
                setGlobalTime((prev) => ({ ...prev, closeTime: val }))
              }
            />
          </div>
        )}
      </div>

      <div className="space-y-[18px] rounded-[16px] border border-gray-100 bg-white p-[30px] shadow-sm">
        <div className="mb-[16px] flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Weekly Opening Hours
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Configure opening time and regular business break times for each day.
            </p>
          </div>
        </div>

        {DAYS.map(({ label, value }) => {
          const item = getDay(value);
          const isActive = !item.isClosed;

          return (
            <WorkingDayRow
              key={value}
              day={label}
              dayValue={value}
              active={isActive}
              openTime={item.openTime}
              closeTime={item.closeTime}
              note={item.note}
              breakTimes={normalizeBreakTimes(item.breakTimes)}
              onToggle={(val: boolean) => {
                if (!val && mode === "global") {
                  setMode("custom");
                }

                updateDay(value, { isClosed: !val });
              }}
              onTimeChange={(type: "openTime" | "closeTime", val: string) =>
                updateDay(value, { [type]: val })
              }
              onNoteChange={(val: string) => updateDay(value, { note: val })}
              onAddBreak={() => addBreakTime(value)}
              onBreakChange={(breakIndex: number, field: keyof BreakTime, val: string) =>
                updateBreakTime(value, breakIndex, field, val)
              }
              onRemoveBreak={(breakIndex: number) => removeBreakTime(value, breakIndex)}
            />
          );
        })}
      </div>

    
    </div>
  );
}

function WorkingDayRow({
  day,
  active,
  openTime,
  closeTime,
  note,
  breakTimes,
  onToggle,
  onTimeChange,
  onNoteChange,
  onAddBreak,
  onBreakChange,
  onRemoveBreak,
}: any) {
  return (
    <div className="rounded-[14px] border border-gray-100 bg-gray-50 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="w-[110px] text-sm font-medium text-dark">{day}</div>

        <Switch checked={active} onCheckedChange={onToggle} />

        {active ? (
          <div className="flex flex-1 flex-wrap items-center gap-[16px]">
            <TimeInput
              value={openTime}
              onChange={(val: string) => onTimeChange("openTime", val)}
            />

            <span className="text-sm text-gray-500">to</span>

            <TimeInput
              value={closeTime}
              onChange={(val: string) => onTimeChange("closeTime", val)}
            />

            <Input
              value={note || ""}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Day note"
              className="h-[38px] min-w-[220px] flex-1 rounded-[10px]"
            />
          </div>
        ) : (
          <p className="text-sm text-gray-400">Closed</p>
        )}
      </div>

      {active && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-gray-700">
                Regular Break Times
              </p>
              <p className="mt-0.5 text-[11px] text-gray-500">
                Add lunch, prayer, staff, or other recurring daily breaks.
              </p>
            </div>

            <button
              type="button"
              onClick={onAddBreak}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-[8px] border border-primary/20 bg-white px-3 text-xs font-semibold text-primary hover:bg-primary/5"
            >
              <Plus size={14} />
              Add Break
            </button>
          </div>

          {breakTimes.length === 0 ? (
            <p className="rounded-[10px] border border-dashed border-gray-200 bg-white px-3 py-2 text-xs text-gray-400">
              No break configured for this day.
            </p>
          ) : (
          <div className="space-y-3">
  {breakTimes.map((breakTime: BreakTime, index: number) => (
    <div
      key={`${day}-break-${index}`}
      className="grid grid-cols-1 gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm md:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_minmax(220px,1fr)_44px]"
    >
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-gray-500">
          Break Start
        </label>

        <Input
          type="time"
          value={breakTime.startTime || ""}
          onChange={(e) =>
            onBreakChange(index, "startTime", e.target.value)
          }
          className="h-11 w-full min-w-[180px] rounded-[10px] bg-white px-3 text-sm text-gray-900 [color-scheme:light]"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-gray-500">
          Break End
        </label>

        <Input
          type="time"
          value={breakTime.endTime || ""}
          onChange={(e) =>
            onBreakChange(index, "endTime", e.target.value)
          }
          className="h-11 w-full min-w-[180px] rounded-[10px] bg-white px-3 text-sm text-gray-900 [color-scheme:light]"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-gray-500">
          Note
        </label>

        <Input
          value={breakTime.note || ""}
          onChange={(e) =>
            onBreakChange(index, "note", e.target.value)
          }
          placeholder="Break note e.g. Lunch break"
          className="h-11 rounded-[10px] bg-white placeholder:text-gray-400"
        />
      </div>

      <div className="flex items-end">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemoveBreak(index)}
          className="h-11 w-11 rounded-[10px] text-red-500 hover:bg-red-50 hover:text-red-600"
          aria-label="Remove break time"
        >
          <Trash2 size={16} />
        </Button>
      </div>
    </div>
  ))}
</div>
          )}
        </div>
      )}
    </div>
  );
}

function TimeInput({ value, onChange }: any) {
  return (
    <div className="flex h-[38px] items-center gap-[8px] rounded-[8px] border bg-white px-[12px] py-[6px]">
      <Clock size={16} className="text-gray-400" />

      <input
        type="time"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-[78px] bg-transparent text-sm text-gray-600 outline-none"
      />

      <div className="flex flex-col">
        <ChevronUp size={14} className="text-gray-400" />
        <ChevronDown size={14} className="text-gray-400" />
      </div>
    </div>
  );
}
