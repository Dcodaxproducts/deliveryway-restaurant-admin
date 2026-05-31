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

type TextFieldConfig = {
  id: string;
  label: string;
  name: FieldPath<BrandingFormValues>;
  placeholder: string;
  inputMode?: "email" | "text" | "url" | "tel";
};

type TextAreaFieldConfig = {
  id: string;
  label: string;
  name: FieldPath<BrandingFormValues>;
  placeholder: string;
};

const textareaClassName = "min-h-[112px] rounded-[12px] border-gray-200 focus:ring-primary";

const profileFields: TextFieldConfig[] = [
  {
    id: "restaurant-name",
    label: "Restaurant Name",
    name: "restaurant.name",
    placeholder: "Deliveryway Restaurant",
  },
  {
    id: "restaurant-slug",
    label: "Restaurant Slug",
    name: "restaurant.slug",
    placeholder: "deliveryway-restaurant",
  },
  {
    id: "restaurant-tagline",
    label: "Tagline",
    name: "restaurant.tagline",
    placeholder: "Fast, reliable restaurant delivery",
  },
  {
    id: "restaurant-custom-domain",
    label: "Custom Domain",
    name: "restaurant.customDomain",
    placeholder: "restaurant.example.com",
  },
];

const profileTextAreas: TextAreaFieldConfig[] = [
  {
    id: "restaurant-bio",
    label: "Restaurant Bio",
    name: "restaurant.bio",
    placeholder: "Describe the restaurant experience for customers.",
  },
];

const supportFields: TextFieldConfig[] = [
  {
    id: "support-email",
    label: "Support Email",
    name: "restaurant.supportContact.email",
    placeholder: "support@example.com",
    inputMode: "email",
  },
  {
    id: "support-phone",
    label: "Support Phone",
    name: "restaurant.supportContact.phone",
    placeholder: "+1 555 0100",
    inputMode: "tel",
  },
  {
    id: "support-whatsapp",
    label: "WhatsApp",
    name: "restaurant.supportContact.whatsapp",
    placeholder: "+1 555 0100",
    inputMode: "tel",
  },
];

const socialFields: TextFieldConfig[] = [
  {
    id: "facebook-url",
    label: "Facebook",
    name: "restaurant.socialMedia.facebook",
    placeholder: "https://facebook.com/restaurant",
    inputMode: "url",
  },
  {
    id: "instagram-url",
    label: "Instagram",
    name: "restaurant.socialMedia.instagram",
    placeholder: "https://instagram.com/restaurant",
    inputMode: "url",
  },
  {
    id: "tiktok-url",
    label: "TikTok",
    name: "restaurant.socialMedia.tiktok",
    placeholder: "https://tiktok.com/@restaurant",
    inputMode: "url",
  },
];

export default function StorefrontSettingsPage() {
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
    (name: FieldPath<BrandingFormValues>) => getFieldState(name, formState).error?.message,
    [formState, getFieldState]
  );
  const isBrandingBusy = isBrandingLoading || isBrandingSaving;

  const onSubmit = async (values: BrandingFormValues) => {
    try {
      await saveBranding(values);
      toast.success("Branding settings saved.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to save branding settings."));
    }
  };

  const handleApplyPreview = () => {
    updateBrandingDraft(watchedValues);
    toast.success("Preview applied. Save to keep these branding changes.");
  };

  const handleDiscardChanges = () => {
    reset(savedBranding);
    updateBrandingDraft(savedBranding);
    toast.success("Unsaved branding changes discarded.");
  };

  const handleResetBranding = async () => {
    try {
      await resetBranding();
      toast.success("Branding settings reset to defaults.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to reset branding settings."));
    }
  };

  const renderTextField = ({ id, label, name, placeholder, inputMode = "text" }: TextFieldConfig) => (
    <div key={name}>
      <label htmlFor={id} className={BRANDING_LABEL_CLASS}>
        {label}
      </label>
      <Input
        id={id}
        type={inputMode === "email" ? "email" : inputMode === "url" ? "url" : inputMode === "tel" ? "tel" : "text"}
        placeholder={placeholder}
        aria-invalid={Boolean(getError(name))}
        className={BRANDING_INPUT_CLASS}
        {...register(name)}
      />
      {getError(name) ? <p className={BRANDING_ERROR_CLASS}>{getError(name)}</p> : null}
    </div>
  );

  const renderTextAreaField = ({ id, label, name, placeholder }: TextAreaFieldConfig) => (
    <div key={name} className="md:col-span-2">
      <label htmlFor={id} className={BRANDING_LABEL_CLASS}>
        {label}
      </label>
      <Textarea
        id={id}
        placeholder={placeholder}
        aria-invalid={Boolean(getError(name))}
        className={textareaClassName}
        {...register(name)}
      />
      {getError(name) ? <p className={BRANDING_ERROR_CLASS}>{getError(name)}</p> : null}
    </div>
  );

  return (
    <Container>
      <Header
        title="Storefront Settings"
        description="Manage restaurant profile, branding, assets, support contact, and customer-facing appearance."
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
            Apply preview
          </button>
          {hasUnsavedChanges ? (
            <button
              type="button"
              className={BRANDING_SECONDARY_BUTTON_CLASS}
              disabled={!isBrandingReady || isBrandingBusy}
              onClick={handleDiscardChanges}
            >
              Discard changes
            </button>
          ) : null}
          <button
            type="button"
            className={BRANDING_DESTRUCTIVE_BUTTON_CLASS}
            disabled={!isBrandingReady || isBrandingBusy}
            onClick={handleResetBranding}
          >
            Reset
          </button>
          <button type="submit" className={BRANDING_PRIMARY_BUTTON_CLASS} disabled={!isBrandingReady || isBrandingBusy}>
            {isBrandingSaving ? "Saving..." : "Save branding"}
          </button>
        </div>

        <div className={BRANDING_PANEL_CLASS}>
          <h3 className={BRANDING_SECTION_TITLE_CLASS}>Restaurant Profile</h3>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            {profileFields.map(renderTextField)}
            {profileTextAreas.map(renderTextAreaField)}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className={BRANDING_PANEL_CLASS}>
            <h3 className={BRANDING_SECTION_TITLE_CLASS}>Support Contact</h3>
            <div className="mt-6 space-y-6">{supportFields.map(renderTextField)}</div>
          </div>
          <div className={BRANDING_PANEL_CLASS}>
            <h3 className={BRANDING_SECTION_TITLE_CLASS}>Social Media</h3>
            <div className="mt-6 space-y-6">{socialFields.map(renderTextField)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <BrandAssetsSection register={register} setValue={setValue} values={watchedValues} getError={getError} />
          <ColorSchemeSection register={register} setValue={setValue} values={watchedValues} getError={getError} />
        </div>
        <TypographySection register={register} values={watchedValues} getError={getError} />
        <PreviewSection values={watchedValues} />
      </form>
    </Container>
  );
}
