"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Controller, useForm, type FieldErrors } from "react-hook-form";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import {
  FIELD_ERROR_CLASS,
  INPUT_BASE_CLASS,
} from "@/components/common/common-classes";
import FormInput from "@/components/forms/common/FormInput";
import { ImageUploadField } from "@/components/forms/common/ImageUploadField";
import { toDateTimeLocalValue } from "@/components/pages/Promotions/gift-cards/utils/gift-card-formatters";
import PageWrapper from "@/components/pages/Promotions/forms/PageWrapper";
import Section from "@/components/pages/Promotions/forms/Section";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { GiftCard, GiftCardFormValues } from "@/types/gift-cards";
import { giftCardFormSchema } from "@/validations/gift-cards";

export type GiftCardFormBranchOption = {
  id: string;
  name: string;
};

type GiftCardFormProps = {
  title: string;
  initialGiftCard?: GiftCard;
  restaurantId?: string;
  branchId?: string;
  isBranchAdmin: boolean;
  branchOptions: GiftCardFormBranchOption[];
  submitting: boolean;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (values: GiftCardFormValues) => void;
};

const getDefaultValues = ({
  initialGiftCard,
  restaurantId,
  branchId,
  isBranchAdmin,
}: {
  initialGiftCard?: GiftCard;
  restaurantId?: string;
  branchId?: string;
  isBranchAdmin: boolean;
}): GiftCardFormValues => ({
  title: initialGiftCard?.title ?? "",
  code: initialGiftCard?.code ?? "",
  description: initialGiftCard?.description ?? "",
  imageUrl: initialGiftCard?.imageUrl ?? initialGiftCard?.thumbnailUrl ?? "",
  thumbnailUrl: initialGiftCard?.thumbnailUrl ?? initialGiftCard?.imageUrl ?? "",
  restaurantId: initialGiftCard?.restaurant?.id ?? restaurantId ?? "",
  branchId: initialGiftCard?.branch?.id ?? (isBranchAdmin ? branchId ?? "" : ""),
  amount: initialGiftCard?.amount ?? 0,
  maxUses: initialGiftCard?.maxUses ?? null,
  maxUsesPerCustomer: initialGiftCard?.maxUsesPerCustomer ?? null,
  startsAt: toDateTimeLocalValue(initialGiftCard?.startsAt),
  expiresAt: toDateTimeLocalValue(initialGiftCard?.expiresAt),
  isActive: initialGiftCard?.isActive ?? true,
});

const showFirstValidationError = (errors: FieldErrors<GiftCardFormValues>) => {
  const firstError = Object.values(errors).find((error) => error?.message);
  if (typeof firstError?.message === "string") toast.error(firstError.message);
};

