"use client";

import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { CalendarDays, Clock3 } from "lucide-react";

import { Label } from "@/components/ui/label";
import { getStartOfToday } from "@/lib/date-input";
import { formatDateTime24 } from "@/lib/date-time-format";
import { cn } from "@/lib/utils";

type DateTimePickerFieldProps = {
  label: string;
  value: Date;
  onChange: (value: Date) => void;
  disabled?: boolean;
  minDate?: Date;
  helperText?: string;
};

const formatDateTimeLabel = (date: Date) => {
  return formatDateTime24({
    value: date,
    options: {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    },
  });
};

const toTimeValue = (date: Date) => {
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
};

const startOfDay = (date: Date) => {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
};

const clampToMinDate = (date: Date, minDate?: Date) => {
  if (!minDate || date.getTime() >= minDate.getTime()) return date;
  return new Date(minDate);
};

export function DateTimePickerField({
  label,
  value,
  onChange,
  disabled = false,
  minDate,
  helperText,
}: DateTimePickerFieldProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const minimumDate = minDate ?? getStartOfToday();
  const minimumDay = startOfDay(minimumDate);

  const handleDateSelect = (date?: Date) => {
    if (!date) return;

    const nextDate = new Date(date);
    nextDate.setHours(value.getHours(), value.getMinutes(), 0, 0);
    onChange(clampToMinDate(nextDate, minimumDate));
    setCalendarOpen(false);
  };

  const handleTimeChange = (timeValue: string) => {
    const [hours = "0", minutes = "0"] = timeValue.split(":");
    const nextDate = new Date(value);
    nextDate.setHours(Number(hours), Number(minutes), 0, 0);
    onChange(clampToMinDate(nextDate, minimumDate));
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-gray-950">{label}</Label>

      <div className={`relative ${calendarOpen ? "z-30" : ""}`}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setCalendarOpen((current) => !current)}
          className="flex min-h-[52px] w-full items-center rounded-[18px] border border-gray-200 bg-white pl-12 pr-4 text-left text-sm font-semibold text-gray-950 shadow-sm outline-none transition hover:border-primary/40 focus:border-primary/40 focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <CalendarDays
            size={18}
            className="absolute left-4 top-[18px] text-primary"
          />
          <span className="truncate">{formatDateTimeLabel(value)}</span>
        </button>

        {calendarOpen ? (
          <div className="absolute left-0 top-[60px] z-50 w-max max-w-[calc(100vw-48px)] overflow-x-auto rounded-[20px] border border-gray-200 bg-white p-3 shadow-xl">
            <DayPicker
              mode="single"
              selected={value}
              onSelect={handleDateSelect}
              disabled={{ before: minimumDay }}
              className="text-sm"
              classNames={{
                months: "flex",
                month: "space-y-3",
                month_caption:
                  "flex justify-center pb-2 text-sm font-semibold text-gray-900",
                nav: "absolute left-3 right-3 top-3 flex items-center justify-between",
                button_previous: "rounded-full p-1 text-gray-500 hover:bg-gray-100",
                button_next: "rounded-full p-1 text-gray-500 hover:bg-gray-100",
                weekdays: "grid grid-cols-7 gap-1 text-xs text-gray-400",
                week: "grid grid-cols-7 gap-1",
                day: "h-8 w-8 text-center text-sm",
                day_button: "h-8 w-8 rounded-full text-sm hover:bg-primary/10",
                selected:
                  "[&>button]:bg-primary [&>button]:text-white [&>button]:hover:bg-primary",
                today: "[&>button]:ring-1 [&>button]:ring-primary",
                disabled: "pointer-events-none text-gray-300 opacity-50",
                outside: "text-gray-300",
              }}
            />
          </div>
        ) : null}
      </div>

      <div className="relative">
        <Clock3
          size={17}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-primary"
        />
        <input
          type="time"
          value={toTimeValue(value)}
          disabled={disabled}
          onChange={(event) => handleTimeChange(event.target.value)}
          className={cn(
            "h-[52px] w-full rounded-[18px] border border-gray-200 bg-white pl-12 pr-4 text-sm font-semibold text-gray-950 shadow-sm outline-none transition",
            "focus:border-primary/40 focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
          )}
        />
      </div>

      {helperText ? (
        <p className="text-xs leading-5 text-gray-500">{helperText}</p>
      ) : null}
    </div>
  );
}
