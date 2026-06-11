"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch, type FieldErrors } from "react-hook-form";
import { toast } from "sonner";

import { FIELD_ERROR_CLASS, INPUT_BASE_CLASS, MUTED_TEXT_SM_CLASS } from "@/components/common/common-classes";
import FormInput from "@/components/forms/common/FormInput";
import { ImageUploadField } from "@/components/forms/common/ImageUploadField";
import AdminDealCategorySelector from "@/components/pages/Menu/deals/components/AdminDealCategorySelector";
import AdminDealMenuItemSelector from "@/components/pages/Menu/deals/components/AdminDealMenuItemSelector";
import {
  toDateTimeLocalValue,
  toDealStartsAtInputValue,
} from "@/components/pages/Menu/deals/utils/admin-deals-formatters";
import PageWrapper from "@/components/pages/Promotions/forms/PageWrapper";
import Section from "@/components/pages/Promotions/forms/Section";
import AsyncSelect from "@/components/ui/AsyncSelect";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMenuVariations } from "@/services/menus";
import { extractResponseItems } from "@/lib/response";
import type {
  AdminDeal,
  AdminDealCategorySummary,
  AdminDealCategoryRuleFormValues,
  AdminDealFormValues,
  AdminDealMenuItemSummary,
  AdminDealVariationSummary,
} from "@/types/admin-deals";
import { adminDealFormSchema } from "@/validations/admin-deals";
import { useTranslations } from "next-intl";

export type AdminDealFormBranchOption = {
  id: string;
  name: string;
};

type AdminDealFormProps = {
  title: string;
  initialDeal?: AdminDeal;
  restaurantId?: string;
  branchId?: string;
  isBranchAdmin: boolean;
  branchOptions: AdminDealFormBranchOption[];
  submitting: boolean;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (values: AdminDealFormValues) => void;
};

const getDefaultValues = ({
  initialDeal,
  restaurantId,
  branchId,
  isBranchAdmin,
}: {
  initialDeal?: AdminDeal;
  restaurantId?: string;
  branchId?: string;
  isBranchAdmin: boolean;
}): AdminDealFormValues => ({
  title: initialDeal?.title ?? "",
  description: initialDeal?.description ?? "",
  thumbnailUrl: initialDeal?.thumbnailUrl ?? "",
  imageUrl: initialDeal?.imageUrl ?? "",
  restaurantId: initialDeal?.restaurantId ?? restaurantId ?? "",
  branchId: initialDeal?.branchId ?? (isBranchAdmin ? branchId ?? "" : ""),
  discountValue: initialDeal?.discountValue ?? 0,
  startsAt: initialDeal ? toDealStartsAtInputValue(initialDeal) : "",
  expiresAt: toDateTimeLocalValue(initialDeal?.expiresAt),
  dealSelectionMode: initialDeal?.dealSelectionMode ?? "FIXED_ITEMS",
  dealSourceType:
    (initialDeal?.scopeCategoryRules?.length ?? 0) > 0 ||
    (initialDeal?.scopeCategoryIds?.length ?? 0) > 0 ||
    (initialDeal?.scopeCategories?.length ?? 0) > 0
      ? "CATEGORIES"
      : "ITEMS",
  dealRequiredQuantity: initialDeal?.dealRequiredQuantity ?? null,
  scopeMenuItemIds: initialDeal?.scopeMenuItemIds ?? [],
  scopeCategoryIds:
    initialDeal?.scopeCategoryIds ??
    initialDeal?.scopeCategoryRules?.map((rule) => rule.menuCategoryId) ??
    [],
  scopeCategoryRules:
    initialDeal?.scopeCategoryRules?.map((rule) => ({
      menuCategoryId: rule.menuCategoryId,
      itemLimit: rule.itemLimit,
      variationId: rule.variationId ?? "",
    })) ?? [],
  isActive: initialDeal?.isActive ?? true,
});

const showFirstValidationError = (errors: FieldErrors<AdminDealFormValues>) => {
  const firstError = Object.values(errors).find((error) => error?.message);
  if (typeof firstError?.message === "string") toast.error(firstError.message);
};

