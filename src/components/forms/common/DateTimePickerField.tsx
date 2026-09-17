"use client";

import { format, parse } from "date-fns";

import { DateTimePickerInput } from "@/components/common/DateTimeInputs";
import { Label } from "@/components/ui/label";
import { getStartOfToday } from "@/lib/date-input";

type DateTimePickerFieldProps = {
  label: string;
  value: Date;
  onChange: (value: Date) => void;
  disabled?: boolean;
  minDate?: Date;
  helperText?: string;
};

const DATE_TIME_FORMAT = "yyyy-MM-dd'T'HH:mm";

export function DateTimePickerField({
  label,
  value,
  onChange,
  disabled = false,
  minDate,
  helperText,
}: DateTimePickerFieldProps) {
  const minimumDate = minDate ?? getStartOfToday();

  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-[var(--ui-text)]">
        {label}
      </Label>
      <DateTimePickerInput
        value={format(value, DATE_TIME_FORMAT)}
        min={format(minimumDate, DATE_TIME_FORMAT)}
        disabled={disabled}
        ariaLabel={label}
        onChange={(nextValue) =>
          onChange(parse(nextValue, DATE_TIME_FORMAT, value))
        }
      />
      {helperText ? (
        <p className="text-xs leading-5 text-[var(--ui-text-muted)]">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
