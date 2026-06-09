"use client";

import {
  useEffect,
  useMemo,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { z } from "zod";
import { parseSchema } from "@/lib/zod-errors";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AsyncSelect from "@/components/ui/AsyncSelect";
import { useHttpClient } from "@/hooks/useHttpClient";
import { useAuth } from "@/hooks/useAuth";
import {
  blockInvalidNumberKeys,
  blockNegativeNumberPaste,
  sanitizeNonNegativeNumber,
} from "@/lib/number-input";
import { useTranslations } from "next-intl";

const schema = z.object({
  name: z.string().trim().min(1, "Item name is required"),
  categoryId: z.string().trim().min(1, "Category is required"),
  pricingMode: z.enum(["SINGLE", "MULTIPLE"]).default("SINGLE"),

  basePrice: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => {
        if (!value) return true;

        const numeric = Number(value);
        return !Number.isNaN(numeric) && numeric >= 0;
      },
      {
        message: "Base price must be a valid non-negative number",
      }
    ),
  deliveryPriceAdjustment: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => {
        if (!value) return true;

        const numeric = Number(value);
        return !Number.isNaN(numeric) && numeric >= 0;
      },
      {
        message: "Delivery price adjustment must be a valid non-negative number",
      }
    ),
  takeawayPriceAdjustment: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => {
        if (!value) return true;

        const numeric = Number(value);
        return !Number.isNaN(numeric) && numeric >= 0;
      },
      {
        message: "Pickup price adjustment must be a valid non-negative number",
      }
    ),
});

type Field = keyof z.infer<typeof schema>;

const normalizeApiArray = (res: any) => {
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.data?.items)) return res.data.items;
  if (Array.isArray(res?.items)) return res.items;
  return [];
};

const getStoredRestaurantId = () => {
  if (typeof window === "undefined") return undefined;

  try {
    const auth = JSON.parse(localStorage.getItem("auth") || "{}");
    return auth?.user?.restaurantId || undefined;
  } catch {
    return undefined;
  }
};

