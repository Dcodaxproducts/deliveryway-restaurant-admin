import type { FieldPath, UseFormRegister, UseFormSetValue } from "react-hook-form";
import { Image as ImageIcon } from "lucide-react";

import { DEFAULT_RESTAURANT_BRANDING_PAYLOAD } from "@/config/default-branding";
import type { BrandingFormValues } from "@/validations/branding";

import { BRANDING_PANEL_SPACED_CLASS, BRANDING_SECTION_TITLE_CLASS } from "./branding-form-classes";
import FileUploader from "./file-uploader";

type BrandAssetsSectionProps = {
  register: UseFormRegister<BrandingFormValues>;
  setValue: UseFormSetValue<BrandingFormValues>;
  values: BrandingFormValues;
  getError: (name: FieldPath<BrandingFormValues>) => string | undefined;
};

type AssetFieldConfig = {
  id: string;
  title: string;
  recommendation: string;
  name: FieldPath<BrandingFormValues>;
  linkedNames?: FieldPath<BrandingFormValues>[];
  value: string;
};

const defaultBranding = DEFAULT_RESTAURANT_BRANDING_PAYLOAD.restaurant.branding;

const getLinkedNames = (
  primaryValue: string,
  linkedFields: Array<{ name: FieldPath<BrandingFormValues>; value: string; defaultValue: string }>,
): FieldPath<BrandingFormValues>[] =>
  linkedFields.flatMap(({ name, value, defaultValue }) => (!value || value === defaultValue || value === primaryValue ? [name] : []));

export default function BrandAssetsSection({ register, setValue, values, getError }: BrandAssetsSectionProps) {
  const { restaurant } = values;
  const { branding } = restaurant;

  const assetFields: AssetFieldConfig[] = [
    {
      id: "restaurant-logo-url",
      title: "Restaurant Logo",
      recommendation: "Primary restaurant logo used in storefront previews and headers.",
      name: "restaurant.logoUrl",
      linkedNames: getLinkedNames(restaurant.logoUrl, [
        {
          name: "restaurant.branding.assets.logoUrl",
          value: branding.assets.logoUrl,
          defaultValue: defaultBranding.assets.logoUrl,
        },
        {
          name: "restaurant.branding.logo.light",
          value: branding.logo.light,
          defaultValue: defaultBranding.logo.light,
        },
      ]),
      value: restaurant.logoUrl,
    },
    {
      id: "restaurant-cover-image",
      title: "Cover Image",
      recommendation: "Recommended: wide JPG or PNG used as the restaurant hero image.",
      name: "restaurant.coverImage",
      linkedNames: getLinkedNames(restaurant.coverImage, [
        {
          name: "restaurant.branding.assets.coverImage",
          value: branding.assets.coverImage,
          defaultValue: defaultBranding.assets.coverImage,
        },
        {
          name: "restaurant.branding.assets.heroBannerUrl",
          value: branding.assets.heroBannerUrl,
          defaultValue: defaultBranding.assets.heroBannerUrl,
        },
      ]),
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
      linkedNames: ["restaurant.branding.assets.logos.faviconUrl"],
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
    <div className={BRANDING_PANEL_SPACED_CLASS}>
      <div className="flex items-center gap-3">
        <ImageIcon className="text-gray-500" />
        <h3 className={BRANDING_SECTION_TITLE_CLASS}>Brand Assets</h3>
      </div>
      {assetFields.map(({ id, title, recommendation, name, linkedNames, value }) => (
        <FileUploader
          key={name}
          id={id}
          title={title}
          recommendation={recommendation}
          name={name}
          linkedNames={linkedNames}
          value={value}
          register={register}
          setValue={setValue}
          error={getError(name)}
        />
      ))}
    </div>
  );
}
