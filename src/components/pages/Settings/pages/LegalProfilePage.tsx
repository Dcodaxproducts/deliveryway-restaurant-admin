"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Building2,
  FileText,
  Loader2,
  MapPin,
  ReceiptText,
  RefreshCw,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import PageLayout from "@/components/common/Container";
import PromotionStatCard from "@/components/cards/PromotionStatCard";
import { StatePanel } from "@/components/common/EmptyState";
import PageHeader from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichPolicyEditor } from "@/components/pages/Settings/forms/PrivacyPolicyForm";
import { useAuth } from "@/hooks/useAuth";
import {
  useLegalProfile,
  useUpdateLegalProfile,
} from "@/hooks/useLegalProfile";
import {
  createEmptyLegalProfile,
  type LegalProfile,
  type LegalProfilePayload,
} from "@/services/legal-profile";
import { getDisplayName } from "@/lib/auth";
import { cn } from "@/lib/utils";

const toPayload = (profile: LegalProfile): LegalProfilePayload => ({
  legalBusinessName: profile.legalBusinessName.trim(),
  taxNumber: profile.taxNumber.trim(),
  businessAddress: {
    street: profile.businessAddress.street.trim(),
    shopNumber: profile.businessAddress.shopNumber.trim() || null,
    state: profile.businessAddress.state.trim(),
    city: profile.businessAddress.city.trim(),
    country: profile.businessAddress.country.trim(),
  },
  contractText: profile.contractText.trim(),
});

const formatAddressPreview = (profile: LegalProfile) =>
  [
    profile.businessAddress.street,
    profile.businessAddress.shopNumber,
    profile.businessAddress.state,
    profile.businessAddress.city,
    profile.businessAddress.country,
  ]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");

