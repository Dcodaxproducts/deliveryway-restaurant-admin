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

const descriptionClassName = "text-sm text-gray";
const textInputClassName = "h-11 rounded-[12px] border-gray-200 font-mono text-sm uppercase";
const colorInputClassName = "h-11 w-14 cursor-pointer rounded-[12px] border border-gray-200 bg-white p-1";

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
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div>
          <label htmlFor={`${id}-text`} className={BRANDING_LABEL_COMPACT_CLASS}>
            {label}
          </label>
          {description ? <p className={descriptionClassName}>{description}</p> : null}
        </div>
        <div className="flex items-center gap-2">
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
