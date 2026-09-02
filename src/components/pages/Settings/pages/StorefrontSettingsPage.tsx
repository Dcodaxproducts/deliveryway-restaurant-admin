"use client";

import { useCallback, useEffect } from "react";
import type { FieldPath } from "react-hook-form";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { BadgeCheck, Clock3, Globe2, LockKeyhole } from "lucide-react";

import Container from "@/components/common/Container";
import Header from "@/components/common/PageHeader";
import RestaurantPicker from "@/components/common/RestaurantPicker";
import BrandAssetsSection from "@/components/pages/Settings/theme/components/theme-settings/brand-assets-section";
import {
  BRANDING_DESTRUCTIVE_BUTTON_CLASS,
  BRANDING_ERROR_CLASS,
  BRANDING_INPUT_CLASS,
  BRANDING_LABEL_CLASS,
  BRANDING_PANEL_CLASS,
  BRANDING_PRIMARY_BUTTON_CLASS,
  BRANDING_SECONDARY_BUTTON_CLASS,
  BRANDING_SECTION_TITLE_CLASS,
} from "@/components/pages/Settings/theme/components/theme-settings/branding-form-classes";
import ColorSchemeSection from "@/components/pages/Settings/theme/components/theme-settings/color-scheme-section";
import PreviewSection from "@/components/pages/Settings/theme/components/theme-settings/preview-section";
import TypographySection from "@/components/pages/Settings/theme/components/theme-settings/typography-section";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useBranding } from "@/hooks/useBranding";
import { buildGeneratedStorefrontUrl } from "@/lib/branding";
import { API_BASE_URL } from "@/lib/constants";
import { getApiErrorMessage } from "@/lib/errors";
import {
  type BrandingFormValues,
  restaurantBrandingPayloadSchema,
} from "@/validations/branding";
import { useTranslations } from "next-intl";

type TextFieldConfig = {
  id: string;
  labelKey: string;
  name: FieldPath<BrandingFormValues>;
  placeholderKey: string;
  inputMode?: "email" | "text" | "url" | "tel";
};

type TextAreaFieldConfig = {
  id: string;
  labelKey: string;
  name: FieldPath<BrandingFormValues>;
  placeholderKey: string;
};

const textareaClassName =
  "min-h-[112px] rounded-[12px] border-gray-200 focus:ring-primary";

const profileFields: TextFieldConfig[] = [
  {
    id: "restaurant-name",
    labelKey: "restaurantName",
    name: "restaurant.name",
    placeholderKey: "restaurantNamePlaceholder",
  },
  {
    id: "restaurant-tagline",
    labelKey: "tagline",
    name: "restaurant.tagline",
    placeholderKey: "taglinePlaceholder",
  },
];

const profileTextAreas: TextAreaFieldConfig[] = [
  {
    id: "restaurant-bio",
    labelKey: "restaurantBio",
    name: "restaurant.bio",
    placeholderKey: "restaurantBioPlaceholder",
  },
];

const supportFields: TextFieldConfig[] = [
  {
    id: "support-email",
    labelKey: "supportEmail",
    name: "restaurant.supportContact.email",
    placeholderKey: "supportEmailPlaceholder",
    inputMode: "email",
  },
  {
    id: "support-phone",
    labelKey: "supportPhone",
    name: "restaurant.supportContact.phone",
    placeholderKey: "supportPhonePlaceholder",
    inputMode: "tel",
  },
  {
    id: "support-whatsapp",
    labelKey: "whatsapp",
    name: "restaurant.supportContact.whatsapp",
    placeholderKey: "supportPhonePlaceholder",
    inputMode: "tel",
  },
];

const socialFields: TextFieldConfig[] = [
  {
    id: "website-url",
    labelKey: "website",
    name: "restaurant.socialMedia.website",
    placeholderKey: "websitePlaceholder",
    inputMode: "url",
  },
  {
    id: "facebook-url",
    labelKey: "facebook",
    name: "restaurant.socialMedia.facebook",
    placeholderKey: "facebookPlaceholder",
    inputMode: "url",
  },
  {
    id: "instagram-url",
    labelKey: "instagram",
    name: "restaurant.socialMedia.instagram",
    placeholderKey: "instagramPlaceholder",
    inputMode: "url",
  },
  {
    id: "x-url",
    labelKey: "xSocial",
    name: "restaurant.socialMedia.x",
    placeholderKey: "xSocialPlaceholder",
    inputMode: "url",
  },
  {
    id: "tiktok-url",
    labelKey: "tiktok",
    name: "restaurant.socialMedia.tiktok",
    placeholderKey: "tiktokPlaceholder",
    inputMode: "url",
  },
];

