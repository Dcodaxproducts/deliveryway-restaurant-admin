"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import {
  Controller,
  useForm,
  useWatch,
  type FieldErrors,
} from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import FormInput from "@/components/forms/common/FormInput";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Time24Picker } from "@/components/ui/time-24-picker";
import PageWrapper from "@/components/pages/Promotions/forms/PageWrapper";
import Section from "@/components/pages/Promotions/forms/Section";
import AsyncMultiSelect from "@/components/ui/AsyncMultiSelect";

import { useAuth } from "@/hooks/useAuth";
import {
  useCreateAdminHappyHour,
  useGetAdminHappyHourDetail,
  useUpdateAdminHappyHour,
} from "@/hooks/usePromotions";

import { getMenuItems } from "@/services/menu/menu.api";
import { getMenuCategories } from "@/services/menu/categories/menu-categories.api";
import { getApiErrorMessage } from "@/lib/errors";
import { getLocalTodayInputValue } from "@/lib/date-input";
import {
  getIds,
  getString,
  normalizeDetail,
  normalizeSelectedOptions,
} from "@/components/pages/Promotions/utils/option-normalizers";
import {
  happyHourSchema,
  type HappyHourFormValues,
} from "@/validations/promotions";
import {
  FIELD_ERROR_CLASS,
  INPUT_BASE_CLASS,
  MUTED_TEXT_SM_CLASS,
} from "@/components/common/common-classes";

const defaultValues: HappyHourFormValues = {
  code: "",
  title: "",
  description: "",
  audience: "BOTH",
  discountType: "FLAT",
  discountValue: "",
  maxDiscountAmount: "",
  minOrderAmount: "",
  maxUses: "",
  maxUsesPerCustomer: "",
  startsAt: "",
  expiresAt: "",
  isActive: true,
  applyMode: "ORDER_TOTAL",
  activeDays: [0, 1, 2, 3, 4, 5, 6],
  dailyStartTime: "",
  dailyEndTime: "",
  selectedMenuItems: [],
  selectedCategories: [],
};

const toDateInput = (value?: string | null) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 10);
};

const toDateISOStringOrNull = (value: string, boundary: "start" | "end") => {
  if (!value) return null;

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) return null;

  const date = new Date(year, month - 1, day);

  if (boundary === "end") {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }

  return date.toISOString();
};

const toOptionalNumber = (value: string) => {
  if (!value.trim()) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
};

