"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { Controller, useForm, useWatch, type FieldErrors } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import FormInput from "@/components/forms/common/FormInput";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import PageWrapper from "@/components/pages/Promotions/forms/PageWrapper";
import Section from "@/components/pages/Promotions/forms/Section";
import AsyncSelect from "@/components/ui/AsyncSelect";

import { useAuth } from "@/hooks/useAuth";
import {
  useCreateAdminHappyHour,
  useGetAdminHappyHourDetail,
  useUpdateAdminHappyHour,
} from "@/hooks/usePromotions";

import { getMenuItems } from "@/services/menu/menu.api";
import { getMenuCategories } from "@/services/menu/categories/menu-categories.api";
import { getApiErrorMessage } from "@/lib/errors";
import {
  getOptionId,
  getString,
  normalizeDetail,
  normalizeSelectedOptions,
} from "@/components/pages/Promotions/utils/option-normalizers";
import { happyHourSchema, type HappyHourFormValues } from "@/validations/promotions";
import { FIELD_ERROR_CLASS, INPUT_BASE_CLASS, MUTED_TEXT_SM_CLASS } from "@/components/common/common-classes";

const days = [
  { label: "Sunday", value: 0 },
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
];

const defaultValues: HappyHourFormValues = {
  code: "",
  title: "",
  description: "",
  discountType: "FLAT",
  discountValue: "",
  maxDiscountAmount: "",
  minOrderAmount: "",
  maxUses: "",
  maxUsesPerCustomer: "",
  startsAt: "",
  expiresAt: "",
  isActive: true,
  activeDays: [0, 1, 2, 3, 4, 5, 6],
  dailyStartTime: "",
  dailyEndTime: "",
  selectedMenuItem: null,
  selectedCategory: null,
};

const toDatetimeLocal = (value?: string | null) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 16);
};

const toISOStringOrNull = (value: string) => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
};

const toNumber = (value: string) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const showFirstValidationError = (errors: FieldErrors<HappyHourFormValues>) => {
  const firstError = Object.values(errors).find((error) => error?.message);
  if (typeof firstError?.message === "string") toast.error(firstError.message);
};

