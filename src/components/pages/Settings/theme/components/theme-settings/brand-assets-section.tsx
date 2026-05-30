import type { FieldPath, UseFormRegister } from "react-hook-form";
import { Image as ImageIcon } from "lucide-react";

import type { BrandingFormValues } from "@/validations/branding";

import FileUploader from "./file-uploader";

type BrandAssetsSectionProps = {
  register: UseFormRegister<BrandingFormValues>;
  values: BrandingFormValues;
  getError: (name: FieldPath<BrandingFormValues>) => string | undefined;
};

type AssetFieldConfig = {
  id: string;
  title: string;
  recommendation: string;
  name: FieldPath<BrandingFormValues>;
  value: string;
};

const panelClassName = "bg-white p-4 lg:p-6 rounded-lg shadow-sm space-y-6";
const sectionTitleClassName = "text-[20px] font-semibold text-dark";

export default function BrandAssetsSection({ register, values, getError }: BrandAssetsSectionProps) {
  const { restaurant } = values;
  const { branding } = restaurant;

  const assetFields: AssetFieldConfig[] = [
    {
      id: "restaurant-logo-url",
      title: "Restaurant Logo",
      recommendation: "Primary restaurant logo used in storefront previews and headers.",
      name: "restaurant.logoUrl",
      value: restaurant.logoUrl,
    },
    {
      id: "restaurant-cover-image",
      title: "Cover Image",
      recommendation: "Recommended: wide JPG or PNG used as the restaurant hero image.",
      name: "restaurant.coverImage",
      value: restaurant.coverImage,
    },
    {
      id: "branding-logo-light",
      title: "Light Logo",
      recommendation: "Logo URL/path for light backgrounds.",
      name: "restaurant.branding.logo.light",
      value: branding.logo.light,
    },
    {
      id: "branding-logo-dark",
      title: "Dark Logo",
      recommendation: "Logo URL/path for dark backgrounds.",
      name: "restaurant.branding.logo.dark",
      value: branding.logo.dark,
    },
    {
      id: "branding-favicon",
      title: "Favicon",
      recommendation: "Recommended: 32x32px or 64x64px PNG/ICO path.",
      name: "restaurant.branding.assets.faviconUrl",
      value: branding.assets.faviconUrl,
    },
    {
      id: "branding-placeholder-image",
      title: "Placeholder Image",
      recommendation: "Fallback image for menu items and empty media states.",
      name: "restaurant.branding.assets.placeholderImage",
      value: branding.assets.placeholderImage,
    },
  ];

  return (
    <div className={panelClassName}>
      <div className="flex items-center gap-3">
        <ImageIcon className="text-gray-500" />
        <h3 className={sectionTitleClassName}>Brand Assets</h3>
      </div>
      {assetFields.map(({ id, title, recommendation, name, value }) => (
        <FileUploader
          key={name}
          id={id}
          title={title}
          recommendation={recommendation}
          name={name}
          value={value}
          register={register}
          error={getError(name)}
        />
      ))}
    </div>
  );
}
