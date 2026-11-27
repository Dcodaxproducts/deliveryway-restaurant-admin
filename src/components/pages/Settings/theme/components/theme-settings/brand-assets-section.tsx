import type { FieldPath, UseFormRegister, UseFormSetValue } from "react-hook-form";
import { Image as ImageIcon } from "lucide-react";
import { useTranslations } from "next-intl";

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
  restaurantFavicon?: boolean;
};

const defaultBranding = DEFAULT_RESTAURANT_BRANDING_PAYLOAD.restaurant.branding;

const getLinkedNames = (
  primaryValue: string,
  linkedFields: Array<{ name: FieldPath<BrandingFormValues>; value: string; defaultValue: string }>,
): FieldPath<BrandingFormValues>[] =>
  linkedFields.flatMap(({ name, value, defaultValue }) => (!value || value === defaultValue || value === primaryValue ? [name] : []));

export default function BrandAssetsSection({ register, setValue, values, getError }: BrandAssetsSectionProps) {
  const t = useTranslations("settings");
  const { restaurant } = values;
  const { branding } = restaurant;

  const assetFields: AssetFieldConfig[] = [
    {
      id: "restaurant-logo-url",
      title: t("assets.restaurantLogo"),
      recommendation: t("assets.restaurantLogoRecommendation"),
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
      title: t("assets.coverImage"),
      recommendation: t("assets.coverImageRecommendation"),
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
      title: t("assets.lightLogo"),
      recommendation: t("assets.lightLogoRecommendation"),
      name: "restaurant.branding.logo.light",
      value: branding.logo.light,
    },
    {
      id: "branding-logo-dark",
      title: t("assets.darkLogo"),
      recommendation: t("assets.darkLogoRecommendation"),
      name: "restaurant.branding.logo.dark",
      value: branding.logo.dark,
    },
    {
      id: "branding-favicon",
      title: t("assets.favicon"),
      recommendation: t("assets.faviconRecommendation"),
      name: "restaurant.branding.assets.faviconUrl",
      linkedNames: ["restaurant.branding.assets.logos.faviconUrl"],
      value: branding.assets.faviconUrl,
      restaurantFavicon: true,
    },
    {
      id: "branding-placeholder-image",
      title: t("assets.placeholderImage"),
      recommendation: t("assets.placeholderImageRecommendation"),
      name: "restaurant.branding.assets.placeholderImage",
      value: branding.assets.placeholderImage,
    },
  ];

  return (
    <div className={BRANDING_PANEL_SPACED_CLASS}>
      <div className="flex items-center gap-3">
        <ImageIcon className="text-gray-500" />
        <h3 className={BRANDING_SECTION_TITLE_CLASS}>{t("brandAssets")}</h3>
      </div>
      {assetFields.map(({ id, title, recommendation, name, linkedNames, value, restaurantFavicon }) => (
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
          restaurantId={restaurant.id}
          restaurantFavicon={restaurantFavicon}
        />
      ))}
    </div>
  );
}
