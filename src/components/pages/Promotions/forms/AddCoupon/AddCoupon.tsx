"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, type FieldErrors } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import FormInput from "@/components/forms/common/FormInput";
import PageWrapper from "@/components/pages/Promotions/forms/PageWrapper";
import Section from "@/components/pages/Promotions/forms/Section";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { getStoredAuth } from "@/lib/auth";
import {
  cleanPayload,
  getString,
  normalizeApiArray,
  normalizeApiRecords,
} from "@/components/pages/Promotions/utils/option-normalizers";
import { couponSchema, type CouponFormValues } from "@/validations/promotions";
import { useGetBranches } from "@/hooks/useBranches";
import { useGetMenuItems } from "@/hooks/useMenus";
import { useCreateCoupon, useGetCoupons, useUpdateCoupon } from "@/hooks/usePromotions";

const defaultValues: CouponFormValues = {
  code: "",
  title: "",
  discountType: "FLAT",
  discountValue: "",
  startsAt: "",
  expiresAt: "",
  description: "",
  branchId: "",
  maxDiscountAmount: "",
  minOrderAmount: "",
  maxUses: "",
  maxUsesPerCustomer: "",
  scopeMenuItemId: "",
  scopeCategoryId: "",
};

const formatDate = (date: string) => {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 16);
};

const toOptionalNumber = (value: unknown) => {
  if (value === "" || value === null || value === undefined) return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
};

