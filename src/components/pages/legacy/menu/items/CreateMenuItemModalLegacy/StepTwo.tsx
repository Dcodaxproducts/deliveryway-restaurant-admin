"use client";

import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { z } from "zod";
import { validateSchema } from "@/lib/zod-errors";
import {
  AlertCircle,
  Info,
  ListChecks,
  Loader2,
  PackageCheck,
  Tags,
} from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ImageDropzoneUpload from "@/components/ui/ImageDropzoneUpload";
import AsyncMultiSelect from "@/components/ui/AsyncMultiSelect";

import { useAuth } from "@/hooks/useAuth";
import { useGetAllergenAdditiveTemplates } from "@/hooks/useAllergen";
import { useGetMenuItemLabels } from "@/hooks/useProductLabel";

import {
  blockInvalidNumberKeys,
  blockNegativeNumberPaste,
  sanitizeNonNegativeNumber,
} from "@/lib/number-input";

type Field = keyof z.infer<typeof schema>;

type OptionItem = {
  value?: string;
  code?: string;
  label: string;
};

const schema = z.object({
  prepTimeMinutes: z.string().optional(),
  ingredients: z.string().optional(),
  nutritionalInformation: z.string().optional(),
  deliveryPriceAdjustment: z.string().optional(),
  takeawayPriceAdjustment: z.string().optional(),
  depositAmount: z.string().optional(),
  sortOrder: z.string().optional(),

  minSelect: z.string().optional(),
  maxSelect: z.string().optional(),

  minQuantity: z.string().optional(),
  maxQuantity: z.string().optional(),
});

const PAGE_SIZE = 20;

const normalizeArray = (value: any): string[] => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeLabelOptions = (response: any): OptionItem[] => {
  const candidates = [
    response?.data?.labels,
    response?.data?.items,
    response?.data?.data?.labels,
    response?.data?.data?.items,
    response?.data?.data,
    response?.labels,
    response?.items,
    response?.data,
    response,
  ];

  const raw = candidates.find((candidate) => Array.isArray(candidate));

  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => ({
      value: String(item?.value || "").trim(),
      label: String(item?.label || item?.value || "").trim(),
    }))
    .filter((item) => item.value && item.label);
};

const normalizeAllergenOptions = (response: any): OptionItem[] => {
  const candidates = [
    response?.data?.allergens,
    response?.data?.data?.allergens,
    response?.allergens,
    response?.data?.templates?.allergens,
    response?.templates?.allergens,
  ];

  const raw = candidates.find((candidate) => Array.isArray(candidate));

  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => ({
      code: String(item?.code || "").trim(),
      label: String(item?.label || item?.code || "").trim(),
    }))
    .filter((item) => item.code && item.label);
};

const createLocalFetchOptions =
  ({
    items,
    keys,
  }: {
    items: OptionItem[];
    keys: Array<keyof OptionItem>;
  }) =>
  async ({ search, page }: { search: string; page: number }) => {
    const keyword = search.trim().toLowerCase();

    const filtered = keyword
      ? items.filter((item) =>
          keys.some((key) =>
            String(item?.[key] || "")
              .toLowerCase()
              .includes(keyword)
          )
        )
      : items;

    const start = (page - 1) * PAGE_SIZE;
    const data = filtered.slice(start, start + PAGE_SIZE);

    return {
      data,
      meta: {
        page,
        limit: PAGE_SIZE,
        total: filtered.length,
        hasNext: start + PAGE_SIZE < filtered.length,
      },
    };
  };

const createSelectedOptions = ({
  selectedValues,
  options,
  valueKey,
}: {
  selectedValues: string[];
  options: OptionItem[];
  valueKey: "value" | "code";
}) => {
  return selectedValues.map((selectedValue) => {
    const existing = options.find(
      (option) => String(option?.[valueKey]) === String(selectedValue)
    );

    if (existing) return existing;

    return {
      [valueKey]: selectedValue,
      label: selectedValue,
    };
  });
};

