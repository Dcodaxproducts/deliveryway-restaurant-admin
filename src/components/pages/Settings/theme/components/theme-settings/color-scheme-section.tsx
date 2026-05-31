import type { FieldPath, UseFormRegister, UseFormSetValue } from "react-hook-form";
import { Palette } from "lucide-react";

import type { BrandingFormValues } from "@/validations/branding";

import { BRANDING_PANEL_SPACED_CLASS, BRANDING_SECTION_TITLE_CLASS } from "./branding-form-classes";
import ColorPicker from "./color-picker";

type ColorSchemeSectionProps = {
  register: UseFormRegister<BrandingFormValues>;
  setValue: UseFormSetValue<BrandingFormValues>;
  values: BrandingFormValues;
  getError: (name: FieldPath<BrandingFormValues>) => string | undefined;
};

type ColorFieldConfig = {
  id: string;
  label: string;
  description: string;
  name: FieldPath<BrandingFormValues>;
  value: string;
};

const colorGroupClassName = "space-y-5 rounded-[16px] border border-gray-100 p-4";
const colorGroupTitleClassName = "text-base font-semibold text-dark";
const colorGroupDescriptionClassName = "text-sm text-gray";

export default function ColorSchemeSection({ register, setValue, values, getError }: ColorSchemeSectionProps) {
  const { theme } = values.restaurant.branding;
  const { app, checkout } = values.restaurant.branding;

  const lightColorFields: ColorFieldConfig[] = [
    {
      id: "primary-color",
      label: "Primary Brand Color",
      description: "Main light-theme brand color used for buttons and active states.",
      name: "restaurant.branding.theme.primaryColor",
      value: theme.primaryColor,
    },
    {
      id: "secondary-color",
      label: "Secondary Color",
      description: "Light-theme supporting text and dark accents.",
      name: "restaurant.branding.theme.secondaryColor",
      value: theme.secondaryColor,
    },
    {
      id: "accent-color",
      label: "Accent Color",
      description: "Light-theme highlights, badges, and promotional moments.",
      name: "restaurant.branding.theme.accentColor",
      value: theme.accentColor,
    },
    {
      id: "background-color",
      label: "Background Color",
      description: "Default light storefront and app background.",
      name: "restaurant.branding.theme.backgroundColor",
      value: theme.backgroundColor,
    },
    {
      id: "text-color",
      label: "Text Color",
      description: "Primary readable text color for light theme.",
      name: "restaurant.branding.theme.textColor",
      value: theme.textColor,
    },
  ];

  const darkColorFields: ColorFieldConfig[] = [
    {
      id: "dark-primary-color",
      label: "Dark Primary Brand Color",
      description: "Main brand color when dark or system-dark mode is active.",
      name: "restaurant.branding.theme.dark.primaryColor",
      value: theme.dark.primaryColor,
    },
    {
      id: "dark-secondary-color",
      label: "Dark Secondary Color",
      description: "Supporting text and contrast accents for dark theme.",
      name: "restaurant.branding.theme.dark.secondaryColor",
      value: theme.dark.secondaryColor,
    },
    {
      id: "dark-accent-color",
      label: "Dark Accent Color",
      description: "Highlights and badges for dark theme.",
      name: "restaurant.branding.theme.dark.accentColor",
      value: theme.dark.accentColor,
    },
    {
      id: "dark-background-color",
      label: "Dark Background Color",
      description: "Default dark storefront and app background.",
      name: "restaurant.branding.theme.dark.backgroundColor",
      value: theme.dark.backgroundColor,
    },
    {
      id: "dark-text-color",
      label: "Dark Text Color",
      description: "Primary readable text color for dark theme.",
      name: "restaurant.branding.theme.dark.textColor",
      value: theme.dark.textColor,
    },
  ];

  const appColorFields: ColorFieldConfig[] = [
    {
      id: "splash-color",
      label: "App Splash Color",
      description: "Mobile splash/loading surface color.",
      name: "restaurant.branding.app.splashColor",
      value: app.splashColor,
    },
    {
      id: "status-bar-color",
      label: "Status Bar Color",
      description: "Mobile status bar color.",
      name: "restaurant.branding.app.statusBarColor",
      value: app.statusBarColor,
    },
    {
      id: "bottom-nav-color",
      label: "Bottom Nav Color",
      description: "Mobile bottom navigation color.",
      name: "restaurant.branding.app.bottomNavColor",
      value: app.bottomNavColor,
    },
    {
      id: "checkout-highlight-color",
      label: "Checkout Highlight Color",
      description: "Checkout totals and highlight states.",
      name: "restaurant.branding.checkout.highlightColor",
      value: checkout.highlightColor,
    },
    {
      id: "checkout-success-color",
      label: "Checkout Success Color",
      description: "Successful payment and order states.",
      name: "restaurant.branding.checkout.successColor",
      value: checkout.successColor,
    },
    {
      id: "checkout-warning-color",
      label: "Checkout Warning Color",
      description: "Warnings and attention states.",
      name: "restaurant.branding.checkout.warningColor",
      value: checkout.warningColor,
    },
    {
      id: "checkout-error-color",
      label: "Checkout Error Color",
      description: "Validation and payment error states.",
      name: "restaurant.branding.checkout.errorColor",
      value: checkout.errorColor,
    },
  ];

  const renderColorField = ({ id, label, description, name, value }: ColorFieldConfig) => (
    <ColorPicker
      key={name}
      id={id}
      label={label}
      description={description}
      name={name}
      value={value}
      register={register}
      setValue={setValue}
      error={getError(name)}
    />
  );

  return (
    <div className={BRANDING_PANEL_SPACED_CLASS}>
      <div className="flex items-center gap-3">
        <Palette className="text-gray-500" />
        <h3 className={BRANDING_SECTION_TITLE_CLASS}>Color Scheme</h3>
      </div>
      <div className={colorGroupClassName}>
        <div>
          <h4 className={colorGroupTitleClassName}>Light Theme Colors</h4>
          <p className={colorGroupDescriptionClassName}>Used when storefront theme mode is Light.</p>
        </div>
        {lightColorFields.map(renderColorField)}
      </div>
      <div className={colorGroupClassName}>
        <div>
          <h4 className={colorGroupTitleClassName}>Dark Theme Colors</h4>
          <p className={colorGroupDescriptionClassName}>Used when storefront theme mode is Dark, or System while the customer prefers dark mode.</p>
        </div>
        {darkColorFields.map(renderColorField)}
      </div>
      <div className={colorGroupClassName}>
        <div>
          <h4 className={colorGroupTitleClassName}>App & Checkout Colors</h4>
          <p className={colorGroupDescriptionClassName}>Shared mobile app and checkout state colors.</p>
        </div>
        {appColorFields.map(renderColorField)}
      </div>
    </div>
  );
}