export function LegalProfilePage() {
  const t = useTranslations("legalProfile");
  const commonT = useTranslations("common");
  const { user, restaurantId, isBranchAdmin, loading: authLoading } = useAuth();
  const [draftProfile, setDraftProfile] = useState<LegalProfile>(
    createEmptyLegalProfile(),
  );
  const [loadedRestaurantId, setLoadedRestaurantId] = useState<string>();

  const {
    data: savedProfile,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useLegalProfile(restaurantId);
  const { mutateAsync: saveLegalProfile, isPending: isSaving } =
    useUpdateLegalProfile();

  const loading = authLoading || isLoading;
  const canEdit = Boolean(restaurantId) && !isBranchAdmin;
  const savedPayload = useMemo(
    () => toPayload(savedProfile ?? createEmptyLegalProfile(restaurantId)),
    [restaurantId, savedProfile],
  );
  const draftPayload = useMemo(() => toPayload(draftProfile), [draftProfile]);
  const isDirty = JSON.stringify(draftPayload) !== JSON.stringify(savedPayload);
  const addressPreview = formatAddressPreview(draftProfile);
  const ownerName = user ? getDisplayName(user) : "-";
  const completionItems = [
    Boolean(draftPayload.legalBusinessName),
    Boolean(draftPayload.taxNumber),
    Boolean(addressPreview),
    Boolean(draftPayload.contractText),
  ];
  const completionCount = completionItems.filter(Boolean).length;

  useEffect(() => {
    if (!restaurantId || loadedRestaurantId === restaurantId || isLoading) return;

    setDraftProfile(savedProfile ?? createEmptyLegalProfile(restaurantId));
    setLoadedRestaurantId(restaurantId);
  }, [isLoading, loadedRestaurantId, restaurantId, savedProfile]);

  const updateField = (key: keyof LegalProfilePayload, value: string) => {
    setDraftProfile((profile) => ({ ...profile, [key]: value }));
  };

  const updateAddressField = (
    key: keyof LegalProfilePayload["businessAddress"],
    value: string,
  ) => {
    setDraftProfile((profile) => ({
      ...profile,
      businessAddress: {
        ...profile.businessAddress,
        [key]: value,
      },
    }));
  };

  const handleReset = () => {
    setDraftProfile(savedProfile ?? createEmptyLegalProfile(restaurantId));
  };

  const handleSave = async () => {
    if (!restaurantId) {
      toast.error(t("missingRestaurant"));
      return;
    }

    if (!canEdit) {
      toast.error(t("readOnlyToast"));
      return;
    }

    const nextProfile = await saveLegalProfile({
      restaurantId,
      payload: draftPayload,
    });
    setDraftProfile(nextProfile);
    setLoadedRestaurantId(restaurantId);
  };

  return (
    <PageLayout
      actions={
        canEdit ? (
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={loading || isSaving || !isDirty}
            >
              {commonT("reset")}
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={loading || isSaving || !canEdit || !isDirty}
            >
              {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
              {isSaving ? commonT("saving") : commonT("save")}
            </Button>
          </div>
        ) : null
      }
    >
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={() => void refetch()}
            disabled={loading || isFetching}
          >
            {isFetching ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            {commonT("refresh")}
          </Button>
        }
      />

      {!restaurantId && !authLoading ? (
        <StatePanel
          state="unavailable"
          title={t("missingRestaurant")}
          description={commonT("selectRestaurantToContinue")}
        />
      ) : isError && !savedProfile ? (
        <StatePanel
          state="error"
          title={commonT("unableToLoad")}
          description={t("description")}
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => void refetch()}
            >
              {commonT("refresh")}
            </Button>
          }
        />
      ) : loading && !savedProfile ? (
        <StatePanel
          state="loading"
          title={t("title")}
          description={t("description")}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <PromotionStatCard
              icon={<ShieldCheck aria-hidden="true" className="size-4" />}
              value={isDirty ? t("unsaved") : t("synced")}
              label={t("status")}
            />
            <PromotionStatCard
              icon={<ReceiptText aria-hidden="true" className="size-4" />}
              value={t("completionCount", { count: completionCount })}
              label={t("profileCoverage")}
            />
            <PromotionStatCard
              icon={<FileText aria-hidden="true" className="size-4" />}
              value={t("privacyContent")}
              label={t("publicReflection")}
            />
          </div>

          {!canEdit ? (
            <div className="rounded-[var(--ui-radius-card)] border border-[var(--ui-warning)]/20 bg-[var(--ui-warning-soft)] px-4 py-3 text-sm font-medium text-[var(--ui-warning)]">
              {t("branchReadOnlyNotice")}
            </div>
          ) : null}

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
            <SectionCard padding="md" className="space-y-4">
              <SectionHeader
                icon={Building2}
                title={t("businessSectionTitle")}
                description={t("businessSectionDescription")}
              />

              <div className="rounded-[var(--ui-radius-card)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] p-3.5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-[var(--ui-radius-control)] bg-[var(--ui-brand-soft)] text-primary">
                      <UserRound className="size-5" />
                    </span>
                    <div>
                      <p className="text-xs font-medium text-[var(--ui-text-subtle)]">
                        {t("ownerName")}
                      </p>
                      <p className="mt-1 text-base font-semibold text-[var(--ui-text)]">
                        {ownerName}
                      </p>
                    </div>
                  </div>
                  <span className="w-fit rounded-[var(--ui-radius-control)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-1 text-xs font-medium text-[var(--ui-text-muted)]">
                    {t("authProfileOwner")}
                  </span>
                </div>
              </div>

              <div className="grid gap-3.5 md:grid-cols-2">
                <Field
                  id="legal-business-name"
                  label={t("legalBusinessName")}
                  value={draftProfile.legalBusinessName}
                  placeholder={t("legalBusinessNamePlaceholder")}
                  disabled={!canEdit || loading}
                  onChange={(value) => updateField("legalBusinessName", value)}
                />
                <Field
                  id="tax-number"
                  label={t("taxNumber")}
                  value={draftProfile.taxNumber}
                  placeholder={t("taxNumberPlaceholder")}
                  disabled={!canEdit || loading}
                  onChange={(value) => updateField("taxNumber", value)}
                />
              </div>

              <div className="rounded-[var(--ui-radius-card)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] p-3.5">
                <SectionHeader
                  icon={MapPin}
                  title={t("addressSectionTitle")}
                  description={t("addressSectionDescription")}
                  compact
                />
                <div className="mt-3.5 grid gap-3.5 md:grid-cols-2">
                  <Field
                    id="business-street"
                    label={t("street")}
                    value={draftProfile.businessAddress.street}
                    placeholder={t("streetPlaceholder")}
                    disabled={!canEdit || loading}
                    onChange={(value) => updateAddressField("street", value)}
                  />
                  <Field
                    id="business-shop-number"
                    label={t("shopNumber")}
                    value={draftProfile.businessAddress.shopNumber}
                    placeholder={t("shopNumberPlaceholder")}
                    disabled={!canEdit || loading}
                    onChange={(value) =>
                      updateAddressField("shopNumber", value)
                    }
                  />
                  <Field
                    id="business-state"
                    label={t("state")}
                    value={draftProfile.businessAddress.state}
                    placeholder={t("statePlaceholder")}
                    disabled={!canEdit || loading}
                    onChange={(value) => updateAddressField("state", value)}
                  />
                  <Field
                    id="business-city"
                    label={t("city")}
                    value={draftProfile.businessAddress.city}
                    placeholder={t("cityPlaceholder")}
                    disabled={!canEdit || loading}
                    onChange={(value) => updateAddressField("city", value)}
                  />
                  <Field
                    id="business-country"
                    label={t("country")}
                    value={draftProfile.businessAddress.country}
                    placeholder={t("countryPlaceholder")}
                    disabled={!canEdit || loading}
                    onChange={(value) => updateAddressField("country", value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="contract-text-editor"
                  className="text-sm font-medium text-[var(--ui-text)]"
                >
                  {t("contractText")}
                </Label>
                <RichPolicyEditor
                  id="contract-text-editor"
                  value={draftProfile.contractText}
                  placeholder={t("contractTextPlaceholder")}
                  disabled={!canEdit || loading}
                  onChange={(value) => updateField("contractText", value)}
                  compact
                />
              </div>
            </SectionCard>

            <aside className="space-y-4">
              <SectionCard padding="md">
                <p className="text-xs font-medium text-[var(--ui-text-subtle)]">
                  {t("customerPreview")}
                </p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--ui-text)]">
                  {draftProfile.legalBusinessName || t("emptyBusinessName")}
                </h2>
                <div className="mt-4 space-y-3 text-sm">
                  <PreviewRow label={t("ownerName")} value={ownerName} />
                  <PreviewRow
                    label={t("taxNumber")}
                    value={draftProfile.taxNumber || "-"}
                  />
                  <PreviewRow
                    label={t("address")}
                    value={addressPreview || "-"}
                  />
                </div>
                <div className="mt-5 rounded-[var(--ui-radius-card)] bg-[var(--ui-surface-subtle)] p-4">
                  <p className="text-xs font-medium text-[var(--ui-text-subtle)]">
                    {t("contractText")}
                  </p>
                  {draftProfile.contractText.trim() ? (
                    <div
                      className="mt-3 max-h-[360px] overflow-auto text-sm leading-6 text-[var(--ui-text-muted)] [&_a]:font-semibold [&_a]:text-primary [&_h1]:mb-3 [&_h1]:mt-5 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:leading-tight [&_h1]:text-[var(--ui-text)] [&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:leading-tight [&_h2]:text-[var(--ui-text)] [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-[var(--ui-text)] [&_li]:my-1 [&_ol]:my-3 [&_ol]:pl-5 [&_p]:mb-3 [&_strong]:text-[var(--ui-text)] [&_ul]:my-3 [&_ul]:pl-5"
                      dangerouslySetInnerHTML={{
                        __html: draftProfile.contractText,
                      }}
                    />
                  ) : (
                    <p className="mt-2 text-sm leading-6 text-[var(--ui-text-muted)]">
                      {t("emptyContract")}
                    </p>
                  )}
                </div>
              </SectionCard>
            </aside>
          </div>
        </>
      )}
    </PageLayout>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
  compact = false,
}: {
  icon: typeof ShieldCheck;
  title: string;
  description: string;
  compact?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--ui-radius-control)] bg-[var(--ui-brand-soft)] text-primary">
        <Icon className="size-5" />
      </span>
      <div>
        <h2
          className={cn(
            "font-semibold text-[var(--ui-text)]",
            compact ? "text-base" : "text-lg",
          )}
        >
          {title}
        </h2>
        <p className="mt-1 text-sm leading-6 text-[var(--ui-text-muted)]">
          {description}
        </p>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  placeholder,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-[var(--ui-text)]">
        {label}
      </Label>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-[var(--ui-radius-control)] border-[var(--ui-border-strong)] bg-[var(--ui-surface)] text-sm text-[var(--ui-text)] shadow-none focus-visible:ring-[var(--ui-focus-ring)]/20"
      />
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-[var(--ui-text-subtle)]">
        {label}
      </p>
      <p className="mt-1 break-words font-medium text-[var(--ui-text)]">
        {value}
      </p>
    </div>
  );
}