const parseOptionalNumber = (value: any): number | null => {
  if (value === "" || value === undefined || value === null) return null;

  const numeric = Number(value);

  return Number.isFinite(numeric) ? numeric : null;
};

const parseNumber = (value: any, fallback = 0) => {
  if (value === "" || value === undefined || value === null) return fallback;

  const numeric = Number(value);

  return Number.isFinite(numeric) ? numeric : fallback;
};

const getSelectionSummary = ({
  isRequired,
  minSelect,
  maxSelect,
}: {
  isRequired: boolean;
  minSelect: string;
  maxSelect: string;
}) => {
  const min = Number(minSelect || 0);
  const max = parseOptionalNumber(maxSelect);

  if (!isRequired && min === 0 && max === null) {
    return "Add-ons are optional with no maximum selection limit.";
  }

  if (!isRequired && min === 0 && max !== null) {
    return `Add-ons are optional. Customer can select up to ${max}.`;
  }

  if (isRequired && max !== null) {
    return `Add-ons are required. Customer must select at least ${min} and up to ${max}.`;
  }

  if (isRequired && max === null) {
    return `Add-ons are required. Customer must select at least ${min}. No maximum limit.`;
  }

  return `Customer must select at least ${min} add-on option(s).`;
};

const getQuantitySummary = ({
  minQuantity,
  maxQuantity,
}: {
  minQuantity: string;
  maxQuantity: string;
}) => {
  const min = Math.max(1, parseNumber(minQuantity, 1));
  const max = Math.max(min, parseNumber(maxQuantity, min));

  return `Customer can order minimum ${min} and maximum ${max} quantity for this item.`;
};

