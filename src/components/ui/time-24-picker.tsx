import { Input } from "@/components/ui/input";
import { normalizeTime24 } from "@/hooks/use-time-24";

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

  return (
    <Input
      type="time"
      id={id}
      name={name}
      value={normalizedValue}
      onChange={(event) => {
        const next = event.target.value;
        onChange(next ? normalizeTime24(next) : "");
      }}
      disabled={disabled}
      required={required}
      min={minTime}
      max={maxTime}
      placeholder={placeholder}
      className={className}
      aria-invalid={Boolean(error) || undefined}
      aria-label={placeholder || name || "Time"}
    />
  );
}
