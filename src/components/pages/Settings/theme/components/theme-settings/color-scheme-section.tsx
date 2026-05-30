import type { FieldPath, UseFormRegister, UseFormSetValue } from "react-hook-form";
import { Palette } from "lucide-react";

import type { BrandingFormValues } from "@/validations/branding";

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

const panelClassName = "bg-white p-4 lg:p-6 rounded-lg shadow-sm space-y-6";
const sectionTitleClassName = "text-[20px] font-semibold text-dark";

export default function ColorSchemeSection({ register, setValue, values, getError }: ColorSchemeSectionProps) {
  const { theme } = values.restaurant.branding;
  const { app, checkout } = values.restaurant.branding;

  const colorFields: ColorFieldConfig[] = [
    {
      id: "primary-color",
      label: "Primary Brand Color",
      description: "Main brand color used for buttons and active states.",
      name: "restaurant.branding.theme.primaryColor",
      value: theme.primaryColor,
    },
    {
      id: "secondary-color",
      label: "Secondary Color",
      description: "Used for dark surfaces and supporting accents.",
      name: "restaurant.branding.theme.secondaryColor",
      value: theme.secondaryColor,
    },
    {
      id: "accent-color",
      label: "Accent Color",
      description: "Highlights, badges, and promotional moments.",
      name: "restaurant.branding.theme.accentColor",
      value: theme.accentColor,
    },
    {
      id: "background-color",
      label: "Background Color",
      description: "Default storefront and app background.",
      name: "restaurant.branding.theme.backgroundColor",
      value: theme.backgroundColor,
    },
    {
      id: "text-color",
      label: "Text Color",
      description: "Primary readable text color.",
      name: "restaurant.branding.theme.textColor",
      value: theme.textColor,
    },
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

  return (
    <div className={panelClassName}>
      <div className="flex items-center gap-3">
        <Palette className="text-gray-500" />
        <h3 className={sectionTitleClassName}>Color Scheme</h3>
      </div>
      {colorFields.map(({ id, label, description, name, value }) => (
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
      ))}
    </div>
  );
}