export default function AddHappyHour() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const isEditMode = Boolean(id);

  const { user, restaurantId } = useAuth();
  const branchId = user?.branchId ?? "";

  const { control, handleSubmit, reset, setValue } = useForm<HappyHourFormValues>({
    resolver: zodResolver(happyHourSchema),
    defaultValues,
  });

  const values = useWatch({ control }) as HappyHourFormValues;

  const { data: detailResponse, isLoading: detailLoading } = useGetAdminHappyHourDetail(id ?? undefined);

  const createMutation = useCreateAdminHappyHour();
  const updateMutation = useUpdateAdminHappyHour();

  const submitting = createMutation.isPending || updateMutation.isPending;
  const pageTitle = isEditMode ? "Update Happy Hour" : "Add Happy Hour";

  useEffect(() => {
    if (!isEditMode || !detailResponse) return;

    const detail = normalizeDetail(detailResponse);
    if (!detail) return;

    reset({
      code: getString(detail, "code") ?? "",
      title: getString(detail, "title") ?? "",
      description: getString(detail, "description") ?? "",
      discountType: detail.discountType === "PERCENTAGE" ? "PERCENTAGE" : "FLAT",
      discountValue: String(detail.discountValue ?? ""),
      maxDiscountAmount: String(detail.maxDiscountAmount ?? ""),
      minOrderAmount: String(detail.minOrderAmount ?? ""),
      maxUses: String(detail.maxUses ?? ""),
      maxUsesPerCustomer: String(detail.maxUsesPerCustomer ?? ""),
      startsAt: toDatetimeLocal(getString(detail, "startsAt")),
      expiresAt: toDatetimeLocal(getString(detail, "expiresAt")),
      isActive: Boolean(detail.isActive),
      activeDays:
        Array.isArray(detail.activeDays) && detail.activeDays.length > 0
          ? detail.activeDays.filter((day): day is number => typeof day === "number")
          : [0, 1, 2, 3, 4, 5, 6],
      dailyStartTime: getString(detail, "dailyStartTime") ?? "",
      dailyEndTime: getString(detail, "dailyEndTime") ?? "",
      selectedMenuItem:
        normalizeSelectedOptions({
          singleRecord: detail.scopeMenuItem,
          singleId: getString(detail, "scopeMenuItemId"),
          fallbackLabel: "Menu Item",
        })[0] ?? null,
      selectedCategory:
        normalizeSelectedOptions({
          singleRecord: detail.scopeCategory,
          singleId: getString(detail, "scopeCategoryId"),
          fallbackLabel: "Category",
        })[0] ?? null,
    });
  }, [detailResponse, isEditMode, reset]);

  const fetchMenuItemOptions = async ({
    search,
    page,
  }: {
    search: string;
    page: number;
  }) => {
    return getMenuItems({
      page,
      limit: 10,
      search,
      restaurantId: restaurantId ?? undefined,
    });
  };

  const fetchCategoryOptions = async ({
    search,
    page,
  }: {
    search: string;
    page: number;
  }) => {
    return getMenuCategories({
      page,
      limit: 10,
      search,
      restaurantId: restaurantId ?? undefined,
    });
  };

  const payload = useMemo(() => {
    return {
      code: values.code.trim(),
      title: values.title.trim(),
      description: values.description.trim(),
      restaurantId,
      branchId: branchId || null,
      discountType: values.discountType,
      discountValue: toNumber(values.discountValue),
      maxDiscountAmount: toNumber(values.maxDiscountAmount),
      minOrderAmount: toNumber(values.minOrderAmount),
      maxUses: toNumber(values.maxUses),
      maxUsesPerCustomer: toNumber(values.maxUsesPerCustomer),
      startsAt: toISOStringOrNull(values.startsAt),
      expiresAt: toISOStringOrNull(values.expiresAt),
      scopeMenuItemId: getOptionId(values.selectedMenuItem) || null,
      scopeCategoryId: getOptionId(values.selectedCategory) || null,
      isActive: values.isActive,
      activeDays: values.activeDays,
      dailyStartTime: values.dailyStartTime,
      dailyEndTime: values.dailyEndTime,
    };
  }, [branchId, restaurantId, values]);

  const onSubmit = async () => {
    if (!restaurantId) {
      toast.error("Restaurant ID is missing.");
      return;
    }

    try {
      if (isEditMode && id) {
        await updateMutation.mutateAsync({ id, payload });
        toast.success("Happy hour updated successfully.");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Happy hour created successfully.");
      }

      router.push("/promotion-management");
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Something went wrong."));
    }
  };

  if (detailLoading && isEditMode) {
    return (
      <PageWrapper title={pageTitle}>
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title={pageTitle}>
      <form onSubmit={handleSubmit(onSubmit, showFirstValidationError)} className="space-y-8" noValidate>
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-gray-600">Do you want to activate the happy hour promotion?</p>
              <Switch checked={field.value} onCheckedChange={(checked) => field.onChange(Boolean(checked))} />
            </div>
          )}
        />

        <Section label="Setup Basic Info">
          <Controller
            control={control}
            name="code"
            render={({ field, fieldState }) => (
              <FormInput
                label="Happy Hour Code *"
                placeholder="eg. EVENING20"
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
            name="title"
            render={({ field, fieldState }) => (
              <FormInput
                label="Happy Hour Title *"
                placeholder="eg. Evening Happy Hour"
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
            name="description"
            render={({ field }) => (
              <div className="space-y-2">
                <Label>Description</Label>
                <textarea
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Write happy hour description"
                  className="min-h-[110px] w-full rounded-md border border-[#BBBBBB] px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            )}
          />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Controller
              control={control}
              name="startsAt"
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Starts At *</Label>
                  <Input
                    type="datetime-local"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    className={INPUT_BASE_CLASS}
                  />
                  {fieldState.error?.message ? <p className={FIELD_ERROR_CLASS}>{fieldState.error.message}</p> : null}
                </div>
              )}
            />

            <Controller
              control={control}
              name="expiresAt"
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Expires At *</Label>
                  <Input
                    type="datetime-local"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    className={INPUT_BASE_CLASS}
                  />
                  {fieldState.error?.message ? <p className={FIELD_ERROR_CLASS}>{fieldState.error.message}</p> : null}
                </div>
              )}
            />
          </div>

          <Controller
            control={control}
            name="activeDays"
            render={({ field, fieldState }) => (
              <div className="space-y-3">
                <Label className="text-[15px] font-medium">Active Days *</Label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {days.map((day) => {
                    const checked = field.value.includes(day.value);
                    return (
                      <label key={day.value} className="flex items-center gap-2 text-sm text-gray-600">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => {
                            field.onChange(
                              checked
                                ? field.value.filter((item) => item !== day.value)
                                : [...field.value, day.value].sort((a, b) => a - b)
                            );
                          }}
                        />
                        {day.label}
                      </label>
                    );
                  })}
                </div>
                {fieldState.error?.message ? <p className={FIELD_ERROR_CLASS}>{fieldState.error.message}</p> : null}
              </div>
            )}
          />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Controller
              control={control}
              name="dailyStartTime"
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Daily Start Time *</Label>
                  <Input
                    type="time"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    className={INPUT_BASE_CLASS}
                  />
                  {fieldState.error?.message ? <p className={FIELD_ERROR_CLASS}>{fieldState.error.message}</p> : null}
                </div>
              )}
            />

            <Controller
              control={control}
              name="dailyEndTime"
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Daily End Time *</Label>
                  <Input
                    type="time"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    className={INPUT_BASE_CLASS}
                  />
                  {fieldState.error?.message ? <p className={FIELD_ERROR_CLASS}>{fieldState.error.message}</p> : null}
                </div>
              )}
            />
          </div>
        </Section>

        <Section label="Discount Setup">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Controller
              control={control}
              name="discountType"
              render={({ field }) => (
                <div className="space-y-2">
                  <Label>Discount Type *</Label>
                  <select
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    className="h-[52px] w-full rounded-md border border-[#BBBBBB] bg-white px-4 text-base outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="FLAT">Flat Discount</option>
                    <option value="PERCENTAGE">Percentage Discount</option>
                  </select>
                </div>
              )}
            />

            <Controller
              control={control}
              name="discountValue"
              render={({ field, fieldState }) => (
                <FormInput
                  label="Discount Value *"
                  type="number"
                  placeholder="eg. 20"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={Boolean(fieldState.error)}
                  errorText={fieldState.error?.message}
                />
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Controller
              control={control}
              name="minOrderAmount"
              render={({ field }) => (
                <FormInput
                  label="Minimum Order Amount"
                  type="number"
                  placeholder="eg. 100"
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
                  label="Maximum Discount Amount"
                  type="number"
                  placeholder="eg. 50"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Controller
              control={control}
              name="maxUses"
              render={({ field }) => (
                <FormInput
                  label="Maximum Uses"
                  type="number"
                  placeholder="eg. 100"
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
                  label="Maximum Uses Per Customer"
                  type="number"
                  placeholder="eg. 1"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
          </div>
        </Section>

        <Section label="Happy Hour Scope">
          <Controller
            control={control}
            name="selectedMenuItem"
            render={({ field }) => (
              <div className="space-y-2">
                <Label className="text-[16px]">Select Food Item</Label>
                <AsyncSelect
                  value={field.value}
                  onChange={(value) => {
                    field.onChange(value);
                    setValue("selectedCategory", null);
                  }}
                  placeholder="Search food item"
                  fetchOptions={fetchMenuItemOptions}
                  labelKey="name"
                  valueKey="id"
                />
                {field.value ? (
                  <button type="button" onClick={() => field.onChange(null)} className="text-sm text-primary">
                    Clear selected food item
                  </button>
                ) : null}
              </div>
            )}
          />

          <Controller
            control={control}
            name="selectedCategory"
            render={({ field }) => (
              <div className="space-y-2">
                <Label className="text-[16px]">Select Food Category</Label>
                <AsyncSelect
                  value={field.value}
                  onChange={(value) => {
                    field.onChange(value);
                    setValue("selectedMenuItem", null);
                  }}
                  placeholder="Search category"
                  fetchOptions={fetchCategoryOptions}
                  labelKey="name"
                  valueKey="id"
                />
                {field.value ? (
                  <button type="button" onClick={() => field.onChange(null)} className="text-sm text-primary">
                    Clear selected category
                  </button>
                ) : null}
              </div>
            )}
          />

          <p className={MUTED_TEXT_SM_CLASS}>Leave both fields empty if happy hour applies to all items.</p>
        </Section>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={submitting}
            className="h-[44px] rounded-lg border px-6 text-sm font-medium text-gray-600 disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-[44px] items-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {isEditMode ? "Update Happy Hour" : "Create Happy Hour"}
          </button>
        </div>
      </form>
    </PageWrapper>
  );
}
