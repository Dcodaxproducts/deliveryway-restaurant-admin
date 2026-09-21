import type { FieldPath, UseFormRegister, UseFormSetValue } from "react-hook-form";

import { Input } from "@/components/ui/input";
import type { BrandingFormValues } from "@/validations/branding";

import {
  BRANDING_ERROR_COMPACT_CLASS,
  BRANDING_LABEL_COMPACT_CLASS,
} from "./branding-form-classes";

type ColorFieldName = FieldPath<BrandingFormValues>;

type ColorPickerProps = {
  id: string;
  label: string;
  description?: string;
  name: ColorFieldName;
  value?: string;
  register: UseFormRegister<BrandingFormValues>;
  setValue: UseFormSetValue<BrandingFormValues>;
  error?: string;
};

const descriptionClassName = "mt-1 text-xs leading-5 text-[var(--ui-text-muted)]";
const textInputClassName = "h-10 min-w-0 rounded-[var(--ui-radius-control)] border-[var(--ui-border)] font-mono text-sm uppercase";
const colorInputClassName = "h-10 w-12 cursor-pointer rounded-[var(--ui-radius-control)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-1";

export default function ColorPicker({
  id,
  label,
  description,
  name,
  value,
  register,
  setValue,
  error,
}: ColorPickerProps) {
  const colorValue = value && /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000";

  return (
    <div className="space-y-2 rounded-[var(--ui-radius-control)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-3">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_200px] xl:items-center">
        <div className="min-w-0">
          <label htmlFor={`${id}-text`} className={BRANDING_LABEL_COMPACT_CLASS}>
            {label}
          </label>
          {description ? <p className={descriptionClassName}>{description}</p> : null}
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <input
            id={`${id}-color`}
            type="color"
            value={colorValue}
            aria-label={`${label} color picker`}
            className={colorInputClassName}
            onChange={(event) =>
              setValue(name, event.target.value.toUpperCase(), {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
              })
            }
          />
          <Input
            id={`${id}-text`}
            type="text"
            placeholder="#000000"
            aria-invalid={Boolean(error)}
            className={textInputClassName}
            {...register(name)}
          />
        </div>
      </div>
      {error ? <p className={BRANDING_ERROR_COMPACT_CLASS}>{error}</p> : null}
    </div>
  );
}
