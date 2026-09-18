"use client";

import { Check, ChevronDown, Clock3 } from "lucide-react";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
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

type TimeDropdownProps = {
  id: string;
  label: string;
  value: string;
  options: string[];
  open: boolean;
  disabled?: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (value: string) => void;
};

function TimeDropdown({
  id,
  label,
  value,
  options,
  open,
  disabled,
  onOpenChange,
  onChange,
}: TimeDropdownProps) {
  const listboxId = `${id}-listbox`;

  return (
    <div className="relative min-w-0">
      <button
        type="button"
        id={id}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        disabled={disabled}
        data-slot="time-dropdown-trigger"
        className="flex h-10 w-full items-center justify-between gap-2 rounded-[var(--ui-radius-control)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 text-sm text-[var(--ui-text)] outline-none transition-[border-color,box-shadow] focus:border-primary focus:ring-2 focus:ring-[var(--ui-focus-ring)]/20 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => onOpenChange(!open)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            onOpenChange(true);
          }
          if (event.key === "Escape") onOpenChange(false);
        }}
      >
        <span className={cn("truncate", !value && "text-[var(--ui-text-subtle)]")}>
          {value || label}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-4 shrink-0 text-[var(--ui-text-muted)] transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label={label}
          data-slot="time-dropdown-content"
          className="absolute inset-x-0 bottom-[calc(100%+0.25rem)] z-[var(--ui-layer-dropdown)] max-h-48 overflow-y-auto rounded-[var(--ui-radius-control)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-1 shadow-[var(--ui-shadow-md)]"
        >
          {options.map((option) => {
            const selected = option === value;

            return (
              <button
                type="button"
                key={option}
                role="option"
                aria-selected={selected}
                data-slot="time-dropdown-option"
                className={cn(
                  "flex h-8 w-full items-center justify-between rounded-[calc(var(--ui-radius-control)-2px)] px-2.5 text-left text-sm outline-none hover:bg-[var(--ui-surface-muted)] focus-visible:bg-[var(--ui-surface-muted)]",
                  selected && "bg-primary/10 font-medium text-primary",
                )}
                onClick={() => {
                  onChange(option);
                  onOpenChange(false);
                }}
              >
                <span>{option}</span>
                {selected ? <Check aria-hidden="true" className="size-3.5" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

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
  const [openField, setOpenField] = useState<"hour" | "minute" | null>(null);

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
      <TimeDropdown
        id={`${resolvedIdPrefix}-hour`}
        label="Hour"
        value={hour}
        options={HOURS}
        open={openField === "hour"}
        onOpenChange={(open) => setOpenField(open ? "hour" : null)}
        onChange={updateHour}
        disabled={disabled}
      />
      <span aria-hidden="true" className="font-semibold text-[var(--ui-text-muted)]">
        :
      </span>
      <TimeDropdown
        id={`${resolvedIdPrefix}-minute`}
        label="Minute"
        value={minute}
        options={MINUTES}
        open={openField === "minute"}
        onOpenChange={(open) => setOpenField(open ? "minute" : null)}
        onChange={updateMinute}
        disabled={disabled}
      />
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