export default function AddNewCoupon() {
  const t = useTranslations("promotions");
  const { restaurantId: authRestaurantId, user } = useAuth();
  const createCouponMutation = useCreateCoupon();
  const updateCouponMutation = useUpdateCoupon();
  const router = useRouter();
  const searchParams = useSearchParams();
  const couponCode = searchParams.get("coupon");

  const [saving, setSaving] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [couponId, setCouponId] = useState("");
  const [loadedValues, setLoadedValues] = useState<CouponFormValues>(defaultValues);


  const { control, handleSubmit, reset, setValue } = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues,
  });
  const validationMessages: Record<string, string> = {
    "Coupon code is required.": t("validation.couponCodeRequired"),
    "Coupon title is required.": t("validation.couponTitleRequired"),
  };
  const translateValidation = (message?: string) =>
    message ? validationMessages[message] ?? message : undefined;
  const showTranslatedValidationError = (errors: FieldErrors<CouponFormValues>) => {
    const firstError = Object.values(errors).find((error) => error?.message);
    if (typeof firstError?.message === "string") {
      toast.error(translateValidation(firstError.message));
    }
  };

  const getStoredRestaurantId = () => {
    const stored = getStoredAuth();
    return stored?.user?.restaurantId ?? "";
  };

  const restaurantId = useMemo(() => {
    return authRestaurantId || user?.restaurantId || getStoredRestaurantId() || "";
  }, [authRestaurantId, user?.restaurantId]);

  const { data: branchResponse } = useGetBranches({
    restaurantId: restaurantId || undefined,
  });
  const { data: itemResponse } = useGetMenuItems({
    restaurantId: restaurantId || undefined,
  });
  const { data: couponResponse } = useGetCoupons({
    restaurantId: restaurantId || undefined,
    search: couponCode || undefined,
  });

  const branches = normalizeApiArray(branchResponse);
  const items = normalizeApiArray(itemResponse);

  useEffect(() => {
    if (!couponCode) return;

    setIsEdit(true);

    const coupon = normalizeApiRecords(couponResponse)[0];
    if (!coupon) return;

    const nextCouponId = getString(coupon, "id") ?? "";
    const nextValues: CouponFormValues = {
      code: getString(coupon, "code") ?? "",
      title: getString(coupon, "title") ?? "",
      discountType: coupon.discountType === "PERCENTAGE" ? "PERCENTAGE" : "FLAT",
      discountValue: String(coupon.discountValue ?? ""),
      startsAt: formatDate(getString(coupon, "startsAt") ?? ""),
      expiresAt: formatDate(getString(coupon, "expiresAt") ?? ""),
      description: getString(coupon, "description") ?? "",
      branchId: getString(coupon, "branchId") ?? "",
      maxDiscountAmount: String(coupon.maxDiscountAmount ?? ""),
      minOrderAmount: String(coupon.minOrderAmount ?? ""),
      maxUses: String(coupon.maxUses ?? ""),
      maxUsesPerCustomer: String(coupon.maxUsesPerCustomer ?? ""),
      scopeMenuItemId: getString(coupon, "scopeMenuItemId") ?? "",
      scopeCategoryId: getString(coupon, "scopeCategoryId") ?? "",
    };

    setCouponId(nextCouponId);
    setLoadedValues(nextValues);
    reset(nextValues);
  }, [couponCode, couponResponse, reset]);

  const handleItemSelect = (id: string) => {
    const item = items.find((currentItem) => currentItem.id === id);
    setValue("scopeMenuItemId", id);
    setValue("scopeCategoryId", item?.categoryId || "");
  };

  const resetCouponForm = () => {
    reset(isEdit ? loadedValues : defaultValues);
  };

  const onSubmit = async (values: CouponFormValues) => {
    if (saving) return;

    if (!restaurantId) {
      toast.error(t("toasts.restaurantIdMissingLower"));
      return;
    }

    if (isEdit && !couponId) {
      toast.error(t("toasts.couponIdMissing"));
      return;
    }

    setSaving(true);

    const payload = cleanPayload({
      ...values,
      ...(isEdit ? {} : { restaurantId }),
      code: values.code.trim(),
      title: values.title.trim(),
      description: values.description?.trim() || undefined,
      discountValue: toOptionalNumber(values.discountValue) ?? 0,
      maxDiscountAmount: toOptionalNumber(values.maxDiscountAmount),
      minOrderAmount: toOptionalNumber(values.minOrderAmount),
      maxUses: toOptionalNumber(values.maxUses),
      maxUsesPerCustomer: toOptionalNumber(values.maxUsesPerCustomer),
    });

    try {
      if (isEdit) {
        await updateCouponMutation.mutateAsync({ id: couponId, payload });
      } else {
        await createCouponMutation.mutateAsync(payload);
      }

      toast.success(isEdit ? t("toasts.couponUpdated") : t("toasts.couponCreated"));
      router.push("/promotion-management");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageWrapper title={isEdit ? t("updateCoupon") : t("addNewCoupon")}>
      <form onSubmit={handleSubmit(onSubmit, showTranslatedValidationError)} className="space-y-8" noValidate>
        <Section label={t("forms.setupBasicInfo")}>
          <Controller
            control={control}
            name="title"
            render={({ field, fieldState }) => (
              <FormInput
                label={t("forms.couponTitle")}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={Boolean(fieldState.error)}
                errorText={translateValidation(fieldState.error?.message)}
              />
            )}
          />

          <Controller
            control={control}
            name="code"
            render={({ field, fieldState }) => (
              <FormInput
                label={t("forms.couponCode")}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={Boolean(fieldState.error)}
                errorText={translateValidation(fieldState.error?.message)}
              />
            )}
          />

          <Controller
            control={control}
            name="maxUses"
            render={({ field }) => (
              <FormInput label={t("forms.maxUses")} type="number" value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
            )}
          />
        </Section>

        <Section label={t("forms.discountSetup")}>
          <Controller
            control={control}
            name="discountType"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FLAT">{t("forms.flatAmount")}</SelectItem>
                  <SelectItem value="PERCENTAGE">{t("forms.percentage")}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />

          <Controller
            control={control}
            name="discountValue"
            render={({ field }) => (
              <FormInput
                label={t("forms.discountValue")}
                type="number"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />

          <Controller
            control={control}
            name="startsAt"
            render={({ field }) => (
              <FormInput label={t("forms.startsAt")} type="datetime-local" value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
            )}
          />

          <Controller
            control={control}
            name="expiresAt"
            render={({ field }) => (
              <FormInput label={t("forms.expiresAt")} type="datetime-local" value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
            )}
          />
        </Section>

        <Section label={t("forms.branch")}>
          <Controller
            control={control}
            name="branchId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={t("forms.selectBranch")} />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Section>

        <Section label={t("forms.applyToOptional")}>
          <Controller
            control={control}
            name="scopeMenuItemId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={handleItemSelect}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={t("forms.selectItem")} />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Section>

        <Section label={t("forms.advanced")}>
          <Controller
            control={control}
            name="minOrderAmount"
            render={({ field }) => (
              <FormInput
                label={t("forms.minimumOrderAmountShort")}
                type="number"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />

          <Controller
            control={control}
            name="maxDiscountAmount"
            render={({ field }) => (
              <FormInput
                label={t("forms.maximumDiscountAmountShort")}
                type="number"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />

          <Controller
            control={control}
            name="maxUsesPerCustomer"
            render={({ field }) => (
              <FormInput
                label={t("forms.maxUsesPerCustomer")}
                type="number"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
        </Section>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={resetCouponForm}
            disabled={saving}
            className="h-[44px] rounded-lg border px-6 text-sm font-medium text-gray-600 disabled:opacity-60"
          >
            {t("actions.reset")}
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-[44px] items-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? t("actions.saving") : t("actions.save")}
          </button>
        </div>
      </form>
    </PageWrapper>
  );
}
