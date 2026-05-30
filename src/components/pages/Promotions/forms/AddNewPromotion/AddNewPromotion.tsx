"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { Controller, useForm, useWatch, type FieldErrors } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import FormInput from "@/components/forms/common/FormInput";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import PageWrapper from "@/components/pages/Promotions/forms/PageWrapper";
import Section from "@/components/pages/Promotions/forms/Section";
import AsyncMultiSelect from "@/components/ui/AsyncMultiSelect";

import { useAuth } from "@/hooks/useAuth";
import {
  useCreateAdminPromotionCampaign,
  useGetAdminPromotionCampaignDetail,
  useUpdateAdminPromotionCampaign,
} from "@/hooks/usePromotions";

import { getMenuItems } from "@/services/menu/menu.api";
import { getMenuCategories } from "@/services/menu/categories/menu-categories.api";
import { getApiErrorMessage } from "@/lib/errors";
import {
  getIds,
  getOptionId,
  getString,
  normalizeDetail,
  normalizeSelectedOptions,
} from "@/components/pages/Promotions/utils/option-normalizers";
import { promotionSchema, type PromotionFormValues } from "@/validations/promotions";
import { FIELD_ERROR_CLASS, INPUT_BASE_CLASS, MUTED_TEXT_SM_CLASS } from "@/components/common/common-classes";