const StepOne = forwardRef(({ form, setForm }: any, ref: any) => {
  const t = useTranslations("menu.itemModal.stepOne");
  const commonT = useTranslations("common");
  const { token, user, restaurantId: authRestaurantId } = useAuth();
  const { get } = useHttpClient(token);

  const restaurantId =
    authRestaurantId ?? user?.restaurantId ?? getStoredRestaurantId();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  const getFieldError = (field: string, fallback?: string) => {
    if (field === "name") return t("itemNameRequired");
    if (field === "categoryId") return t("categoryRequired");
    if (field === "basePrice") return t("basePriceInvalid");
    if (field === "deliveryPriceAdjustment")
      return t("deliveryPriceAdjustmentInvalid");
    if (field === "takeawayPriceAdjustment")
      return t("takeawayPriceAdjustmentInvalid");
    return fallback || t("invalidValue");
  };

  const validateField = (field: Field, value: any) => {
    try {
      schema.shape[field].parse(value);

      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        [field]: getFieldError(field, err.errors?.[0]?.message),
      }));
    }
  };

  const validateStep = () => {
    const result = parseSchema(schema, {
      name: form?.name || "",
      categoryId: form?.categoryId || "",
      pricingMode: form?.pricingMode || "SINGLE",
      basePrice: form?.basePrice ?? "",
      deliveryPriceAdjustment: form?.deliveryPriceAdjustment ?? "",
      takeawayPriceAdjustment: form?.takeawayPriceAdjustment ?? "",
    });

    if (!result.success) {
      setErrors(
        Object.fromEntries(
          Object.entries(result.errors).map(([field, message]) => [
            field,
            getFieldError(field, message),
          ])
        )
      );
      return false;
    }

 

    setErrors({});
    return true;
  };

  useImperativeHandle(ref, () => ({
    validateStep,
  }));

  const fetchCategories = async ({
    search = "",
    page = 1,
  }: {
    search: string;
    page: number;
  }) => {
    if (!restaurantId) {
      return {
        data: [],
        meta: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false,
        },
      };
    }

    const params = new URLSearchParams({
      restaurantId: String(restaurantId),
      page: String(page),
      limit: "10",
    });

    if (search?.trim()) {
      params.set("search", search.trim());
    }

    const res = await get(`/v1/menu/categories?${params.toString()}`);

    return {
      data: normalizeApiArray(res),
      meta: res?.meta || res?.data?.meta || res?.data?.pagination || {},
    };
  };

  useEffect(() => {
    if (!form?.categoryId) {
      setSelectedCategory(null);
      return;
    }

    if (
      selectedCategory?.id &&
      String(selectedCategory.id) === String(form.categoryId)
    ) {
      return;
    }

    const loadSelectedCategory = async () => {
      try {
        const res = await fetchCategories({
          search: "",
          page: 1,
        });

        const matched = res?.data?.find(
          (category: any) => String(category.id) === String(form.categoryId)
        );

        if (matched) {
          setSelectedCategory(matched);
          return;
        }

        setSelectedCategory({
          id: form.categoryId,
          name:
            form?.category?.name ||
            form?.menuCategory?.name ||
            t("selectedCategory"),
        });
      } catch (error) {
        void error;

        setSelectedCategory({
          id: form.categoryId,
          name:
            form?.category?.name ||
            form?.menuCategory?.name ||
            t("selectedCategory"),
        });
      }
    };

    loadSelectedCategory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form?.categoryId]);

  const shouldShowSplitPizzaOption = useMemo(() => {
    const itemName = String(form?.name || "").toLowerCase();
    const categoryName = String(selectedCategory?.name || "").toLowerCase();

    return itemName.includes("pizza") || categoryName.includes("pizza");
  }, [form?.name, selectedCategory?.name]);

  const updateForm = (key: string, value: any) => {
    setForm((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  };

  const pricingMode = form?.pricingMode === "MULTIPLE" ? "MULTIPLE" : "SINGLE";
  const basePrice = Number(form?.basePrice || 0);
  const deliveryAdjustment = Number(form?.deliveryPriceAdjustment || 0);
  const pickupAdjustment = Number(form?.takeawayPriceAdjustment || 0);
  const deliveryPreview = basePrice + deliveryAdjustment;
  const pickupPreview = basePrice + pickupAdjustment;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>{t("itemName")}</Label>

        <Input
          value={form.name || ""}
          placeholder={t("itemNamePlaceholder")}
          onChange={(e) => updateForm("name", e.target.value)}
          onBlur={(e) => validateField("name", e.target.value)}
          className="h-[44px] rounded-[12px] border-gray-300 focus:border-gray-400"
        />

        {errors.name ? (
          <p className="text-xs text-red-500">{errors.name}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label>{t("selectCategory")}</Label>

        <AsyncSelect
          value={selectedCategory}
          onChange={(value) => {
            setSelectedCategory(value);

            const categoryId = String(value?.id || "");

            setForm((prev: any) => ({
              ...prev,
              categoryId,
            }));

            validateField("categoryId", categoryId);
          }}
          placeholder={t("selectCategoryPlaceholder")}
          fetchOptions={fetchCategories}
          labelKey="name"
          valueKey="id"
        />

        {errors.categoryId ? (
          <p className="text-xs text-red-500">{errors.categoryId}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label>{commonT("description")}</Label>

        <Textarea
          value={form.description || ""}
          placeholder={t("descriptionPlaceholder")}
          onChange={(e) => updateForm("description", e.target.value)}
          className="h-[90px] rounded-[12px] border-gray-300 focus:border-gray-400"
        />
      </div>

      <div className="rounded-[18px] border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {t("pricingTitle")}
            </h3>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              {t("pricingDescription")}
            </p>
          </div>

          <div className="grid grid-cols-2 rounded-[14px] bg-gray-100 p-1 text-xs font-semibold text-gray-600">
            {(["SINGLE", "MULTIPLE"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  updateForm("pricingMode", mode);

                  if (mode === "SINGLE") {
                    updateForm("deliveryPriceAdjustment", "");
                    updateForm("takeawayPriceAdjustment", "");
                  }
                }}
                className={`rounded-[11px] px-3 py-2 transition ${
                  pricingMode === mode
                    ? "bg-white text-gray-950 shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {mode === "SINGLE" ? t("singlePricing") : t("multiplePricing")}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>{t("basePrice")}</Label>

            <Input
              type="number"
              min={0}
              value={form.basePrice || ""}
              placeholder="0"
              onKeyDown={blockInvalidNumberKeys}
              onPaste={blockNegativeNumberPaste}
              onChange={(e) => {
                const value = sanitizeNonNegativeNumber(e.target.value);
                updateForm("basePrice", value);
              }}
              onBlur={(e) =>
                validateField(
                  "basePrice",
                  sanitizeNonNegativeNumber(e.target.value)
                )
              }
              className="h-[44px] rounded-[12px] border-gray-300 focus:border-gray-400"
            />

            {errors.basePrice ? (
              <p className="text-xs text-red-500">{errors.basePrice}</p>
            ) : null}
          </div>

          {pricingMode === "MULTIPLE" ? (
            <>
              <div className="space-y-2">
                <Label>{t("deliveryPriceAdjustment")}</Label>

                <Input
                  type="number"
                  min={0}
                  value={form.deliveryPriceAdjustment || ""}
                  placeholder="0"
                  onKeyDown={blockInvalidNumberKeys}
                  onPaste={blockNegativeNumberPaste}
                  onChange={(e) =>
                    updateForm(
                      "deliveryPriceAdjustment",
                      sanitizeNonNegativeNumber(e.target.value)
                    )
                  }
                  onBlur={(e) =>
                    validateField(
                      "deliveryPriceAdjustment",
                      sanitizeNonNegativeNumber(e.target.value)
                    )
                  }
                  className="h-[44px] rounded-[12px] border-gray-300 focus:border-gray-400"
                />

                {errors.deliveryPriceAdjustment ? (
                  <p className="text-xs text-red-500">
                    {errors.deliveryPriceAdjustment}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>{t("takeawayPriceAdjustment")}</Label>

                <Input
                  type="number"
                  min={0}
                  value={form.takeawayPriceAdjustment || ""}
                  placeholder="0"
                  onKeyDown={blockInvalidNumberKeys}
                  onPaste={blockNegativeNumberPaste}
                  onChange={(e) =>
                    updateForm(
                      "takeawayPriceAdjustment",
                      sanitizeNonNegativeNumber(e.target.value)
                    )
                  }
                  onBlur={(e) =>
                    validateField(
                      "takeawayPriceAdjustment",
                      sanitizeNonNegativeNumber(e.target.value)
                    )
                  }
                  className="h-[44px] rounded-[12px] border-gray-300 focus:border-gray-400"
                />

                {errors.takeawayPriceAdjustment ? (
                  <p className="text-xs text-red-500">
                    {errors.takeawayPriceAdjustment}
                  </p>
                ) : null}
              </div>
            </>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-[14px] border border-emerald-100 bg-emerald-50 px-4 py-3">
            <p className="text-xs font-medium text-emerald-700">
              {t("deliveryPricePreview")}
            </p>
            <p className="mt-1 text-lg font-semibold text-emerald-950">
              {deliveryPreview.toLocaleString()}
            </p>
          </div>

          <div className="rounded-[14px] border border-sky-100 bg-sky-50 px-4 py-3">
            <p className="text-xs font-medium text-sky-700">
              {t("pickupPricePreview")}
            </p>
            <p className="mt-1 text-lg font-semibold text-sky-950">
              {pickupPreview.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {shouldShowSplitPizzaOption ? (
        <label className="flex items-center gap-2 rounded-[12px] border border-gray-200 bg-white p-3 text-sm">
          <input
            type="checkbox"
            checked={Boolean(form.supportsSplitPizza)}
            onChange={(e) => updateForm("supportsSplitPizza", e.target.checked)}
            className="accent-primary"
          />

          <span>{t("supportsSplitPizza")}</span>
        </label>
      ) : null}
    </div>
  );
});

StepOne.displayName = "StepOne";

export default StepOne;
