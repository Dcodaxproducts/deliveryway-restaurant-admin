"use client";

import { format, isValid, parse } from "date-fns";
import { CalendarDays } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import type { Matcher } from "react-day-picker";
import { TimeSelectFields } from "@/components/ui/time-24-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const DATE_FORMAT = "yyyy-MM-dd";
const DATE_TIME_FORMAT = "yyyy-MM-dd'T'HH:mm";

const parseInput = (value: string, formatPattern: string) => {
  if (!value) return undefined;
  const parsed = parse(value, formatPattern, new Date());
  return isValid(parsed) ? parsed : undefined;
};

const toDate = (value?: string) => parseInput(value ?? "", DATE_FORMAT);
const toDateTime = (value?: string) =>
  parseInput(value ?? "", DATE_TIME_FORMAT);

const toDisabledMatcher = (min?: string, max?: string) => {
  const before = toDate(min);
  const after = toDate(max);
  const matchers: Matcher[] = [];
  if (before) matchers.push({ before });
  if (after) matchers.push({ after });
  return matchers.length > 0 ? matchers : undefined;
};

type DateInputProps = {
  value?: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  onBlur?: () => void;
};

export function DatePickerInput({
  value = "",
  onChange,
  min,
  max,
  disabled,
  placeholder = "Select date",
  ariaLabel,
  className,
  onBlur,
}: DateInputProps) {
  const [open, setOpen] = useState(false);
  const selected = toDate(value);
  const [visibleMonth, setVisibleMonth] = useState(selected ?? new Date());

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) setVisibleMonth(selected ?? new Date());
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          aria-label={ariaLabel ?? placeholder}
          aria-invalid={undefined}
          className={cn(
            "h-10 w-full justify-start rounded-[var(--ui-radius-control)] border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 text-left text-sm font-normal",
            !selected && "text-[var(--ui-text-subtle)]",
            className,
          )}
          onBlur={onBlur}
        >
          <CalendarDays aria-hidden="true" className="text-[var(--ui-text-muted)]" />
          <span className="truncate">
            {selected ? format(selected, "PPP") : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="max-w-[calc(100vw-2rem)]" align="start">
        <Calendar
          mode="single"
          month={visibleMonth}
          onMonthChange={setVisibleMonth}
          selected={selected}
          disabled={toDisabledMatcher(min, max)}
          onSelect={(nextDate) => {
            onChange(nextDate ? format(nextDate, DATE_FORMAT) : "");
            setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export function DateTimePickerInput({
  value = "",
  onChange,
  min,
  max,
  disabled,
  placeholder = "Select date and time",
  ariaLabel,
  className,
  onBlur,
}: DateInputProps) {
  const [open, setOpen] = useState(false);
  const selected = toDateTime(value);
  const [visibleMonth, setVisibleMonth] = useState(selected ?? new Date());
  const minDate = min?.slice(0, 10);
  const maxDate = max?.slice(0, 10);
  const timeValue = selected ? format(selected, "HH:mm") : "00:00";

  const update = (date: Date, time: string) => {
    const [hours = "0", minutes = "0"] = time.split(":");
    const next = new Date(date);
    next.setHours(Number(hours), Number(minutes), 0, 0);
    onChange(format(next, DATE_TIME_FORMAT));
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) setVisibleMonth(selected ?? new Date());
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          aria-label={ariaLabel ?? placeholder}
          className={cn(
            "h-10 w-full justify-start rounded-[var(--ui-radius-control)] border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 text-left text-sm font-normal",
            !selected && "text-[var(--ui-text-subtle)]",
            className,
          )}
          onBlur={onBlur}
        >
          <CalendarDays aria-hidden="true" className="text-[var(--ui-text-muted)]" />
          <span className="truncate">
            {selected ? format(selected, "PPp") : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="max-w-[calc(100vw-2rem)]" align="start">
        <Calendar
          mode="single"
          month={visibleMonth}
          onMonthChange={setVisibleMonth}
          selected={selected}
          disabled={toDisabledMatcher(minDate, maxDate)}
          onSelect={(nextDate) => {
            if (nextDate) update(nextDate, timeValue);
          }}
          initialFocus
        />
        <div className="border-t border-[var(--ui-border)] p-3">
          <TimeSelectFields
            value={timeValue}
            idPrefix="date-time"
            onChange={(nextTime) => update(selected ?? visibleMonth, nextTime)}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