export function StorefrontSettingsPage() {
  const common = useTranslations("common");
  const t = useTranslations("settings");
  const {
    savedBranding,
    updateBrandingDraft,
    saveBranding,
    resetBranding,
    isBrandingReady,
    isBrandingLoading,
    isBrandingSaving,
    brandingError,
  } = useBranding();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    getFieldState,
    formState,
  } = useForm<BrandingFormValues>({
    resolver: zodResolver(restaurantBrandingPayloadSchema),
    defaultValues: savedBranding,
    mode: "onBlur",
  });

  const watchedValues = useWatch({ control }) as BrandingFormValues;
  const hasUnsavedChanges = formState.isDirty;
  const generatedStorefrontUrl = buildGeneratedStorefrontUrl(
    savedBranding.restaurant.subdomain,
    API_BASE_URL,
  );
  const customDomain = savedBranding.restaurant.customDomain?.trim() ?? "";
  const customStorefrontUrl = customDomain
    ? `https://${customDomain.replace(/^https?:\/\//, "")}`
    : "";
  const customDomainVerified = Boolean(
    customDomain && savedBranding.restaurant.customDomainVerifiedAt,
  );
  const activeStorefrontUrl = customDomainVerified
    ? customStorefrontUrl
    : generatedStorefrontUrl;

  useEffect(() => {
    reset(savedBranding);
  }, [reset, savedBranding]);

  const getError = useCallback(
    (name: FieldPath<BrandingFormValues>) =>
      getFieldState(name, formState).error?.message,
    [formState, getFieldState],
  );
  const isBrandingBusy = isBrandingLoading || isBrandingSaving;
  const onSubmit = async (values: BrandingFormValues) => {
    try {
      await saveBranding(values);
      toast.success(t("brandingSaved"));
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("brandingSaveFailed")));
    }
  };

  const handleApplyPreview = () => {
    updateBrandingDraft(watchedValues);
    toast.success(t("previewApplied"));
  };

  const handleDiscardChanges = () => {
    reset(savedBranding);
    updateBrandingDraft(savedBranding);
    toast.success(t("brandingChangesDiscarded"));
  };

  const handleResetBranding = async () => {
    try {
      await resetBranding();
      toast.success(t("brandingReset"));
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("brandingResetFailed")));
    }
  };

  const renderTextField = ({
    id,
    labelKey,
    name,
    placeholderKey,
    inputMode = "text",
  }: TextFieldConfig) => (
    <div key={name}>
      <label htmlFor={id} className={BRANDING_LABEL_CLASS}>
        {t(labelKey)}
      </label>
      <Input
        id={id}
        type={
          inputMode === "email"
            ? "email"
            : inputMode === "url"
              ? "url"
              : inputMode === "tel"
                ? "tel"
                : "text"
        }
        placeholder={t(placeholderKey)}
        aria-invalid={Boolean(getError(name))}
        className={BRANDING_INPUT_CLASS}
        {...register(name)}
      />
      {getError(name) ? (
        <p className={BRANDING_ERROR_CLASS}>{getError(name)}</p>
      ) : null}
    </div>
  );

  const renderTextAreaField = ({
    id,
    labelKey,
    name,
    placeholderKey,
  }: TextAreaFieldConfig) => (
    <div key={name} className="md:col-span-2">
      <label htmlFor={id} className={BRANDING_LABEL_CLASS}>
        {t(labelKey)}
      </label>
      <Textarea
        id={id}
        placeholder={t(placeholderKey)}
        aria-invalid={Boolean(getError(name))}
        className={textareaClassName}
        {...register(name)}
      />
      {getError(name) ? (
        <p className={BRANDING_ERROR_CLASS}>{getError(name)}</p>
      ) : null}
    </div>
  );

  return (
    <Container>
      <Header
        title={t("storefrontTitle")}
        description={t("storefrontDescription")}
      />
      <RestaurantPicker />
      {brandingError ? (
        <p className="rounded-[12px] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {brandingError}
        </p>
      ) : null}
      <form className="space-y-8" noValidate onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            className={BRANDING_SECONDARY_BUTTON_CLASS}
            disabled={!isBrandingReady || isBrandingBusy}
            onClick={handleApplyPreview}
          >
            {t("applyPreview")}
          </button>
          {hasUnsavedChanges ? (
            <button
              type="button"
              className={BRANDING_SECONDARY_BUTTON_CLASS}
              disabled={!isBrandingReady || isBrandingBusy}
              onClick={handleDiscardChanges}
            >
              {t("discardChanges")}
            </button>
          ) : null}
          <button
            type="button"
            className={BRANDING_DESTRUCTIVE_BUTTON_CLASS}
            disabled={!isBrandingReady || isBrandingBusy}
            onClick={handleResetBranding}
          >
            {common("reset")}
          </button>
          <button
            type="submit"
            className={BRANDING_PRIMARY_BUTTON_CLASS}
            disabled={!isBrandingReady || isBrandingBusy}
          >
            {isBrandingSaving ? common("saving") : t("saveBranding")}
          </button>
        </div>

        <div className={BRANDING_PANEL_CLASS}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-primary/10 p-2.5 text-primary">
                <Globe2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className={BRANDING_SECTION_TITLE_CLASS}>
                  {t("storefrontDomains")}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {t("customDomainManaged")}
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
              <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
              {t("displayOnly")}
            </span>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <StorefrontDomainItem
              label={t("customDomainDefaultStorefront")}
              value={generatedStorefrontUrl}
              href={generatedStorefrontUrl}
            />
            <StorefrontDomainItem
              label={t("customDomain")}
              value={customDomain || t("notConfigured")}
              href={customStorefrontUrl || undefined}
              status={
                customDomain
                  ? customDomainVerified
                    ? t("domainVerified")
                    : t("domainPending")
                  : undefined
              }
              verified={customDomainVerified}
            />
            <StorefrontDomainItem
              label={t("customDomainActiveStorefront")}
              value={activeStorefrontUrl}
              href={activeStorefrontUrl}
              activeLabel={t("active")}
            />
          </div>
        </div>

        <div className={BRANDING_PANEL_CLASS}>
          <h3 className={BRANDING_SECTION_TITLE_CLASS}>
            {t("homepageSections")}
          </h3>
          <div className="mt-6 flex items-center justify-between gap-6 rounded-[14px] border border-gray-200 bg-gray-50/70 p-4">
            <div>
              <label
                htmlFor="show-app-promotion"
                className="text-sm font-semibold text-gray-900"
              >
                {t("mobileAppPromotion")}
              </label>
              <p className="mt-1 text-sm text-gray-500">
                {t("mobileAppPromotionDescription")}
              </p>
            </div>
            <Controller
              control={control}
              name="restaurant.branding.app.showAppPromotion"
              render={({ field }) => (
                <Switch
                  id="show-app-promotion"
                  checked={field.value}
                  disabled={isBrandingBusy}
                  onCheckedChange={field.onChange}
                  className="data-[state=checked]:bg-primary"
                />
              )}
            />
          </div>
        </div>

        <div className={BRANDING_PANEL_CLASS}>
          <h3 className={BRANDING_SECTION_TITLE_CLASS}>
            {t("restaurantProfile")}
          </h3>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            {profileFields.map(renderTextField)}
            {profileTextAreas.map(renderTextAreaField)}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className={BRANDING_PANEL_CLASS}>
            <h3 className={BRANDING_SECTION_TITLE_CLASS}>
              {t("supportContact")}
            </h3>
            <div className="mt-6 space-y-6">
              {supportFields.map(renderTextField)}
            </div>
          </div>
          <div className={BRANDING_PANEL_CLASS}>
            <h3 className={BRANDING_SECTION_TITLE_CLASS}>{t("socialMedia")}</h3>
            <div className="mt-6 space-y-6">
              {socialFields.map(renderTextField)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <BrandAssetsSection
            register={register}
            setValue={setValue}
            values={watchedValues}
            getError={getError}
          />
          <ColorSchemeSection
            register={register}
            setValue={setValue}
            values={watchedValues}
            getError={getError}
          />
        </div>
        <TypographySection
          register={register}
          values={watchedValues}
          getError={getError}
        />
        <PreviewSection values={watchedValues} />
      </form>
    </Container>
  );
}

function StorefrontDomainItem({
  label,
  value,
  href,
  status,
  verified = false,
  activeLabel,
}: {
  label: string;
  value: string;
  href?: string;
  status?: string;
  verified?: boolean;
  activeLabel?: string;
}) {
  return (
    <div className="rounded-[14px] border border-gray-200 bg-gray-50/70 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {label}
        </p>
        {activeLabel ? (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
            {activeLabel}
          </span>
        ) : null}
      </div>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="mt-2 block break-all text-sm font-semibold text-gray-900 underline decoration-gray-300 underline-offset-4 hover:text-primary"
        >
          {value}
        </a>
      ) : (
        <p className="mt-2 break-all text-sm font-semibold text-gray-700">
          {value}
        </p>
      )}
      {status ? (
        <p
          className={`mt-2 flex items-center gap-1.5 text-xs ${
            verified ? "text-emerald-700" : "text-amber-700"
          }`}
        >
          {verified ? (
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {status}
        </p>
      ) : null}
    </div>
  );
}
