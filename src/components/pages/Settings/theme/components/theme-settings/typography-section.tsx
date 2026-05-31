import type { FieldPath, UseFormRegister } from "react-hook-form";
import { Type } from "lucide-react";

import { Input } from "@/components/ui/input";
import type { BrandingFormValues } from "@/validations/branding";

import {
  BRANDING_ERROR_CLASS,
  BRANDING_INPUT_CLASS,
  BRANDING_LABEL_CLASS,
  BRANDING_PANEL_CLASS,
  BRANDING_SECTION_TITLE_CLASS,
} from "./branding-form-classes";

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

const selectClassName = "h-[52px] w-full rounded-[12px] border border-gray-200 bg-white px-3 text-base outline-none focus:ring-2 focus:ring-primary/20";

export default function TypographySection({ register, getError }: TypographySectionProps) {
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
    <div className={BRANDING_PANEL_CLASS}>
      <div className="mb-6 flex items-center gap-3">
        <Type className="text-gray-500" />
        <h3 className={BRANDING_SECTION_TITLE_CLASS}>Typography & Layout</h3>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {textFields.map(({ id, label, name, placeholder }) => (
          <div key={name}>
            <label htmlFor={id} className={BRANDING_LABEL_CLASS}>
              {label}
            </label>
            <Input
              id={id}
              placeholder={placeholder}
              aria-invalid={Boolean(getError(name))}
              className={BRANDING_INPUT_CLASS}
              {...register(name)}
            />
            {getError(name) ? <p className={BRANDING_ERROR_CLASS}>{getError(name)}</p> : null}
          </div>
        ))}
        {selectFields.map(({ id, label, name, options }) => (
          <div key={name}>
            <label htmlFor={id} className={BRANDING_LABEL_CLASS}>
              {label}
            </label>
            <select id={id} className={selectClassName} {...register(name)}>
              {options.map(({ label: optionLabel, value }) => (
                <option key={value} value={value}>
                  {optionLabel}
                </option>
              ))}
            </select>
            {getError(name) ? <p className={BRANDING_ERROR_CLASS}>{getError(name)}</p> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
