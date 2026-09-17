"use client";

import { Clock3 } from "lucide-react";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/form-select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { normalizeTime24 } from "@/hooks/use-time-24";
import { cn } from "@/lib/utils";

type Time24PickerProps = {
  value?: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  minTime?: string;
  maxTime?: string;
  error?: string | boolean | null;
  className?: string;
  placeholder?: string;
  id?: string;
};

type TimeSelectFieldsProps = {
  value?: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
  idPrefix?: string;
  className?: string;
};

const HOURS = Array.from({ length: 24 }, (_, hour) =>
  String(hour).padStart(2, "0"),
);
const MINUTES = Array.from({ length: 60 }, (_, minute) =>
  String(minute).padStart(2, "0"),
);

export function TimeSelectFields({
  value,
  onChange,
  disabled,
  idPrefix,
  className,
}: TimeSelectFieldsProps) {
  const generatedId = useId();
  const resolvedIdPrefix = idPrefix ?? generatedId;
  const normalizedValue = value ? normalizeTime24(value) : "";
  const [hour = "", minute = ""] = normalizedValue.split(":");

  const updateHour = (nextHour: string) => {
    onChange(`${nextHour}:${minute || "00"}`);
  };

  const updateMinute = (nextMinute: string) => {
    onChange(`${hour || "00"}:${nextMinute}`);
  };

  return (
    <div
      data-slot="time-select-fields"
      className={cn("grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2", className)}
    >
      <FormSelect
        id={`${resolvedIdPrefix}-hour`}
        aria-label="Hour"
        value={hour}
        onChange={(event) => updateHour(event.target.value)}
        disabled={disabled}
        className="h-10 rounded-[var(--ui-radius-control)] text-sm"
        contentClassName="max-h-64"
      >
        <option value="" disabled>
          Hour
        </option>
        {HOURS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </FormSelect>
      <span aria-hidden="true" className="font-semibold text-[var(--ui-text-muted)]">
        :
      </span>
      <FormSelect
        id={`${resolvedIdPrefix}-minute`}
        aria-label="Minute"
        value={minute}
        onChange={(event) => updateMinute(event.target.value)}
        disabled={disabled}
        className="h-10 rounded-[var(--ui-radius-control)] text-sm"
        contentClassName="max-h-64"
      >
        <option value="" disabled>
          Minute
        </option>
        {MINUTES.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </FormSelect>
    </div>
  );
}

export function Time24Picker({
  value,
  onChange,
  disabled,
  required,
  name,
  minTime,
  maxTime,
  error,
  className = "",
  placeholder,
  id,
}: Time24PickerProps) {
  const normalizedValue = value ? normalizeTime24(value) : "";
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          id={id}
          name={name}
          variant="outline"
          disabled={disabled}
          aria-required={required || undefined}
          aria-invalid={Boolean(error) || undefined}
          aria-label={placeholder || name || "Time"}
          className={cn(
            "h-10 w-full justify-start rounded-[var(--ui-radius-control)] border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 text-left text-sm font-normal",
            !normalizedValue && "text-[var(--ui-text-subtle)]",
            className,
          )}
        >
          <Clock3 aria-hidden="true" className="text-[var(--ui-text-muted)]" />
          <span className="truncate">{normalizedValue || placeholder || "Select time"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[min(20rem,calc(100vw-2rem))] p-3"
      >
        <TimeSelectFields
          value={normalizedValue}
          disabled={disabled}
          idPrefix={id ?? name}
          onChange={(nextValue) => {
            const normalized = normalizeTime24(nextValue);
            if (minTime && normalized < normalizeTime24(minTime)) return;
            if (maxTime && normalized > normalizeTime24(maxTime)) return;
            onChange(normalized);
          }}
        />
        {!required && normalizedValue ? (
          <div className="mt-3 flex justify-end border-t border-[var(--ui-border)] pt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              Clear
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