export default function GiftCardForm({
  title,
  initialGiftCard,
  restaurantId,
  branchId,
  isBranchAdmin,
  branchOptions,
  submitting,
  submitLabel,
  onCancel,
  onSubmit,
}: GiftCardFormProps) {
  const t = useTranslations("promotions.giftCards.form");
  const commonT = useTranslations("common");
  const { control, handleSubmit, setValue } = useForm<GiftCardFormValues>({
    resolver: zodResolver(giftCardFormSchema),
    defaultValues: getDefaultValues({
      initialGiftCard,
      restaurantId,
      branchId,
      isBranchAdmin,
    }),
  });

  const syncImageAliases = (value: string) => {
    setValue("thumbnailUrl", value, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  return (
    <PageWrapper title={title}>
      <form
        onSubmit={handleSubmit(onSubmit, showFirstValidationError)}
        className="space-y-8"
        noValidate
      >
        <Section label={t("setupBasicInfo")}>
          <Controller
            control={control}
            name="title"
            render={({ field, fieldState }) => (
              <FormInput
                label={t("title")}
                placeholder={t("titlePlaceholder")}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={Boolean(fieldState.error)}
                errorText={fieldState.error?.message}
              />
            )}
          />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Controller
              control={control}
              name="code"
              render={({ field, fieldState }) => (
                <FormInput
                  label={t("code")}
                  placeholder={t("codePlaceholder")}
                  value={field.value ?? ""}
                  onChange={(value) => field.onChange(value.toUpperCase())}
                  onBlur={field.onBlur}
                  error={Boolean(fieldState.error)}
                  errorText={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="amount"
              render={({ field, fieldState }) => (
                <NumberField
                  label={t("amount")}
                  value={field.value}
                  min={0}
                  placeholder={t("amountPlaceholder")}
                  error={fieldState.error?.message}
                  onChange={(value) => field.onChange(value ?? 0)}
                />
              )}
            />
          </div>

          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <div className="space-y-2">
                <Label>{commonT("description")}</Label>
                <textarea
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder={t("descriptionPlaceholder")}
                  className="min-h-[110px] w-full rounded-md border border-[#BBBBBB] px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            )}
          />

          <Controller
            control={control}
            name="imageUrl"
            render={({ field, fieldState }) => (
              <ImageUploadField<GiftCardFormValues>
                name="imageUrl"
                label={t("image")}
                value={field.value}
                error={fieldState.error?.message}
                setValue={setValue}
                onValueChange={syncImageAliases}
                previewAlt={t("imagePreviewAlt")}
                disabled={submitting}
              />
            )}
          />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Controller
              control={control}
              name="maxUses"
              render={({ field, fieldState }) => (
                <NumberField
                  label={t("maxUses")}
                  value={field.value}
                  min={1}
                  step={1}
                  placeholder={t("maxUsesPlaceholder")}
                  error={fieldState.error?.message}
                  onChange={field.onChange}
                />
              )}
            />

            <Controller
              control={control}
              name="maxUsesPerCustomer"
              render={({ field, fieldState }) => (
                <NumberField
                  label={t("maxUsesPerCustomer")}
                  value={field.value}
                  min={1}
                  step={1}
                  placeholder={t("maxUsesPerCustomerPlaceholder")}
                  error={fieldState.error?.message}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          <Controller
            control={control}
            name="branchId"
            render={({ field }) => (
              <div className="space-y-2">
                <Label>{commonT("branch")}</Label>
                {isBranchAdmin ? (
                  <div className="flex h-[44px] items-center rounded-md border border-[#BBBBBB] bg-gray-50 px-4 text-sm text-gray-500">
                    {commonT("currentBranch")}
                  </div>
                ) : (
                  <select
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    className="h-[44px] w-full rounded-md border border-[#BBBBBB] bg-white px-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="">{commonT("allBranches")}</option>
                    {branchOptions.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Controller
              control={control}
              name="startsAt"
              render={({ field, fieldState }) => (
                <DateField
                  label={t("startsAt")}
                  value={field.value}
                  error={fieldState.error?.message}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />

            <Controller
              control={control}
              name="expiresAt"
              render={({ field, fieldState }) => (
                <DateField
                  label={t("expiresAt")}
                  value={field.value}
                  error={fieldState.error?.message}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
          </div>

          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                />
                {t("activeGiftCard")}
              </label>
            )}
          />
        </Section>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={submitting}
            className="h-[44px] rounded-lg px-6"
          >
            {commonT("cancel")}
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="inline-flex h-[44px] items-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
            {submitLabel}
          </Button>
        </div>
      </form>
    </PageWrapper>
  );
}

type NumberFieldProps = {
  label: string;
  value: number | null | undefined;
  min: number;
  step?: number;
  placeholder: string;
  error?: string;
  onChange: (value: number | null) => void;
};

function NumberField({
  label,
  value,
  min,
  step,
  placeholder,
  error,
  onChange,
}: NumberFieldProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="number"
        min={min}
        step={step ?? "any"}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(event) => {
          const nextValue = event.target.value;
          onChange(nextValue === "" ? null : Number(nextValue));
        }}
        className={INPUT_BASE_CLASS}
      />
      {error ? <p className={FIELD_ERROR_CLASS}>{error}</p> : null}
    </div>
  );
}

type DateFieldProps = {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
};

function DateField({ label, value, error, onChange, onBlur }: DateFieldProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="datetime-local"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className={INPUT_BASE_CLASS}
      />
      {error ? <p className={FIELD_ERROR_CLASS}>{error}</p> : null}
    </div>
  );
}
