"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, type FieldErrors } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
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

const showFirstValidationError = (errors: FieldErrors<CouponFormValues>) => {
  const firstError = Object.values(errors).find((error) => error?.message);
  if (typeof firstError?.message === "string") toast.error(firstError.message);
};

export default function AddNewCoupon() {
  const { restaurantId: authRestaurantId, user } = useAuth();
  const createCouponMutation = useCreateCoupon();
  const updateCouponMutation = useUpdateCoupon();
  const router = useRouter();
  const searchParams = useSearchParams();
  const couponCode = searchParams.get("coupon");

  const [saving, setSaving] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [couponId, setCouponId] = useState("");


  const { control, handleSubmit, reset, setValue } = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues,
  });

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
    setCouponId(nextCouponId);
    reset({
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
    });
  }, [couponCode, couponResponse, reset]);

  const handleItemSelect = (id: string) => {
    const item = items.find((currentItem) => currentItem.id === id);
    setValue("scopeMenuItemId", id);
    setValue("scopeCategoryId", item?.categoryId || "");
  };

  const onSubmit = async (values: CouponFormValues) => {
    if (saving) return;

    if (!restaurantId) {
      toast.error("Restaurant id is missing");
      return;
    }

    if (isEdit && !couponId) {
      toast.error("Coupon id is missing");
      return;
    }

    setSaving(true);

    const payload = cleanPayload({
      ...values,
      restaurantId,
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

      toast.success(isEdit ? "Coupon updated successfully" : "Coupon created successfully");
      router.push("/promotion-management");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageWrapper title={isEdit ? "Update Coupon" : "Add New Coupon"}>
      <form onSubmit={handleSubmit(onSubmit, showFirstValidationError)} className="space-y-8" noValidate>
        <Section label="Setup Basic Info">
          <Controller
            control={control}
            name="title"
            render={({ field, fieldState }) => (
              <FormInput
                label="Coupon Title"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={Boolean(fieldState.error)}
                errorText={fieldState.error?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="code"
            render={({ field, fieldState }) => (
              <FormInput
                label="Coupon Code"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={Boolean(fieldState.error)}
                errorText={fieldState.error?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="maxUses"
            render={({ field }) => (
              <FormInput label="Max Uses" type="number" value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
            )}
          />
        </Section>

        <Section label="Discount Setup">
          <Controller
            control={control}
            name="discountType"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FLAT">Flat Amount</SelectItem>
                  <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                </SelectContent>
              </Select>
            )}
          />

          <Controller
            control={control}
            name="discountValue"
            render={({ field }) => (
              <FormInput
                label="Discount Value"
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
              <FormInput label="Starts At" type="datetime-local" value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
            )}
          />

          <Controller
            control={control}
            name="expiresAt"
            render={({ field }) => (
              <FormInput label="Expires At" type="datetime-local" value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
            )}
          />
        </Section>

        <Section label="Branch">
          <Controller
            control={control}
            name="branchId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select branch" />
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

        <Section label="Apply To (Optional)">
          <Controller
            control={control}
            name="scopeMenuItemId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={handleItemSelect}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select item" />
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

        <Section label="Advanced">
          <Controller
            control={control}
            name="minOrderAmount"
            render={({ field }) => (
              <FormInput
                label="Min Order Amount"
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
                label="Max Discount Amount"
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
                label="Max Uses Per Customer"
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
            onClick={() => reset(defaultValues)}
            disabled={saving}
            className="h-[44px] rounded-lg border px-6 text-sm font-medium text-gray-600 disabled:opacity-60"
          >
            Reset
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-[44px] items-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </PageWrapper>
  );
}
