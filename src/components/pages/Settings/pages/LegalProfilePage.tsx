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

import Header from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
    city: profile.businessAddress.city.trim(),
    state: profile.businessAddress.state.trim(),
    country: profile.businessAddress.country.trim(),
  },
  contractText: profile.contractText.trim(),
});

const formatAddressPreview = (profile: LegalProfile) =>
  [
    profile.businessAddress.street,
    profile.businessAddress.shopNumber,
    profile.businessAddress.city,
    profile.businessAddress.state,
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
    createEmptyLegalProfile()
  );
  const [hasLoadedInitialProfile, setHasLoadedInitialProfile] = useState(false);

  const {
    data: savedProfile,
    isLoading,
    isFetching,
    refetch,
  } = useLegalProfile(restaurantId);
  const { mutateAsync: saveLegalProfile, isPending: isSaving } =
    useUpdateLegalProfile();

  const loading = authLoading || isLoading;
  const canEdit = Boolean(restaurantId) && !isBranchAdmin;
  const savedPayload = useMemo(
    () => toPayload(savedProfile ?? createEmptyLegalProfile(restaurantId)),
    [restaurantId, savedProfile]
  );
  const draftPayload = useMemo(() => toPayload(draftProfile), [draftProfile]);
  const isDirty =
    JSON.stringify(draftPayload) !== JSON.stringify(savedPayload);
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
    if (hasLoadedInitialProfile || isLoading) return;

    setDraftProfile(savedProfile ?? createEmptyLegalProfile(restaurantId));
    setHasLoadedInitialProfile(true);
  }, [hasLoadedInitialProfile, isLoading, restaurantId, savedProfile]);

  const updateField = (key: keyof LegalProfilePayload, value: string) => {
    setDraftProfile((profile) => ({ ...profile, [key]: value }));
  };

  const updateAddressField = (
    key: keyof LegalProfilePayload["businessAddress"],
    value: string
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
    setHasLoadedInitialProfile(true);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px] space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <Header
            title={t("title")}
            description={t("description")}
            titleClassName="text-[24px] sm:text-[30px] font-semibold text-[#101828] leading-tight"
            descriptionClassName="mt-1 max-w-3xl text-sm text-[#667085] leading-6"
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => refetch()}
              disabled={loading || isFetching}
              className="h-10 rounded-full border-[#D0D5DD] bg-white text-[#344054]"
            >
              {isFetching ? <Loader2 className="animate-spin" /> : <RefreshCw />}
              {commonT("refresh")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={loading || isSaving || !isDirty}
              className="h-10 rounded-full border-[#D0D5DD] bg-white text-[#344054]"
            >
              {commonT("reset")}
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={loading || isSaving || !canEdit || !isDirty}
              className="h-10 rounded-full bg-[#C1121F] px-5 text-white hover:bg-[#A30F1A]"
            >
              {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
              {isSaving ? commonT("saving") : commonT("save")}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard
            icon={ShieldCheck}
            eyebrow={t("status")}
            title={isDirty ? t("unsaved") : t("synced")}
            description={canEdit ? t("editable") : t("readOnly")}
            tone={isDirty ? "warning" : "success"}
          />
          <SummaryCard
            icon={ReceiptText}
            eyebrow={t("profileCoverage")}
            title={t("completionCount", { count: completionCount })}
            description={t("completionDescription")}
          />
          <SummaryCard
            icon={FileText}
            eyebrow={t("publicReflection")}
            title={t("privacyContent")}
            description={t("publicReflectionDescription")}
          />
        </div>

        {!canEdit ? (
          <div className="rounded-2xl border border-[#FEDF89] bg-[#FFFAEB] px-4 py-3 text-sm font-medium text-[#B54708]">
            {t("branchReadOnlyNotice")}
          </div>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="space-y-5 rounded-[24px] border border-[#EAECF0] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-6">
            <SectionHeader
              icon={Building2}
              title={t("businessSectionTitle")}
              description={t("businessSectionDescription")}
            />

            <div className="rounded-2xl border border-[#EAECF0] bg-[#FCFCFD] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-[#C1121F] ring-1 ring-[#FEE4E2]">
                    <UserRound className="size-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#98A2B3]">
                      {t("ownerName")}
                    </p>
                    <p className="mt-1 text-base font-semibold text-[#101828]">
                      {ownerName}
                    </p>
                  </div>
                </div>
                <span className="w-fit rounded-full border border-[#EAECF0] bg-white px-3 py-1 text-xs font-semibold text-[#667085]">
                  {t("authProfileOwner")}
                </span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
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

            <div className="rounded-2xl border border-[#EAECF0] bg-[#FCFCFD] p-4">
              <SectionHeader
                icon={MapPin}
                title={t("addressSectionTitle")}
                description={t("addressSectionDescription")}
                compact
              />
              <div className="mt-4 grid gap-4 md:grid-cols-2">
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
                  onChange={(value) => updateAddressField("shopNumber", value)}
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
                  id="business-state"
                  label={t("state")}
                  value={draftProfile.businessAddress.state}
                  placeholder={t("statePlaceholder")}
                  disabled={!canEdit || loading}
                  onChange={(value) => updateAddressField("state", value)}
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
              <Label htmlFor="contract-text" className="text-sm font-semibold text-[#344054]">
                {t("contractText")}
              </Label>
              <Textarea
                id="contract-text"
                value={draftProfile.contractText}
                placeholder={t("contractTextPlaceholder")}
                disabled={!canEdit || loading}
                onChange={(event) => updateField("contractText", event.target.value)}
                className="min-h-[260px] resize-y rounded-2xl border-[#D0D5DD] bg-white p-4 text-sm leading-7 text-[#344054] shadow-none focus-visible:ring-[#C1121F]/20"
              />
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-[24px] border border-[#EAECF0] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#98A2B3]">
                {t("customerPreview")}
              </p>
              <h2 className="mt-3 text-xl font-semibold text-[#101828]">
                {draftProfile.legalBusinessName || t("emptyBusinessName")}
              </h2>
              <div className="mt-4 space-y-3 text-sm">
                <PreviewRow label={t("ownerName")} value={ownerName} />
                <PreviewRow label={t("taxNumber")} value={draftProfile.taxNumber || "-"} />
                <PreviewRow label={t("address")} value={addressPreview || "-"} />
              </div>
              <div className="mt-5 rounded-2xl bg-[#F8F9FB] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#98A2B3]">
                  {t("contractText")}
                </p>
                <p className="mt-2 max-h-[220px] overflow-auto whitespace-pre-wrap text-sm leading-6 text-[#475467]">
                  {draftProfile.contractText || t("emptyContract")}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  eyebrow,
  title,
  description,
  tone = "neutral",
}: {
  icon: typeof ShieldCheck;
  eyebrow: string;
  title: string;
  description: string;
  tone?: "neutral" | "success" | "warning";
}) {
  return (
    <div className="rounded-2xl border border-[#EAECF0] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#98A2B3]">
            {eyebrow}
          </p>
          <p className="mt-2 text-xl font-semibold text-[#101828]">{title}</p>
          <p className="mt-1 text-sm leading-5 text-[#667085]">{description}</p>
        </div>
        <span
          className={cn(
            "inline-flex size-10 shrink-0 items-center justify-center rounded-full",
            tone === "success" && "bg-[#ECFDF3] text-[#039855]",
            tone === "warning" && "bg-[#FFFAEB] text-[#DC6803]",
            tone === "neutral" && "bg-[#F2F4F7] text-[#475467]"
          )}
        >
          <Icon className="size-5" />
        </span>
      </div>
    </div>
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
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[#FFF1F2] text-[#C1121F]">
        <Icon className="size-5" />
      </span>
      <div>
        <h2 className={cn("font-semibold text-[#101828]", compact ? "text-base" : "text-xl")}>
          {title}
        </h2>
        <p className="mt-1 text-sm leading-6 text-[#667085]">{description}</p>
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
      <Label htmlFor={id} className="text-sm font-semibold text-[#344054]">
        {label}
      </Label>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 rounded-xl border-[#D0D5DD] bg-white text-[#101828] shadow-none focus-visible:ring-[#C1121F]/20"
      />
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#98A2B3]">
        {label}
      </p>
      <p className="mt-1 break-words font-medium text-[#344054]">{value}</p>
    </div>
  );
}