const StepTwo = forwardRef(({ form, setForm }: any, ref: any) => {
  const { restaurantId: authRestaurantId, user } = useAuth();

  const restaurantId =
    authRestaurantId ??
    user?.restaurantId ??
    user?.tenantId ??
    form?.restaurantId;

  const [errors, setErrors] = useState<any>({});
  const [imageUploading, setImageUploading] = useState(false);

  const { data: labelsResponse, isLoading: labelsLoading } =
    useGetMenuItemLabels(
      restaurantId
        ? {
            restaurantId,
          }
        : undefined
    );

  const { data: allergenTemplatesResponse, isLoading: allergensLoading } =
    useGetAllergenAdditiveTemplates({
      restaurantId: restaurantId || undefined,
    });

  const labelOptions = useMemo(() => {
    return normalizeLabelOptions(labelsResponse);
  }, [labelsResponse]);

  const allergenOptions = useMemo(() => {
    return normalizeAllergenOptions(allergenTemplatesResponse);
  }, [allergenTemplatesResponse]);

  const selectedLabelValues = useMemo(() => {
    return normalizeArray(form.labels);
  }, [form.labels]);

  const selectedAllergenCodeValues = useMemo(() => {
    return normalizeArray(form.allergenCodes);
  }, [form.allergenCodes]);

  const selectedLabelOptions = useMemo(() => {
    return createSelectedOptions({
      selectedValues: selectedLabelValues,
      options: labelOptions,
      valueKey: "value",
    });
  }, [selectedLabelValues, labelOptions]);

  const selectedAllergenOptions = useMemo(() => {
    return createSelectedOptions({
      selectedValues: selectedAllergenCodeValues,
      options: allergenOptions,
      valueKey: "code",
    });
  }, [selectedAllergenCodeValues, allergenOptions]);

  const fetchLabelOptions = useMemo(() => {
    return createLocalFetchOptions({
      items: labelOptions,
      keys: ["value", "label"],
    });
  }, [labelOptions]);

  const fetchAllergenOptions = useMemo(() => {
    return createLocalFetchOptions({
      items: allergenOptions,
      keys: ["code", "label"],
    });
  }, [allergenOptions]);

  const update = (key: string, value: any) => {
    setForm((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleImagePreviewChange = (previewUrl: string) => {
    setForm((prev: any) => {
      if (
        prev.imagePreview?.startsWith("blob:") &&
        prev.imagePreview !== previewUrl
      ) {
        URL.revokeObjectURL(prev.imagePreview);
      }

      return {
        ...prev,
        imagePreview: previewUrl,
      };
    });
  };

  const handleImageUrlChange = (fileUrl: string) => {
    setForm((prev: any) => ({
      ...prev,
      imageUrl: fileUrl,
    }));
  };

  const handleClearImage = () => {
    setForm((prev: any) => {
      if (prev.imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(prev.imagePreview);
      }

      return {
        ...prev,
        imageUrl: "",
        imagePreview: "",
      };
    });
  };

  const validateField = (field: Field, value: any) => {
    try {
      if (
        [
          "prepTimeMinutes",
          "deliveryPriceAdjustment",
          "takeawayPriceAdjustment",
          "depositAmount",
          "sortOrder",
          "minSelect",
          "maxSelect",
          "minQuantity",
          "maxQuantity",
        ].includes(field) &&
        (value === "" || value === null || value === undefined)
      ) {
        setErrors((prev: any) => {
          const copy = { ...prev };
          delete copy[field];
          return copy;
        });
        return;
      }

      schema.shape[field].parse(value);

      setErrors((prev: any) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    } catch (err: any) {
      setErrors((prev: any) => ({
        ...prev,
        [field]: err.errors?.[0]?.message || "Invalid value",
      }));
    }
  };

  const validateSelectionRules = () => {
    const minSelect = Number(form.minSelect || 0);
    const maxSelect = parseOptionalNumber(form.maxSelect);

    if (Number.isNaN(minSelect) || minSelect < 0) {
      setErrors((prev: any) => ({
        ...prev,
        minSelect: "Minimum add-on selection cannot be negative",
      }));
      toast.error("Minimum add-on selection cannot be negative");
      return false;
    }

    if (maxSelect !== null && maxSelect < 0) {
      setErrors((prev: any) => ({
        ...prev,
        maxSelect: "Maximum add-on selection cannot be negative",
      }));
      toast.error("Maximum add-on selection cannot be negative");
      return false;
    }

    if (maxSelect !== null && maxSelect < minSelect) {
      setErrors((prev: any) => ({
        ...prev,
        maxSelect:
          "Maximum add-on selection cannot be less than minimum selection",
      }));
      toast.error(
        "Maximum add-on selection cannot be less than minimum selection"
      );
      return false;
    }

    if (form.isRequired && minSelect < 1) {
      setErrors((prev: any) => ({
        ...prev,
        minSelect: "Required add-ons must have minimum value of at least 1",
      }));
      toast.error("Required add-ons must have minimum value of at least 1");
      return false;
    }

    setErrors((prev: any) => {
      const copy = { ...prev };
      delete copy.minSelect;
      delete copy.maxSelect;
      return copy;
    });

    return true;
  };

  const validateQuantityRules = () => {
    const minQuantity = Number(form.minQuantity || 1);
    const maxQuantity = Number(form.maxQuantity || 0);

    if (Number.isNaN(minQuantity) || minQuantity < 1) {
      setErrors((prev: any) => ({
        ...prev,
        minQuantity: "Minimum item quantity must be at least 1",
      }));
      toast.error("Minimum item quantity must be at least 1");
      return false;
    }

    if (Number.isNaN(maxQuantity) || maxQuantity < 1) {
      setErrors((prev: any) => ({
        ...prev,
        maxQuantity: "Maximum item quantity must be at least 1",
      }));
      toast.error("Maximum item quantity must be at least 1");
      return false;
    }

    if (maxQuantity < minQuantity) {
      setErrors((prev: any) => ({
        ...prev,
        maxQuantity:
          "Maximum item quantity cannot be less than minimum quantity",
      }));
      toast.error("Maximum item quantity cannot be less than minimum quantity");
      return false;
    }

    setErrors((prev: any) => {
      const copy = { ...prev };
      delete copy.minQuantity;
      delete copy.maxQuantity;
      return copy;
    });

    return true;
  };

  const validateStep = () => {
    if (imageUploading) {
      toast.error("Please wait until image upload is complete");
      return false;
    }

    const result = validateSchema(schema, form);

    if (!result.success) {
      setErrors(result.errors);
      return false;
    }

    if (!validateSelectionRules()) {
      return false;
    }

    if (!validateQuantityRules()) {
      return false;
    }

    setErrors({});
    return true;
  };

  useImperativeHandle(ref, () => ({
    validateStep,
  }));

  const noMaximumLimit = form.maxSelect === "" || form.maxSelect === null;

  const selectionSummary = getSelectionSummary({
    isRequired: Boolean(form.isRequired),
    minSelect: form.minSelect || "0",
    maxSelect: form.maxSelect || "",
  });

  const quantitySummary = getQuantitySummary({
    minQuantity: form.minQuantity || "1",
    maxQuantity: form.maxQuantity || "5",
  });

  return (
    <div className="space-y-6">
      <ImageDropzoneUpload
        label="Image"
        value={form.imageUrl}
        previewUrl={form.imagePreview}
        onChange={handleImageUrlChange}
        onPreviewChange={handleImagePreviewChange}
        onClear={handleClearImage}
        onUploadingChange={setImageUploading}
        previewAlt="Item image preview"
      />

      <section className="rounded-[18px] border border-primary/10 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
            <ListChecks size={18} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-950">
              Add-on Selection Rules
            </h3>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              Configure whether add-ons are required and how many add-on options
              a customer can select.
            </p>
          </div>
        </div>

        <div className="rounded-[16px] border border-primary/15 bg-primary/[0.04] p-4">
          <div className="flex items-start gap-3">
            <Info size={18} className="mt-0.5 shrink-0 text-primary" />

            <div>
              <p className="text-sm font-semibold text-gray-950">
                {selectionSummary}
              </p>
              <p className="mt-1 text-xs leading-5 text-gray-600">
                These limits are for add-on selections only. Leave maximum empty
                when there is no maximum add-on limit.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <label className="flex cursor-pointer flex-col gap-3 rounded-[14px] border border-gray-200 bg-[#FAFAFA] p-4 transition hover:border-primary/30 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Required Add-ons
              </p>
              <p className="mt-1 text-xs leading-5 text-gray-500">
                Enable this when the customer must select at least one add-on.
              </p>
            </div>

            <input
              type="checkbox"
              checked={Boolean(form.isRequired)}
              onChange={(event) => {
                const checked = event.target.checked;

                update("isRequired", checked);

                if (checked && Number(form.minSelect || 0) < 1) {
                  update("minSelect", "1");
                }
              }}
              className="h-4 w-4 accent-primary"
            />
          </label>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-900">
              Min Add-on Select
            </Label>

            <Input
              type="number"
              min={0}
              value={form.minSelect ?? "0"}
              onKeyDown={blockInvalidNumberKeys}
              onPaste={blockNegativeNumberPaste}
              onChange={(event) =>
                update(
                  "minSelect",
                  sanitizeNonNegativeNumber(event.target.value)
                )
              }
              onBlur={(event) =>
                validateField(
                  "minSelect",
                  sanitizeNonNegativeNumber(event.target.value)
                )
              }
              placeholder="0"
              className="h-[44px] rounded-[12px] border-gray-300 focus:border-gray-400"
            />

            <p className="text-xs leading-5 text-gray-400">
              Minimum number of add-on options the customer must select.
            </p>

            {errors.minSelect && (
              <p className="text-xs text-red-500">{errors.minSelect}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Label className="text-sm font-semibold text-gray-900">
                Max Add-on Select
              </Label>

              <label className="flex w-fit cursor-pointer items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={noMaximumLimit}
                  onChange={(event) => {
                    if (event.target.checked) {
                      update("maxSelect", "");
                      return;
                    }

                    update("maxSelect", form.minSelect || "1");
                  }}
                  className="accent-primary"
                />
                No maximum limit
              </label>
            </div>

            <Input
              type="number"
              min={0}
              value={form.maxSelect ?? ""}
              disabled={noMaximumLimit}
              onKeyDown={blockInvalidNumberKeys}
              onPaste={blockNegativeNumberPaste}
              onChange={(event) =>
                update(
                  "maxSelect",
                  sanitizeNonNegativeNumber(event.target.value)
                )
              }
              onBlur={(event) =>
                validateField(
                  "maxSelect",
                  sanitizeNonNegativeNumber(event.target.value)
                )
              }
              placeholder="No maximum"
              className="h-[44px] rounded-[12px] border-gray-300 focus:border-gray-400 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
            />

            <p className="text-xs leading-5 text-gray-400">
              Maximum number of add-on options the customer can select.
            </p>

            {errors.maxSelect && (
              <p className="text-xs text-red-500">{errors.maxSelect}</p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-[18px] border border-primary/10 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
            <PackageCheck size={18} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-950">
              Item Quantity Limits
            </h3>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              Configure how many units of this item can be ordered.
            </p>
          </div>
        </div>

        <div className="rounded-[16px] border border-primary/15 bg-primary/[0.04] p-4">
          <div className="flex items-start gap-3">
            <Info size={18} className="mt-0.5 shrink-0 text-primary" />

            <div>
              <p className="text-sm font-semibold text-gray-950">
                {quantitySummary}
              </p>
              <p className="mt-1 text-xs leading-5 text-gray-600">
                These limits control item quantity, not add-on selection.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-900">
              Min Item Quantity
            </Label>

            <Input
              type="number"
              min={1}
              value={form.minQuantity ?? "1"}
              onKeyDown={blockInvalidNumberKeys}
              onPaste={blockNegativeNumberPaste}
              onChange={(event) =>
                update(
                  "minQuantity",
                  sanitizeNonNegativeNumber(event.target.value)
                )
              }
              onBlur={(event) =>
                validateField(
                  "minQuantity",
                  sanitizeNonNegativeNumber(event.target.value)
                )
              }
              placeholder="1"
              className="h-[44px] rounded-[12px] border-gray-300 focus:border-gray-400"
            />

            <p className="text-xs leading-5 text-gray-400">
              Minimum quantity allowed per order for this item.
            </p>

            {errors.minQuantity && (
              <p className="text-xs text-red-500">{errors.minQuantity}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-900">
              Max Item Quantity
            </Label>

            <Input
              type="number"
              min={1}
              value={form.maxQuantity ?? "5"}
              onKeyDown={blockInvalidNumberKeys}
              onPaste={blockNegativeNumberPaste}
              onChange={(event) =>
                update(
                  "maxQuantity",
                  sanitizeNonNegativeNumber(event.target.value)
                )
              }
              onBlur={(event) =>
                validateField(
                  "maxQuantity",
                  sanitizeNonNegativeNumber(event.target.value)
                )
              }
              placeholder="5"
              className="h-[44px] rounded-[12px] border-gray-300 focus:border-gray-400"
            />

            <p className="text-xs leading-5 text-gray-400">
              Maximum quantity allowed per order for this item.
            </p>

            {errors.maxQuantity && (
              <p className="text-xs text-red-500">{errors.maxQuantity}</p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-[18px] border border-primary/10 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
            <Tags size={18} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-950">
              Labels & Allergens
            </h3>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              Attach reusable menu labels and allergen codes from configured
              templates.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label>Labels</Label>

              {labelsLoading ? (
                <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                  <Loader2 size={12} className="animate-spin" />
                  Loading
                </span>
              ) : null}
            </div>

            <AsyncMultiSelect
              value={selectedLabelOptions}
              onChange={(selected) =>
                update(
                  "labels",
                  selected
                    .map((item: any) => String(item?.value || "").trim())
                    .filter(Boolean)
                )
              }
              placeholder="Select item labels"
              fetchOptions={fetchLabelOptions}
              labelKey="label"
              valueKey="value"
              maxSelectedLabelCount={3}
            />

            <p className="text-xs leading-5 text-gray-400">
              Example: Vegan, Spicy, Popular, Recommended, New.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label>Allergen Codes</Label>

              {allergensLoading ? (
                <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                  <Loader2 size={12} className="animate-spin" />
                  Loading
                </span>
              ) : null}
            </div>

            <AsyncMultiSelect
              value={selectedAllergenOptions}
              onChange={(selected) =>
                update(
                  "allergenCodes",
                  selected
                    .map((item: any) => String(item?.code || "").trim())
                    .filter(Boolean)
                )
              }
              placeholder="Select allergen codes"
              fetchOptions={fetchAllergenOptions}
              labelKey="label"
              valueKey="code"
              maxSelectedLabelCount={3}
            />

            <p className="text-xs leading-5 text-gray-400">
              Codes are sent to backend in{" "}
              <span className="font-medium">allergenCodes</span>.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="space-y-2">
          <Label>Preparation Time (minutes)</Label>

          <Input
            type="number"
            min={0}
            value={form.prepTimeMinutes || ""}
            onKeyDown={blockInvalidNumberKeys}
            onPaste={blockNegativeNumberPaste}
            onChange={(e) =>
              update(
                "prepTimeMinutes",
                sanitizeNonNegativeNumber(e.target.value)
              )
            }
            onBlur={(e) =>
              validateField(
                "prepTimeMinutes",
                sanitizeNonNegativeNumber(e.target.value)
              )
            }
            placeholder="Enter preparation time if applicable"
            className="h-[44px] rounded-[12px] border-gray-300 focus:border-gray-400"
          />

          {errors.prepTimeMinutes && (
            <p className="text-xs text-red-500">{errors.prepTimeMinutes}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Sort Order</Label>

          <Input
            type="number"
            min={0}
            value={form.sortOrder || "0"}
            onKeyDown={blockInvalidNumberKeys}
            onPaste={blockNegativeNumberPaste}
            onChange={(e) =>
              update("sortOrder", sanitizeNonNegativeNumber(e.target.value))
            }
            onBlur={(e) =>
              validateField(
                "sortOrder",
                sanitizeNonNegativeNumber(e.target.value)
              )
            }
            placeholder="0"
            className="h-[44px] rounded-[12px] border-gray-300 focus:border-gray-400"
          />

          {errors.sortOrder && (
            <p className="text-xs text-red-500">{errors.sortOrder}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Delivery Price Adjustment</Label>

          <Input
            type="number"
            min={0}
            value={form.deliveryPriceAdjustment || ""}
            onKeyDown={blockInvalidNumberKeys}
            onPaste={blockNegativeNumberPaste}
            onChange={(e) =>
              update(
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
            placeholder="0"
            className="h-[44px] rounded-[12px] border-gray-300 focus:border-gray-400"
          />

          {errors.deliveryPriceAdjustment && (
            <p className="text-xs text-red-500">
              {errors.deliveryPriceAdjustment}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Takeaway Price Adjustment</Label>

          <Input
            type="number"
            min={0}
            value={form.takeawayPriceAdjustment || ""}
            onKeyDown={blockInvalidNumberKeys}
            onPaste={blockNegativeNumberPaste}
            onChange={(e) =>
              update(
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
            placeholder="0"
            className="h-[44px] rounded-[12px] border-gray-300 focus:border-gray-400"
          />

          {errors.takeawayPriceAdjustment && (
            <p className="text-xs text-red-500">
              {errors.takeawayPriceAdjustment}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Deposit Amount (Pfand)</Label>

          <Input
            type="number"
            min={0}
            value={form.depositAmount || ""}
            onKeyDown={blockInvalidNumberKeys}
            onPaste={blockNegativeNumberPaste}
            onChange={(e) =>
              update("depositAmount", sanitizeNonNegativeNumber(e.target.value))
            }
            onBlur={(e) =>
              validateField(
                "depositAmount",
                sanitizeNonNegativeNumber(e.target.value)
              )
            }
            placeholder="0"
            className="h-[44px] rounded-[12px] border-gray-300 focus:border-gray-400"
          />

          {errors.depositAmount && (
            <p className="text-xs text-red-500">{errors.depositAmount}</p>
          )}
        </div>

        {/* Removed for now as requested.
        <div className="space-y-2">
          <Label>Allergen PDF URL</Label>

          <Input
            value={form.allergenPdfUrl || ""}
            onChange={(e) => update("allergenPdfUrl", e.target.value)}
            onBlur={(e) => validateField("allergenPdfUrl", e.target.value)}
            placeholder="https://example.com/allergen-info.pdf"
            className="h-[44px] rounded-[12px] border-gray-300 focus:border-gray-400"
          />

          {errors.allergenPdfUrl && (
            <p className="text-xs text-red-500">{errors.allergenPdfUrl}</p>
          )}
        </div>
        */}
      </section>

      <section className="space-y-5">
        <div className="space-y-2">
          <Label>Ingredients</Label>

          <Textarea
            value={form.ingredients || ""}
            placeholder="e.g. Chicken patty, lettuce, cheese, mayo"
            onChange={(e) =>
              setForm((prev: any) => ({
                ...prev,
                ingredients: e.target.value,
              }))
            }
            onBlur={(e) => validateField("ingredients", e.target.value)}
            className="h-[100px] rounded-[12px] border-gray-300 focus:border-gray-400"
          />

          {errors.ingredients && (
            <p className="text-xs text-red-500">{errors.ingredients}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Nutritional Information</Label>

          <Textarea
            value={form.nutritionalInformation || ""}
            placeholder="e.g. 450 kcal, 20g protein, 15g fat"
            onChange={(e) =>
              setForm((prev: any) => ({
                ...prev,
                nutritionalInformation: e.target.value,
              }))
            }
            onBlur={(e) =>
              validateField("nutritionalInformation", e.target.value)
            }
            className="h-[100px] rounded-[12px] border-gray-300 focus:border-gray-400"
          />

          {errors.nutritionalInformation && (
            <p className="text-xs text-red-500">
              {errors.nutritionalInformation}
            </p>
          )}
        </div>
      </section>

      <section className="space-y-5">
        <div className="space-y-2">
          <Label>Dietary Flags</Label>

          <Input
            value={form.dietaryFlags || ""}
            onChange={(e) => update("dietaryFlags", e.target.value)}
            placeholder="e.g. halal, vegan, gluten-free"
            className="h-[44px] rounded-[12px] border-gray-300 focus:border-gray-400"
          />

          <p className="text-xs text-gray-400">
            Comma-separated fallback flags. Labels above are preferred where
            possible.
          </p>
        </div>

        {/* Removed for now as requested.
        <div className="space-y-2">
          <Label>Allergen Flags</Label>

          <Input
            value={form.allergenFlags || ""}
            onChange={(e) => update("allergenFlags", e.target.value)}
            placeholder="e.g. nuts, dairy, soy"
            className="h-[44px] rounded-[12px] border-gray-300 focus:border-gray-400"
          />

          <p className="text-xs text-gray-400">
            Comma-separated fallback flags. Allergen Codes above are preferred.
          </p>
        </div>
        */}
      </section>

      <section className="rounded-[18px] border border-gray-100 bg-[#FAFAFA] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Item Status</p>
            <p className="mt-1 text-sm text-gray-500">
              Control whether this item is visible and available.
            </p>
          </div>

          <label className="flex cursor-pointer items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-gray-100">
            <input
              type="checkbox"
              checked={form.isActive !== false}
              onChange={(e) => update("isActive", e.target.checked)}
              className="accent-primary"
            />
            Active
          </label>
        </div>
      </section>

      <div className="rounded-[16px] border border-primary/15 bg-primary/[0.04] p-4">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-primary" />
          <p className="text-sm leading-6 text-gray-700">
            For add-on style selection, use <strong>Required Selection</strong>,{" "}
            <strong>Min Select</strong>, and <strong>Max Select</strong>. Leave
            Max Select empty for unlimited selection.
          </p>
        </div>
      </div>
    </div>
  );
});

StepTwo.displayName = "StepTwo";

export default StepTwo;