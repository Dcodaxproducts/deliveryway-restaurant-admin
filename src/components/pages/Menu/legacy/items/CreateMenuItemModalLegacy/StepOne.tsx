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

const schema = z.object({
  name: z.string().trim().min(1, "Item name is required"),
  categoryId: z.string().trim().min(1, "Category is required"),

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
  const { token, user, restaurantId: authRestaurantId } = useAuth();
  const { get } = useHttpClient(token);

  const restaurantId =
    authRestaurantId ?? user?.restaurantId ?? getStoredRestaurantId();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

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
        [field]: err.errors?.[0]?.message || "Invalid value",
      }));
    }
  };

  const validateStep = () => {
    const result = parseSchema(schema, {
      name: form?.name || "",
      categoryId: form?.categoryId || "",
      basePrice: form?.basePrice ?? "",
    });

    if (!result.success) {
      setErrors(result.errors);
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
            "Selected Category",
        });
      } catch (error) {
        void error;

        setSelectedCategory({
          id: form.categoryId,
          name:
            form?.category?.name ||
            form?.menuCategory?.name ||
            "Selected Category",
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

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Item Name</Label>

        <Input
          value={form.name || ""}
          placeholder="e.g. Greek Salad"
          onChange={(e) => updateForm("name", e.target.value)}
          onBlur={(e) => validateField("name", e.target.value)}
          className="h-[44px] rounded-[12px] border-gray-300 focus:border-gray-400"
        />

        {errors.name ? (
          <p className="text-xs text-red-500">{errors.name}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label>Select Category</Label>

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
          placeholder="Select category"
          fetchOptions={fetchCategories}
          labelKey="name"
          valueKey="id"
        />

        {errors.categoryId ? (
          <p className="text-xs text-red-500">{errors.categoryId}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label>Description</Label>

        <Textarea
          value={form.description || ""}
          placeholder="Write a short item description"
          onChange={(e) => updateForm("description", e.target.value)}
          className="h-[90px] rounded-[12px] border-gray-300 focus:border-gray-400"
        />
      </div>

      <div className="space-y-2">
        <Label>Base Price</Label>

        <Input
          type="number"
          min={0}
          value={form.basePrice || ""}
          placeholder=""
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

     

        <label className="flex items-center gap-2 rounded-[12px] border border-gray-200 bg-white p-3 text-sm">
          <input
            type="checkbox"
            checked={Boolean(form.supportsSplitPizza)}
            onChange={(e) => updateForm("supportsSplitPizza", e.target.checked)}
            className="accent-primary"
          />

          <span>Supports Split Pizza</span>
        </label>
    
    </div>
  );
});

StepOne.displayName = "StepOne";

export default StepOne;