export default function AdminDealForm({
  title,
  initialDeal,
  restaurantId,
  branchId,
  isBranchAdmin,
  branchOptions,
  submitting,
  submitLabel,
  onCancel,
  onSubmit,
}: AdminDealFormProps) {
  const t = useTranslations("deals.form");
  const commonT = useTranslations("common");
  const initialMenuItems: AdminDealMenuItemSummary[] = useMemo(
    () => initialDeal?.scopeMenuItems ?? [],
    [initialDeal?.scopeMenuItems]
  );
  const initialCategories: AdminDealCategorySummary[] = useMemo(
    () => initialDeal?.scopeCategories ?? [],
    [initialDeal?.scopeCategories]
  );
  const [selectedCategoryOptions, setSelectedCategoryOptions] =
    useState<AdminDealCategorySummary[]>(initialCategories);
  const initialVariationOptions: AdminDealVariationSummary[] = useMemo(() => {
    const variationMap = new Map<string, AdminDealVariationSummary>();
    initialDeal?.scopeCategoryRules?.forEach((rule) => {
      if (rule.variation?.id && rule.variation?.name) {
        variationMap.set(String(rule.variation.id), {
          id: String(rule.variation.id),
          name: String(rule.variation.name),
        });
      }
    });

    return Array.from(variationMap.values());
  }, [initialDeal?.scopeCategoryRules]);

  const { control, handleSubmit, setValue } = useForm<AdminDealFormValues>({
    resolver: zodResolver(adminDealFormSchema),
    defaultValues: getDefaultValues({
      initialDeal,
      restaurantId,
      branchId,
      isBranchAdmin,
    }),
  });
  const dealSelectionMode = useWatch({ control, name: "dealSelectionMode" });
  const dealSourceType = useWatch({ control, name: "dealSourceType" });
  const startsAt = useWatch({ control, name: "startsAt" });
  const expiresAt = useWatch({ control, name: "expiresAt" });
  const scopeCategoryIds = useWatch({ control, name: "scopeCategoryIds" });
  const scopeCategoryRules = useWatch({ control, name: "scopeCategoryRules" });
  const isFlexibleDeal = dealSelectionMode === "FLEXIBLE_ITEMS";
  const isCategorySource = isFlexibleDeal && dealSourceType === "CATEGORIES";
  const hasCustomDealWindow = Boolean(startsAt || expiresAt);
  const categoryRuleTotal = useMemo(() => {
    return scopeCategoryRules
      .filter((rule) => scopeCategoryIds.includes(rule.menuCategoryId))
      .reduce((total, rule) => total + Number(rule.itemLimit ?? 0), 0);
  }, [scopeCategoryIds, scopeCategoryRules]);
  const fetchVariationOptions = useCallback(async ({
    categoryId,
    search,
    page,
  }: {
    categoryId: string;
    search: string;
    page: number;
  }) => {
    if (!restaurantId) return { data: [] };

    const response = await getMenuVariations({
      restaurantId,
      categoryId,
      search,
      page,
      limit: 50,
      sortBy: "name",
      sortOrder: "ASC",
      isActive: true,
    });

    return {
      data: extractResponseItems<{ id?: string; name?: string }>(response)
        .filter((variation) => variation.id && variation.name)
        .map((variation) => ({
          id: String(variation.id),
          name: String(variation.name),
        })),
    };
  }, [restaurantId]);

  useEffect(() => {
    setSelectedCategoryOptions(initialCategories);
  }, [initialCategories]);

  useEffect(() => {
    if (!isCategorySource) return;

    const currentRuleMap = new Map(
      scopeCategoryRules.map((rule) => [rule.menuCategoryId, rule])
    );
    const nextRules = scopeCategoryIds.map((categoryId) => {
      return (
        currentRuleMap.get(categoryId) ?? {
          menuCategoryId: categoryId,
          itemLimit: 1,
          variationId: "",
        }
      );
    });
    const rulesChanged =
      nextRules.length !== scopeCategoryRules.length ||
      nextRules.some((rule, index) => {
        const currentRule = scopeCategoryRules[index];
        return (
          currentRule?.menuCategoryId !== rule.menuCategoryId ||
          currentRule?.itemLimit !== rule.itemLimit ||
          (currentRule?.variationId ?? "") !== (rule.variationId ?? "")
        );
      });

    if (rulesChanged) {
      setValue("scopeCategoryRules", nextRules, { shouldValidate: true });
    }
  }, [isCategorySource, scopeCategoryIds, scopeCategoryRules, setValue]);

  const handleDealTypeChange = (value: AdminDealFormValues["dealSelectionMode"]) => {
    setValue("dealSelectionMode", value, { shouldValidate: true });
    if (value === "FIXED_ITEMS") {
      setValue("dealSourceType", "ITEMS", { shouldValidate: true });
      setValue("dealRequiredQuantity", null, { shouldValidate: true });
      setValue("scopeCategoryIds", [], { shouldValidate: true });
      setValue("scopeCategoryRules", [], { shouldValidate: true });
    }
  };

  const handleSourceTypeChange = (value: AdminDealFormValues["dealSourceType"]) => {
    setValue("dealSourceType", value, { shouldValidate: true });
    if (value === "CATEGORIES") {
      setValue("scopeMenuItemIds", [], { shouldValidate: true });
      setValue("dealRequiredQuantity", null, { shouldValidate: true });
    } else {
      setValue("scopeCategoryIds", [], { shouldValidate: true });
      setValue("scopeCategoryRules", [], { shouldValidate: true });
    }
  };

  return (
    <PageWrapper title={title}>
      <form
        onSubmit={handleSubmit(onSubmit, showFirstValidationError)}
        className="space-y-8"
        noValidate
      >
        <Section label={t("setupBasicInfo")}>
          <div className="rounded-xl border border-primary/10 bg-primary/5 p-4 text-sm text-gray-600">
            <span className="font-medium text-gray-900">
              {isFlexibleDeal ? t("flexibleAnyNDeal") : t("fixedItemDeal")}
            </span>{" "}
            {isFlexibleDeal ? t("flexibleAnyNDealDescription") : t("fixedItemDealDescription")}
          </div>

          <Controller
            control={control}
            name="title"
            render={({ field, fieldState }) => (
              <FormInput
                label={t("dealTitle")}
                placeholder={t("dealTitlePlaceholder")}
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

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Controller
              control={control}
              name="thumbnailUrl"
              render={({ field, fieldState }) => (
                <ImageUploadField<AdminDealFormValues>
                  name="thumbnailUrl"
                  label={t("thumbnail")}
                  value={field.value}
                  error={fieldState.error?.message}
                  setValue={setValue}
                  previewAlt={t("thumbnailPreviewAlt")}
                  disabled={submitting}
                />
              )}
            />

            <Controller
              control={control}
              name="imageUrl"
              render={({ field, fieldState }) => (
                <ImageUploadField<AdminDealFormValues>
                  name="imageUrl"
                  label={t("imageUrl")}
                  value={field.value}
                  error={fieldState.error?.message}
                  setValue={setValue}
                  previewAlt={t("imagePreviewAlt")}
                  disabled={submitting}
                />
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Controller
              control={control}
              name="dealSelectionMode"
              render={({ field, fieldState }) => (
                <SelectField
                  label={t("dealType")}
                  value={field.value}
                  error={fieldState.error?.message}
                  options={[
                    { label: t("fixedItemDeal"), value: "FIXED_ITEMS" },
                    { label: t("flexibleAnyNDeal"), value: "FLEXIBLE_ITEMS" },
                  ]}
                  onChange={(value) =>
                    handleDealTypeChange(
                      value === "FLEXIBLE_ITEMS" ? "FLEXIBLE_ITEMS" : "FIXED_ITEMS"
                    )
                  }
                />
              )}
            />

            {isFlexibleDeal ? (
              <Controller
                control={control}
                name="dealSourceType"
                render={({ field, fieldState }) => (
                  <SelectField
                    label={t("dealSource")}
                    value={field.value}
                    error={fieldState.error?.message}
                    options={[
                      { label: t("sourceItems"), value: "ITEMS" },
                      { label: t("sourceCategories"), value: "CATEGORIES" },
                    ]}
                    onChange={(value) =>
                      handleSourceTypeChange(value === "CATEGORIES" ? "CATEGORIES" : "ITEMS")
                    }
                  />
                )}
              />
            ) : null}
          </div>

          {isFlexibleDeal && !isCategorySource ? (
            <Controller
              control={control}
              name="dealRequiredQuantity"
              render={({ field, fieldState }) => (
                <NumberField
                  label={t("requiredQuantity")}
                  value={field.value}
                  min={1}
                  step={1}
                  placeholder={t("requiredQuantityPlaceholder")}
                  error={fieldState.error?.message}
                  onChange={field.onChange}
                />
              )}
            />
          ) : null}

          {isCategorySource ? (
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800">
              {t("categoryRulesRequiredQuantity", {
                count: categoryRuleTotal,
              })}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Controller
              control={control}
              name="discountValue"
              render={({ field, fieldState }) => (
                <NumberField
                  label={t("fixedDealPrice")}
                  value={field.value}
                  min={0}
                  placeholder={t("fixedDealPricePlaceholder")}
                  error={fieldState.error?.message}
                  onChange={field.onChange}
                />
              )}
            />

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
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Controller
              control={control}
              name="startsAt"
              render={({ field, fieldState }) => (
                <DateField
                  label={t("startsAtOptional")}
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
                  label={t("expiresAtOptional")}
                  value={field.value}
                  error={fieldState.error?.message}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
            {hasCustomDealWindow
              ? t("optionalDateWindowHelp")
              : t("permanentDealHelp")}
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
                {t("activeDeal")}
              </label>
            )}
          />
        </Section>

        <Section label={isCategorySource ? t("selectedCategories") : t("selectedMenuItems")}>
          {isCategorySource ? (
            <>
              <Controller
                control={control}
                name="scopeCategoryIds"
                render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label className="text-[16px]">{t("selectCategories")}</Label>
                    <p className={MUTED_TEXT_SM_CLASS}>
                      {t("flexibleCategoryHelp")}
                    </p>
                    <AdminDealCategorySelector
                      value={field.value}
                      onChange={field.onChange}
                      restaurantId={restaurantId}
                      branchId={branchId}
                      initialCategories={initialCategories}
                      onSelectionOptionsChange={setSelectedCategoryOptions}
                      error={fieldState.error?.message}
                    />
                  </div>
                )}
              />
              <Controller
                control={control}
                name="scopeCategoryRules"
                render={({ field, fieldState }) => (
                  <CategoryRulesEditor
                    categoryIds={scopeCategoryIds}
                    categories={selectedCategoryOptions}
                    rules={field.value}
                    initialVariationOptions={initialVariationOptions}
                    fetchVariationOptions={fetchVariationOptions}
                    error={fieldState.error?.message}
                    labels={{
                      title: t("categoryRulesTitle"),
                      description: t("categoryRulesDescription"),
                      itemLimit: t("itemLimit"),
                      itemLimitPlaceholder: t("itemLimitPlaceholder"),
                      forcedVariation: t("forcedVariation"),
                      noForcedVariation: t("noForcedVariation"),
                      categoryFallback: t("categoryFallback"),
                    }}
                    onChange={field.onChange}
                  />
                )}
              />
            </>
          ) : (
            <Controller
              control={control}
              name="scopeMenuItemIds"
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label className="text-[16px]">{t("selectMenuItems")}</Label>
                  <p className={MUTED_TEXT_SM_CLASS}>
                    {isFlexibleDeal ? t("flexibleItemsHelp") : t("fixedItemsHelp")}
                  </p>
                  <AdminDealMenuItemSelector
                    value={field.value}
                    onChange={field.onChange}
                    restaurantId={restaurantId}
                    initialItems={initialMenuItems}
                    error={fieldState.error?.message}
                  />
                </div>
              )}
            />
          )}
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

type VariationOption = {
  id: string;
  name: string;
};

type CategoryRulesEditorProps = {
  categoryIds: string[];
  categories: AdminDealCategorySummary[];
  rules: AdminDealCategoryRuleFormValues[];
  initialVariationOptions: VariationOption[];
  fetchVariationOptions: (params: {
    categoryId: string;
    search: string;
    page: number;
  }) => Promise<{ data: VariationOption[] }>;
  error?: string;
  labels: {
    title: string;
    description: string;
    itemLimit: string;
    itemLimitPlaceholder: string;
    forcedVariation: string;
    noForcedVariation: string;
    categoryFallback: string;
  };
  onChange: (rules: AdminDealCategoryRuleFormValues[]) => void;
};

function CategoryRulesEditor({
  categoryIds,
  categories,
  rules,
  initialVariationOptions,
  fetchVariationOptions,
  error,
  labels,
  onChange,
}: CategoryRulesEditorProps) {
  if (categoryIds.length === 0) return null;

  const getCategoryName = (categoryId: string) => {
    return (
      categories.find((category) => category.id === categoryId)?.name ||
      `${labels.categoryFallback} ${categoryId}`
    );
  };

  const updateRule = (
    categoryId: string,
    patch: Partial<AdminDealCategoryRuleFormValues>
  ) => {
    const nextRules = rules.map((rule) =>
      rule.menuCategoryId === categoryId ? { ...rule, ...patch } : rule
    );
    onChange(nextRules);
  };

  return (
    <div className="space-y-3 rounded-[14px] border border-gray-200 bg-white p-4">
      <div>
        <p className="text-sm font-semibold text-gray-900">{labels.title}</p>
        <p className="mt-1 text-xs leading-5 text-gray-500">
          {labels.description}
        </p>
      </div>

      <div className="space-y-3">
        {categoryIds.map((categoryId) => {
          const rule =
            rules.find((item) => item.menuCategoryId === categoryId) ?? {
              menuCategoryId: categoryId,
              itemLimit: 1,
              variationId: "",
            };

          return (
            <div
              key={categoryId}
              className="grid gap-3 rounded-[12px] border border-gray-100 bg-[#FAFAFA] p-3 md:grid-cols-[minmax(0,1fr)_140px_minmax(180px,220px)] md:items-end"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {getCategoryName(categoryId)}
                </p>
                <p className="mt-1 truncate text-xs text-gray-400">
                  {categoryId}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">{labels.itemLimit}</Label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={rule.itemLimit ?? ""}
                  placeholder={labels.itemLimitPlaceholder}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    updateRule(categoryId, {
                      itemLimit: nextValue === "" ? null : Number(nextValue),
                    });
                  }}
                  className={INPUT_BASE_CLASS}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">{labels.forcedVariation}</Label>
                <CategoryVariationSelect
                  categoryId={categoryId}
                  value={rule.variationId ?? ""}
                  initialVariationOptions={initialVariationOptions}
                  fetchVariationOptions={fetchVariationOptions}
                  labels={{
                    forcedVariation: labels.forcedVariation,
                    noForcedVariation: labels.noForcedVariation,
                  }}
                  onChange={(variationId) =>
                    updateRule(categoryId, {
                      variationId,
                    })
                  }
                />
                {rule.variationId ? (
                  <button
                    type="button"
                    className="text-xs font-medium text-gray-500 hover:text-gray-800"
                    onClick={() =>
                      updateRule(categoryId, {
                        variationId: "",
                      })
                    }
                  >
                    {labels.noForcedVariation}
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {error ? <p className={FIELD_ERROR_CLASS}>{error}</p> : null}
    </div>
  );
}

type CategoryVariationSelectProps = {
  categoryId: string;
  value: string;
  initialVariationOptions: VariationOption[];
  fetchVariationOptions: (params: {
    categoryId: string;
    search: string;
    page: number;
  }) => Promise<{ data: VariationOption[] }>;
  labels: {
    forcedVariation: string;
    noForcedVariation: string;
  };
  onChange: (variationId: string) => void;
};

function CategoryVariationSelect({
  categoryId,
  value,
  initialVariationOptions,
  fetchVariationOptions,
  labels,
  onChange,
}: CategoryVariationSelectProps) {
  const onChangeRef = useRef(onChange);
  const [selectedVariationOption, setSelectedVariationOption] =
    useState<VariationOption | null>(() => {
      if (!value) return null;

      return (
        initialVariationOptions.find((variation) => variation.id === value) ?? {
          id: value,
          name: value,
        }
      );
    });

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!value) {
      setSelectedVariationOption(null);
      return;
    }

    const initialOption = initialVariationOptions.find(
      (variation) => variation.id === value
    );
    if (initialOption) {
      setSelectedVariationOption(initialOption);
    }
  }, [initialVariationOptions, value]);

  useEffect(() => {
    if (!value) return;

    let cancelled = false;

    const validateSelectedVariation = async () => {
      let response: { data: VariationOption[] };
      try {
        response = await fetchVariationOptions({
          categoryId,
          search: "",
          page: 1,
        });
      } catch {
        return;
      }

      if (cancelled) return;
      const categoryVariation = response.data.find(
        (variation) => variation.id === value
      );

      if (categoryVariation) {
        setSelectedVariationOption(categoryVariation);
        return;
      }

      setSelectedVariationOption(null);
      onChangeRef.current("");
    };

    validateSelectedVariation();

    return () => {
      cancelled = true;
    };
  }, [categoryId, fetchVariationOptions, value]);

  return (
    <AsyncSelect
      value={selectedVariationOption}
      placeholder={labels.noForcedVariation}
      searchPlaceholder={labels.forcedVariation}
      noResultsText={labels.noForcedVariation}
      fetchOptions={({ search, page }) =>
        fetchVariationOptions({
          categoryId,
          search,
          page,
        })
      }
      onChange={(variation: VariationOption | null) => {
        setSelectedVariationOption(variation);
        onChange(variation?.id ?? "");
      }}
    />
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

type SelectFieldProps = {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  error?: string;
  onChange: (value: string) => void;
};

function SelectField({
  label,
  value,
  options,
  error,
  onChange,
}: SelectFieldProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={INPUT_BASE_CLASS}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <p className={FIELD_ERROR_CLASS}>{error}</p> : null}
    </div>
  );
}

type DateFieldProps = {
  label: string;
  value?: string;
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
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className={INPUT_BASE_CLASS}
      />
      {error ? <p className={FIELD_ERROR_CLASS}>{error}</p> : null}
    </div>
  );
}
