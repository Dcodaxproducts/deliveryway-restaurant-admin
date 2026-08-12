"use client";

import { useCallback, useEffect } from "react";
import type { FieldPath } from "react-hook-form";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

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
import { Textarea } from "@/components/ui/textarea";
import { useBranding } from "@/hooks/useBranding";
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
      toast.error(
        getApiErrorMessage(error, t("brandingSaveFailed")),
      );
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
      toast.error(
        getApiErrorMessage(error, t("brandingResetFailed")),
      );
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