const defaultValues: PromotionFormValues = {
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
  applyMode: "ORDER_TOTAL",
  autoApply: true,
  isActive: true,
  assignPermanently: false,
  branchId: "",
  selectedBranch: null,
  selectedMenuItems: [],
  selectedCategories: [],
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

const showFirstValidationError = (errors: FieldErrors<PromotionFormValues>) => {
  const firstError = Object.values(errors).find((error) => error?.message);
  if (typeof firstError?.message === "string") toast.error(firstError.message);
};

export default function AddNewPromotion() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const isEditMode = Boolean(id);

  const { user, restaurantId, isBranchAdmin } = useAuth();
  const authBranchId = user?.branchId ?? "";

  const { control, handleSubmit, reset, setValue } = useForm<PromotionFormValues>({
    resolver: zodResolver(promotionSchema),
    defaultValues,
  });

  const values = useWatch({ control }) as PromotionFormValues;

  const { data: detailResponse, isLoading: detailLoading } =
    useGetAdminPromotionCampaignDetail(id ?? undefined, {
      restaurantId,
      branchId: authBranchId,
    });

  const createMutation = useCreateAdminPromotionCampaign();
  const updateMutation = useUpdateAdminPromotionCampaign();

  const submitting = createMutation.isPending || updateMutation.isPending;
  const pageTitle = isEditMode ? "Update Promotion" : "Add New Promotion";

  useEffect(() => {
    if (isEditMode || !isBranchAdmin || !authBranchId || values.branchId) return;
    setValue("branchId", authBranchId, { shouldDirty: false });
  }, [authBranchId, isBranchAdmin, isEditMode, setValue, values.branchId]);

  useEffect(() => {
    if (!isEditMode || !detailResponse) return;

    const detail = normalizeDetail(detailResponse);
    if (!detail) return;

    const detailAutoApply = Boolean(detail.autoApply ?? !detail.code);
    const detailApplyMode = detail.applyMode === "SCOPED_ITEMS" ? "SCOPED_ITEMS" : "ORDER_TOTAL";
    const branchId = getString(detail, "branchId") ?? getOptionId(detail.branch);

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
      applyMode: detailApplyMode,
      autoApply: detailAutoApply,
      isActive: Boolean(detail.isActive),
      assignPermanently: !detail.expiresAt,
      branchId,
      selectedBranch:
        normalizeSelectedOptions({
          singleRecord: detail.branch,
          singleId: branchId,
          fallbackLabel: "Branch",
        })[0] ?? null,
      selectedMenuItems: normalizeSelectedOptions({
        records: detail.scopeMenuItems,
        ids: detail.scopeMenuItemIds,
        singleRecord: detail.scopeMenuItem,
        singleId: getString(detail, "scopeMenuItemId"),
        fallbackLabel: "Menu Item",
      }),
      selectedCategories: normalizeSelectedOptions({
        records: detail.scopeCategories,
        ids: detail.scopeCategoryIds,
        singleRecord: detail.scopeCategory,
        singleId: getString(detail, "scopeCategoryId"),
        fallbackLabel: "Category",
      }),
    });
  }, [detailResponse, isEditMode, reset]);

  const selectedBranchId = isBranchAdmin
    ? getOptionId(values.selectedBranch) || authBranchId || ""
    : getOptionId(values.selectedBranch) || values.branchId || "";

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
    const scopeMenuItemIds = values.applyMode === "SCOPED_ITEMS" ? getIds(values.selectedMenuItems) : [];
    const scopeCategoryIds = values.applyMode === "SCOPED_ITEMS" ? getIds(values.selectedCategories) : [];
    const trimmedCode = values.code.trim();

    return {
      ...(values.autoApply || !trimmedCode ? {} : { code: trimmedCode }),
      title: values.title.trim(),
      description: values.description.trim(),
      restaurantId,
      branchId: selectedBranchId || undefined,
      discountType: values.discountType,
      discountValue: toNumber(values.discountValue),
      maxDiscountAmount: toNumber(values.maxDiscountAmount),
      minOrderAmount: toNumber(values.minOrderAmount),
      maxUses: toNumber(values.maxUses),
      maxUsesPerCustomer: toNumber(values.maxUsesPerCustomer),
      startsAt: toISOStringOrNull(values.startsAt),
      expiresAt: values.assignPermanently ? null : toISOStringOrNull(values.expiresAt),
      scopeMenuItemId: scopeMenuItemIds[0] ?? null,
      scopeCategoryId: scopeCategoryIds[0] ?? null,
      scopeMenuItemIds,
      scopeCategoryIds,
      applyMode: values.applyMode,
      autoApply: values.autoApply,
      isActive: values.isActive,
    };
  }, [restaurantId, selectedBranchId, values]);

  const onSubmit = async () => {
    if (!restaurantId) {
      toast.error("Restaurant ID is missing.");
      return;
    }

    if (
      values.applyMode === "SCOPED_ITEMS" &&
      values.selectedMenuItems.length === 0 &&
      values.selectedCategories.length === 0
    ) {
      toast.error("Select at least one item or category for scoped promotion.");
      return;
    }

    try {
      if (isEditMode && id) {
        await updateMutation.mutateAsync({ id, payload });
        toast.success("Promotion updated successfully.");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Promotion created successfully.");
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
        <Section label="Setup Basic Info">
          {/* Branch selection is intentionally hidden for now.
          <div className="space-y-2">
            <Label className="text-[16px]">
              Branch{isBranchAdmin ? " *" : " (optional)"}
            </Label>
            <p className={MUTED_TEXT_SM_CLASS}>
              {isBranchAdmin
                ? "Select the branch where this promotion should be available."
                : "Leave blank to make this promotion available across all branches, or choose a branch to scope it."}
            </p>

            {isBranchAdmin ? (
              <div className="rounded-[12px] border border-primary/10 bg-primary/5 px-4 py-3 text-sm font-medium text-gray-800">
                {values.selectedBranch?.name || "Current Branch"}
              </div>
            ) : (
              <Controller
                control={control}
                name="selectedBranch"
                render={({ field }) => (
                  <AsyncSelect
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Search branch (optional)"
                    fetchOptions={fetchBranchOptions}
                    labelKey="name"
                    valueKey="id"
                  />
                )}
              />
            )}
          </div>
          */}

          <Controller
            control={control}
            name="title"
            render={({ field, fieldState }) => (
              <FormInput
                label="Offer Title *"
                placeholder="eg. 20% Off On Orders"
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
                  placeholder="Write promotion description"
                  className="min-h-[110px] w-full rounded-md border border-[#BBBBBB] px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            )}
          />

          <Controller
            control={control}
            name="autoApply"
            render={({ field }) => (
              <div className="rounded-xl border border-primary/10 bg-primary/5 p-4">
                <label className="flex items-start gap-3 text-sm text-gray-700">
                  <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(Boolean(checked))} />
                  <span>
                    <span className="block font-medium text-gray-900">Auto-apply promotion</span>
                    <span className="mt-1 block text-xs leading-5 text-gray-500">
                      When enabled, customers do not need a coupon code. The frontend will not send a code for this
                      promotion.
                    </span>
                  </span>
                </label>
              </div>
            )}
          />

          {!values.autoApply ? (
            <Controller
              control={control}
              name="code"
              render={({ field }) => (
                <FormInput
                  label="Promotion Code (optional)"
                  placeholder="eg. SUMMER20"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
          ) : null}

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
                    disabled={values.assignPermanently}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    className={`${INPUT_BASE_CLASS} disabled:cursor-not-allowed disabled:bg-gray-100`}
                  />
                  {fieldState.error?.message ? <p className={FIELD_ERROR_CLASS}>{fieldState.error.message}</p> : null}
                </div>
              )}
            />
          </div>

          <Controller
            control={control}
            name="assignPermanently"
            render={({ field }) => (
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(Boolean(checked))} />
                Assign this offer permanently
              </label>
            )}
          />

          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(Boolean(checked))} />
                Active promotion
              </label>
            )}
          />
        </Section>

        <Section label="Promotion Scope">
          <Controller
            control={control}
            name="applyMode"
            render={({ field }) => (
              <div className="space-y-2">
                <Label>Apply Mode *</Label>
                <select
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  className="h-[44px] w-full rounded-md border border-[#BBBBBB] bg-white px-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <option value="ORDER_TOTAL">Order Total - apply discount on full order</option>
                  <option value="SCOPED_ITEMS">Scoped Items - apply only on selected items/categories</option>
                </select>
                <p className={MUTED_TEXT_SM_CLASS}>
                  ORDER_TOTAL discounts the full order total. SCOPED_ITEMS discounts only matching items and/or categories.
                </p>
              </div>
            )}
          />

          {values.applyMode === "SCOPED_ITEMS" ? (
            <>
              <Controller
                control={control}
                name="selectedMenuItems"
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label className="text-[16px]">Select Food Items</Label>
                    <p className={MUTED_TEXT_SM_CLASS}>
                      Select one or more food items. The promotion can be scoped to only items, only categories, or both.
                    </p>
                    <AsyncMultiSelect
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Search and select food items"
                      fetchOptions={fetchMenuItemOptions}
                      labelKey="name"
                      valueKey="id"
                    />
                    {field.value.length > 0 ? (
                      <button type="button" onClick={() => field.onChange([])} className="text-sm text-primary">
                        Clear selected food items
                      </button>
                    ) : null}
                  </div>
                )}
              />

              <Controller
                control={control}
                name="selectedCategories"
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label className="text-[16px]">Select Food Categories</Label>
                    <p className={MUTED_TEXT_SM_CLASS}>
                      Select one or more categories. All matching items inside these categories can receive the discount.
                    </p>
                    <AsyncMultiSelect
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Search and select categories"
                      fetchOptions={fetchCategoryOptions}
                      labelKey="name"
                      valueKey="id"
                    />
                    {field.value.length > 0 ? (
                      <button type="button" onClick={() => field.onChange([])} className="text-sm text-primary">
                        Clear selected categories
                      </button>
                    ) : null}
                  </div>
                )}
              />
            </>
          ) : (
            <div className={`rounded-xl border border-gray-100 bg-gray-50 p-4 ${MUTED_TEXT_SM_CLASS}`}>
              This promotion applies to the full eligible order total. No item or category scope is needed.
            </div>
          )}
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
            {isEditMode ? "Update Promotion" : "Create Promotion"}
          </button>
        </div>
      </form>
    </PageWrapper>
  );
}
