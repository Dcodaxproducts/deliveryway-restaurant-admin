import type { FieldPath, UseFormRegister } from "react-hook-form";
import { Type } from "lucide-react";

import { Input } from "@/components/ui/input";
import type { BrandingFormValues } from "@/validations/branding";

type TypographySectionProps = {
  register: UseFormRegister<BrandingFormValues>;
  values: BrandingFormValues;
  getError: (name: FieldPath<BrandingFormValues>) => string | undefined;
};

type TextFieldConfig = {
  id: string;
  label: string;
  name: FieldPath<BrandingFormValues>;
  placeholder: string;
};

type SelectFieldConfig = {
  id: string;
  label: string;
  name: FieldPath<BrandingFormValues>;
  options: { label: string; value: string }[];
};

const defaultFontStack = "var(--font-onest), 'Onest', 'Onest Fallback', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const fontFamilyOptions = [
  { label: "Onest / System Sans (Default)", value: defaultFontStack },
  { label: "Barlow", value: "Barlow, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  { label: "Poppins", value: "Poppins, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  { label: "Arimo", value: "Arimo, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  { label: "System UI", value: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  { label: "Serif", value: "Georgia, Cambria, 'Times New Roman', Times, serif" },
];

const panelClassName = "bg-white p-4 lg:p-6 rounded-lg shadow-sm";
const labelClassName = "block text-base font-semibold text-dark mb-2";
const inputClassName = "h-[52px] border-gray-200 rounded-[12px] focus:ring-primary";
const selectClassName = "h-[52px] w-full rounded-[12px] border border-gray-200 bg-white px-3 text-base outline-none focus:ring-2 focus:ring-primary/20";

export default function TypographySection({ register, values: _values, getError }: TypographySectionProps) {
  void _values;

  const textFields: TextFieldConfig[] = [
    {
      id: "border-radius",
      label: "Border Radius",
      name: "restaurant.branding.theme.borderRadius",
      placeholder: "12px",
    },
  ];

  const selectFields: SelectFieldConfig[] = [
    {
      id: "heading-font-family",
      label: "Heading Font Family",
      name: "restaurant.branding.theme.headingFontFamily",
      options: fontFamilyOptions,
    },
    {
      id: "body-font-family",
      label: "Body Font Family",
      name: "restaurant.branding.theme.fontFamily",
      options: fontFamilyOptions,
    },
    {
      id: "button-style",
      label: "Button Style",
      name: "restaurant.branding.theme.buttonStyle",
      options: [
        { label: "Rounded", value: "rounded" },
        { label: "Pill", value: "pill" },
        { label: "Square", value: "square" },
      ],
    },
    {
      id: "theme-mode",
      label: "Theme Mode",
      name: "restaurant.branding.theme.mode",
      options: [
        { label: "Light", value: "light" },
        { label: "Dark", value: "dark" },
        { label: "System", value: "system" },
      ],
    },
    {
      id: "menu-card-style",
      label: "Menu Card Style",
      name: "restaurant.branding.theme.menuCardStyle",
      options: [
        { label: "Image Top", value: "image-top" },
        { label: "Compact", value: "compact" },
        { label: "Image Left", value: "image-left" },
      ],
    },
  ];

  return (
    <div className={panelClassName}>
      <div className="mb-6 flex items-center gap-3">
        <Type className="text-gray-500" />
        <h3 className="text-[20px] font-semibold text-dark">Typography & Layout</h3>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {textFields.map(({ id, label, name, placeholder }) => (
          <div key={name}>
            <label htmlFor={id} className={labelClassName}>
              {label}
            </label>
            <Input
              id={id}
              placeholder={placeholder}
              aria-invalid={Boolean(getError(name))}
              className={inputClassName}
              {...register(name)}
            />
            {getError(name) ? <p className="mt-2 text-sm text-destructive">{getError(name)}</p> : null}
          </div>
        ))}
        {selectFields.map(({ id, label, name, options }) => (
          <div key={name}>
            <label htmlFor={id} className={labelClassName}>
              {label}
            </label>
            <select id={id} className={selectClassName} {...register(name)}>
              {options.map(({ label: optionLabel, value }) => (
                <option key={value} value={value}>
                  {optionLabel}
                </option>
              ))}
            </select>
            {getError(name) ? <p className="mt-2 text-sm text-destructive">{getError(name)}</p> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