export default function AddHappyHour() {
  const t = useTranslations("promotions");
  const router = useRouter();
  const searchParams = useSearchParams();
  const minimumDate = useMemo(() => getLocalTodayInputValue(), []);
  const id = searchParams.get("id");
  const isEditMode = Boolean(id);

  const { user, restaurantId } = useAuth();
  const branchId = user?.branchId ?? "";

  const { control, handleSubmit, reset } = useForm<HappyHourFormValues>({
    resolver: zodResolver(happyHourSchema),
    defaultValues,
  });

  const values = useWatch({ control }) as HappyHourFormValues;

  const { data: detailResponse, isLoading: detailLoading } =
    useGetAdminHappyHourDetail(id ?? undefined, {
      restaurantId,
      branchId,
    });

  const createMutation = useCreateAdminHappyHour();
  const updateMutation = useUpdateAdminHappyHour();

  const submitting = createMutation.isPending || updateMutation.isPending;
  const pageTitle = isEditMode ? t("updateHappyHour") : t("addHappyHour");
  const days = [
    { label: t("days.sunday"), value: 0 },
    { label: t("days.monday"), value: 1 },
    { label: t("days.tuesday"), value: 2 },
    { label: t("days.wednesday"), value: 3 },
    { label: t("days.thursday"), value: 4 },
    { label: t("days.friday"), value: 5 },
    { label: t("days.saturday"), value: 6 },
  ];
  const validationMessages: Record<string, string> = {
    "Discount value must be greater than 0.": t(
      "validation.discountValueGreaterThanZero",
    ),
    "Discount value is required.": t("validation.discountValueRequired"),
    "Start date is required.": t("validation.startDateRequired"),
    "Percentage discount cannot be greater than 100.": t(
      "validation.percentageDiscountMax",
    ),
    "Expiry date is required.": t("validation.expiryDateRequired"),
    "Expiry date must be after start date.": t("validation.expiryAfterStart"),
    "Happy hour title is required.": t("validation.happyHourTitleRequired"),
    "Please select at least one active day.": t("validation.activeDayRequired"),
    "Daily start time is required.": t("validation.dailyStartRequired"),
    "Daily end time is required.": t("validation.dailyEndRequired"),
    "Daily end time must be after daily start time.": t(
      "validation.dailyEndAfterStart",
    ),
  };
  const translateValidation = (message?: string) =>
    message ? (validationMessages[message] ?? message) : undefined;
  const showTranslatedValidationError = (
    errors: FieldErrors<HappyHourFormValues>,
  ) => {
    const firstError = Object.values(errors).find((error) => error?.message);
    if (typeof firstError?.message === "string") {
      toast.error(translateValidation(firstError.message));
    }
  };

  useEffect(() => {
    if (!isEditMode || !detailResponse) return;

    const detail = normalizeDetail(detailResponse);
    if (!detail) return;

    reset({
      code: getString(detail, "code") ?? "",
      title: getString(detail, "title") ?? "",
      description: getString(detail, "description") ?? "",
      audience: detail.audience === "REGISTERED" ? "REGISTERED" : "BOTH",
      discountType:
        detail.discountType === "PERCENTAGE" ? "PERCENTAGE" : "FLAT",
      discountValue: String(detail.discountValue ?? ""),
      maxDiscountAmount: String(detail.maxDiscountAmount ?? ""),
      minOrderAmount: String(detail.minOrderAmount ?? ""),
      maxUses: String(detail.maxUses ?? ""),
      maxUsesPerCustomer: String(detail.maxUsesPerCustomer ?? ""),
      startsAt: toDateInput(getString(detail, "startsAt")),
      expiresAt: toDateInput(getString(detail, "expiresAt")),
      isActive: Boolean(detail.isActive),
      applyMode:
        detail.applyMode === "SCOPED_ITEMS" ? "SCOPED_ITEMS" : "ORDER_TOTAL",
      activeDays:
        Array.isArray(detail.activeDays) && detail.activeDays.length > 0
          ? detail.activeDays.filter(
              (day): day is number => typeof day === "number",
            )
          : [0, 1, 2, 3, 4, 5, 6],
      dailyStartTime: getString(detail, "dailyStartTime") ?? "",
      dailyEndTime: getString(detail, "dailyEndTime") ?? "",
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
    const trimmedCode = values.code.trim();

    const maxDiscountAmount = toOptionalNumber(values.maxDiscountAmount);
    const minOrderAmount = toOptionalNumber(values.minOrderAmount);
    const maxUses = toOptionalNumber(values.maxUses);
    const maxUsesPerCustomer = toOptionalNumber(values.maxUsesPerCustomer);
    const scopeMenuItemIds =
      values.applyMode === "SCOPED_ITEMS"
        ? getIds(values.selectedMenuItems)
        : [];
    const scopeCategoryIds =
      values.applyMode === "SCOPED_ITEMS"
        ? getIds(values.selectedCategories)
        : [];

    return {
      ...(trimmedCode ? { code: trimmedCode } : {}),
      title: values.title.trim(),
      description: values.description.trim(),
      restaurantId,
      branchId: branchId || null,
      audience: values.audience,
      discountType: values.discountType,
      discountValue: toOptionalNumber(values.discountValue) ?? 0,
      ...(maxDiscountAmount !== undefined ? { maxDiscountAmount } : {}),
      ...(minOrderAmount !== undefined ? { minOrderAmount } : {}),
      ...(maxUses !== undefined ? { maxUses } : {}),
      ...(maxUsesPerCustomer !== undefined ? { maxUsesPerCustomer } : {}),
      startsAt: toDateISOStringOrNull(values.startsAt, "start"),
      expiresAt: toDateISOStringOrNull(values.expiresAt, "end"),
      applyMode: values.applyMode,
      scopeMenuItemIds,
      scopeCategoryIds,
      scopeMenuItemId: scopeMenuItemIds[0] ?? null,
      scopeCategoryId: scopeCategoryIds[0] ?? null,
      isActive: values.isActive,
      activeDays: values.activeDays,
      dailyStartTime: values.dailyStartTime,
      dailyEndTime: values.dailyEndTime,
    };
  }, [branchId, restaurantId, values]);

  const onSubmit = async () => {
    if (!restaurantId) {
      toast.error(t("toasts.restaurantIdMissing"));
      return;
    }

    try {
      if (isEditMode && id) {
        await updateMutation.mutateAsync({ id, payload });
        toast.success(t("toasts.happyHourUpdated"));
      } else {
        await createMutation.mutateAsync(payload);
        toast.success(t("toasts.happyHourCreated"));
      }

      router.push("/promotion-management");
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, t("toasts.somethingWentWrong")));
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
      <form
        onSubmit={handleSubmit(onSubmit, showTranslatedValidationError)}
        className="space-y-8"
        noValidate
      >
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {t("forms.happyHourActivePrompt")}
              </p>
              <Switch
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(Boolean(checked))}
              />
            </div>
          )}
        />

        <Section label={t("forms.setupBasicInfo")}>
          <Controller
            control={control}
            name="code"
            render={({ field, fieldState }) => (
              <FormInput
                label={t("forms.happyHourCode")}
                placeholder={t("forms.happyHourCodePlaceholder")}
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
            name="title"
            render={({ field, fieldState }) => (
              <FormInput
                label={t("forms.happyHourTitle")}
                placeholder={t("forms.happyHourTitlePlaceholder")}
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
            name="description"
            render={({ field }) => (
              <div className="space-y-2">
                <Label>{t("forms.description")}</Label>
                <textarea
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder={t("forms.happyHourDescriptionPlaceholder")}
                  className="min-h-[110px] w-full rounded-md border border-[#BBBBBB] px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            )}
          />

          <Controller
            control={control}
            name="audience"
            render={({ field }) => (
              <div className="space-y-2">
                <Label>{t("forms.audience")}</Label>
                <select
                  value={field.value}
                  onChange={field.onChange}
                  className="h-[44px] w-full rounded-md border border-[#BBBBBB] bg-white px-4 text-sm"
                >
                  <option value="BOTH">{t("forms.audienceBoth")}</option>
                  <option value="REGISTERED">
                    {t("forms.audienceRegistered")}
                  </option>
                </select>
              </div>
            )}
          />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Controller
              control={control}
              name="startsAt"
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>{t("forms.startsAt")}</Label>
                  <Input
                    type="date"
                    min={minimumDate}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    className={INPUT_BASE_CLASS}
                  />
                  {fieldState.error?.message ? (
                    <p className={FIELD_ERROR_CLASS}>
                      {translateValidation(fieldState.error.message)}
                    </p>
                  ) : null}
                </div>
              )}
            />

            <Controller
              control={control}
              name="expiresAt"
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>{t("forms.expiresAt")}</Label>
                  <Input
                    type="date"
                    min={minimumDate}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    className={INPUT_BASE_CLASS}
                  />
                  {fieldState.error?.message ? (
                    <p className={FIELD_ERROR_CLASS}>
                      {translateValidation(fieldState.error.message)}
                    </p>
                  ) : null}
                </div>
              )}
            />
          </div>

          <Controller
            control={control}
            name="activeDays"
            render={({ field, fieldState }) => (
              <div className="space-y-3">
                <Label className="text-[15px] font-medium">
                  {t("forms.activeDays")}
                </Label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {days.map((day) => {
                    const checked = field.value.includes(day.value);
                    return (
                      <label
                        key={day.value}
                        className="flex items-center gap-2 text-sm text-gray-600"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => {
                            field.onChange(
                              checked
                                ? field.value.filter(
                                    (item) => item !== day.value,
                                  )
                                : [...field.value, day.value].sort(
                                    (a, b) => a - b,
                                  ),
                            );
                          }}
                        />
                        {day.label}
                      </label>
                    );
                  })}
                </div>
                {fieldState.error?.message ? (
                  <p className={FIELD_ERROR_CLASS}>
                    {translateValidation(fieldState.error.message)}
                  </p>
                ) : null}
              </div>
            )}
          />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Controller
              control={control}
              name="dailyStartTime"
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>{t("forms.dailyStartTime")}</Label>
                  <Time24Picker
                    value={field.value}
                    onChange={field.onChange}
                    className={INPUT_BASE_CLASS}
                    required
                    error={fieldState.error?.message}
                  />
                  {fieldState.error?.message ? (
                    <p className={FIELD_ERROR_CLASS}>
                      {translateValidation(fieldState.error.message)}
                    </p>
                  ) : null}
                </div>
              )}
            />

            <Controller
              control={control}
              name="dailyEndTime"
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>{t("forms.dailyEndTime")}</Label>
                  <Time24Picker
                    value={field.value}
                    onChange={field.onChange}
                    className={INPUT_BASE_CLASS}
                    required
                    error={fieldState.error?.message}
                  />
                  {fieldState.error?.message ? (
                    <p className={FIELD_ERROR_CLASS}>
                      {translateValidation(fieldState.error.message)}
                    </p>
                  ) : null}
                </div>
              )}
            />
          </div>
        </Section>

        <Section label={t("forms.discountSetup")}>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Controller
              control={control}
              name="discountType"
              render={({ field }) => (
                <div className="space-y-2">
                  <Label>{t("forms.discountType")}</Label>
                  <select
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    className="h-[52px] w-full rounded-md border border-[#BBBBBB] bg-white px-4 text-base outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="FLAT">{t("forms.flatDiscount")}</option>
                    <option value="PERCENTAGE">
                      {t("forms.percentageDiscount")}
                    </option>
                  </select>
                </div>
              )}
            />

            <Controller
              control={control}
              name="discountValue"
              render={({ field, fieldState }) => (
                <FormInput
                  label={t("forms.discountValue")}
                  type="number"
                  placeholder={t("forms.discountValuePlaceholder")}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={Boolean(fieldState.error)}
                  errorText={translateValidation(fieldState.error?.message)}
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
                  label={t("forms.minimumOrderAmount")}
                  type="number"
                  placeholder={t("forms.minimumOrderAmountPlaceholder")}
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
                  label={t("forms.maximumDiscountAmount")}
                  type="number"
                  placeholder={t("forms.maximumDiscountAmountPlaceholder")}
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
                  label={t("forms.maximumUses")}
                  type="number"
                  placeholder={t("forms.maximumUsesPlaceholder")}
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
                  label={t("forms.maximumUsesPerCustomer")}
                  type="number"
                  placeholder={t("forms.maximumUsesPerCustomerPlaceholder")}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
          </div>
        </Section>

        <Section label={t("forms.happyHourScope")}>
          <Controller
            control={control}
            name="applyMode"
            render={({ field }) => (
              <div className="space-y-2">
                <Label>{t("forms.applyMode")}</Label>
                <select
                  value={field.value}
                  onChange={field.onChange}
                  className="h-[44px] w-full rounded-md border border-[#BBBBBB] bg-white px-4 text-sm"
                >
                  <option value="ORDER_TOTAL">
                    {t("forms.orderTotalMode")}
                  </option>
                  <option value="SCOPED_ITEMS">
                    {t("forms.scopedItemsMode")}
                  </option>
                </select>
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
                    <Label>{t("forms.selectFoodItems")}</Label>
                    <AsyncMultiSelect
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t("forms.selectFoodItemsPlaceholder")}
                      fetchOptions={fetchMenuItemOptions}
                      labelKey="name"
                      valueKey="id"
                    />
                  </div>
                )}
              />
              <Controller
                control={control}
                name="selectedCategories"
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label>{t("forms.selectFoodCategories")}</Label>
                    <AsyncMultiSelect
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t("forms.selectFoodCategoriesPlaceholder")}
                      fetchOptions={fetchCategoryOptions}
                      labelKey="name"
                      valueKey="id"
                    />
                  </div>
                )}
              />
            </>
          ) : null}

          <p className={MUTED_TEXT_SM_CLASS}>{t("forms.happyHourScopeHelp")}</p>
        </Section>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={submitting}
            className="h-[44px] rounded-lg border px-6 text-sm font-medium text-gray-600 disabled:opacity-60"
          >
            {t("actions.cancel")}
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-[44px] items-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {isEditMode ? t("updateHappyHour") : t("createHappyHour")}
          </button>
        </div>
      </form>
    </PageWrapper>
  );
}
