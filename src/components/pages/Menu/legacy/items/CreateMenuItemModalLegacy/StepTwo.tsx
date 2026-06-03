"use client";

import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { z } from "zod";
import { parseSchema } from "@/lib/zod-errors";
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
import { useTranslations } from "next-intl";

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

const normalizeTemplateOptions = (
  response: any,
  templateType: "allergens" | "additives"
): OptionItem[] => {
  const candidates = [
    response?.data?.[templateType],
    response?.data?.data?.[templateType],
    response?.[templateType],
    response?.data?.templates?.[templateType],
    response?.templates?.[templateType],
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
  t,
}: {
  isRequired: boolean;
  minSelect: string;
  maxSelect: string;
  t: ReturnType<typeof useTranslations>;
}) => {
  const min = Number(minSelect || 0);
  const max = parseOptionalNumber(maxSelect);

  if (!isRequired && min === 0 && max === null) {
    return t("selectionOptionalNoMax");
  }

  if (!isRequired && min === 0 && max !== null) {
    return t("selectionOptionalWithMax", { max });
  }

  if (isRequired && max !== null) {
    return t("selectionRequiredWithMax", { min, max });
  }

  if (isRequired && max === null) {
    return t("selectionRequiredNoMax", { min });
  }

  return t("selectionMin", { min });
};

const getQuantitySummary = ({
  minQuantity,
  maxQuantity,
  t,
}: {
  minQuantity: string;
  maxQuantity: string;
  t: ReturnType<typeof useTranslations>;
}) => {
  const min = Math.max(1, parseNumber(minQuantity, 1));
  const max = Math.max(min, parseNumber(maxQuantity, min));

  return t("quantitySummary", { min, max });
};

const StepTwo = forwardRef(({ form, setForm }: any, ref: any) => {
  const t = useTranslations("menu.itemModal.stepTwo");
  const commonT = useTranslations("common");
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
    return normalizeTemplateOptions(allergenTemplatesResponse, "allergens");
  }, [allergenTemplatesResponse]);

  const additiveOptions = useMemo(() => {
    return normalizeTemplateOptions(allergenTemplatesResponse, "additives");
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

  const additiveCodeSet = useMemo(() => {
    return new Set(additiveOptions.map((option) => String(option.code || "")));
  }, [additiveOptions]);

  const allergenCodeSet = useMemo(() => {
    return new Set(allergenOptions.map((option) => String(option.code || "")));
  }, [allergenOptions]);

  const selectedAdditiveCodeValues = useMemo(() => {
    return selectedAllergenCodeValues.filter((code) => additiveCodeSet.has(code));
  }, [selectedAllergenCodeValues, additiveCodeSet]);

  const selectedVisibleAllergenCodeValues = useMemo(() => {
    return selectedAllergenCodeValues.filter(
      (code) => allergenCodeSet.has(code) || !additiveCodeSet.has(code)
    );
  }, [selectedAllergenCodeValues, allergenCodeSet, additiveCodeSet]);

  const selectedAllergenOptions = useMemo(() => {
    return createSelectedOptions({
      selectedValues: selectedVisibleAllergenCodeValues,
      options: allergenOptions,
      valueKey: "code",
    });
  }, [selectedVisibleAllergenCodeValues, allergenOptions]);

  const selectedAdditiveOptions = useMemo(() => {
    return createSelectedOptions({
      selectedValues: selectedAdditiveCodeValues,
      options: additiveOptions,
      valueKey: "code",
    });
  }, [selectedAdditiveCodeValues, additiveOptions]);

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

  const fetchAdditiveOptions = useMemo(() => {
    return createLocalFetchOptions({
      items: additiveOptions,
      keys: ["code", "label"],
    });
  }, [additiveOptions]);

  const update = (key: string, value: any) => {
    setForm((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateTemplateCodes = ({
    nextCodes,
    preserveCodes,
  }: {
    nextCodes: string[];
    preserveCodes: string[];
  }) => {
    update("allergenCodes", Array.from(new Set([...nextCodes, ...preserveCodes])));
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
        [field]: err.errors?.[0]?.message || t("invalidValue"),
      }));
    }
  };

  const validateSelectionRules = () => {
    const minSelect = Number(form.minSelect || 0);
    const maxSelect = parseOptionalNumber(form.maxSelect);

    if (Number.isNaN(minSelect) || minSelect < 0) {
      setErrors((prev: any) => ({
        ...prev,
        minSelect: t("minAddonSelectNegative"),
      }));
      toast.error(t("minAddonSelectNegative"));
      return false;
    }

    if (maxSelect !== null && maxSelect < 0) {
      setErrors((prev: any) => ({
        ...prev,
        maxSelect: t("maxAddonSelectNegative"),
      }));
      toast.error(t("maxAddonSelectNegative"));
      return false;
    }

    if (maxSelect !== null && maxSelect < minSelect) {
      setErrors((prev: any) => ({
        ...prev,
        maxSelect: t("maxAddonSelectLessThanMin"),
      }));
      toast.error(t("maxAddonSelectLessThanMin"));
      return false;
    }

    if (form.isRequired && minSelect < 1) {
      setErrors((prev: any) => ({
        ...prev,
        minSelect: t("requiredAddonsMin"),
      }));
      toast.error(t("requiredAddonsMin"));
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
        minQuantity: t("minItemQuantityInvalid"),
      }));
      toast.error(t("minItemQuantityInvalid"));
      return false;
    }

    if (Number.isNaN(maxQuantity) || maxQuantity < 1) {
      setErrors((prev: any) => ({
        ...prev,
        maxQuantity: t("maxItemQuantityInvalid"),
      }));
      toast.error(t("maxItemQuantityInvalid"));
      return false;
    }

    if (maxQuantity < minQuantity) {
      setErrors((prev: any) => ({
        ...prev,
        maxQuantity: t("maxItemQuantityLessThanMin"),
      }));
      toast.error(t("maxItemQuantityLessThanMin"));
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
      toast.error(t("waitForImageUpload"));
      return false;
    }

    const result = parseSchema(schema, form);

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
    t,
  });

  const quantitySummary = getQuantitySummary({
    minQuantity: form.minQuantity || "1",
    maxQuantity: form.maxQuantity || "5",
    t,
  });

  return (
    <div className="space-y-6">
      <ImageDropzoneUpload
        label={t("image")}
        value={form.imageUrl}
        previewUrl={form.imagePreview}
        onChange={handleImageUrlChange}
        onPreviewChange={handleImagePreviewChange}
        onClear={handleClearImage}
        onUploadingChange={setImageUploading}
        previewAlt={t("imagePreviewAlt")}
      />

      <section className="rounded-[18px] border border-primary/10 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
            <ListChecks size={18} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-950">
              {t("addonSelectionRules")}
            </h3>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              {t("addonSelectionDescription")}
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
                {t("addonLimitsHelp")}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <label className="flex cursor-pointer flex-col gap-3 rounded-[14px] border border-gray-200 bg-[#FAFAFA] p-4 transition hover:border-primary/30 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {t("requiredAddons")}
              </p>
              <p className="mt-1 text-xs leading-5 text-gray-500">
                {t("requiredAddonsDescription")}
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
              {t("minAddonSelect")}
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
              {t("minAddonSelectHelp")}
            </p>

            {errors.minSelect && (
              <p className="text-xs text-red-500">{errors.minSelect}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Label className="text-sm font-semibold text-gray-900">
                {t("maxAddonSelect")}
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
                {t("noMaximumLimit")}
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
              placeholder={t("noMaximum")}
              className="h-[44px] rounded-[12px] border-gray-300 focus:border-gray-400 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
            />

            <p className="text-xs leading-5 text-gray-400">
              {t("maxAddonSelectHelp")}
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
              {t("itemQuantityLimits")}
            </h3>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              {t("itemQuantityDescription")}
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
                {t("quantityLimitsHelp")}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-900">
              {t("minItemQuantity")}
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
              {t("minItemQuantityHelp")}
            </p>

            {errors.minQuantity && (
              <p className="text-xs text-red-500">{errors.minQuantity}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-900">
              {t("maxItemQuantity")}
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
              {t("maxItemQuantityHelp")}
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
              {t("labelsAllergensAdditives")}
            </h3>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              {t("labelsAllergensDescription")}
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label>{t("labels")}</Label>

              {labelsLoading ? (
                <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                  <Loader2 size={12} className="animate-spin" />
                  {commonT("loadingPlain")}
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
              placeholder={t("selectItemLabels")}
              fetchOptions={fetchLabelOptions}
              labelKey="label"
              valueKey="value"
              maxSelectedLabelCount={3}
            />

            <p className="text-xs leading-5 text-gray-400">
              {t("labelsHelp")}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label>{t("allergenCodes")}</Label>

              {allergensLoading ? (
                <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                  <Loader2 size={12} className="animate-spin" />
                  {commonT("loadingPlain")}
                </span>
              ) : null}
            </div>

            <AsyncMultiSelect
              value={selectedAllergenOptions}
              onChange={(selected) =>
                updateTemplateCodes({
                  nextCodes: selected
                    .map((item: any) => String(item?.code || "").trim())
                    .filter(Boolean),
                  preserveCodes: selectedAdditiveCodeValues,
                })
              }
              placeholder={t("selectAllergenCodes")}
              fetchOptions={fetchAllergenOptions}
              labelKey="label"
              valueKey="code"
              maxSelectedLabelCount={3}
            />

            <p className="text-xs leading-5 text-gray-400">
              {t("allergenCodesHelp")}{" "}
              <span className="font-medium">allergenCodes</span>.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label>{t("additiveCodes")}</Label>

              {allergensLoading ? (
                <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                  <Loader2 size={12} className="animate-spin" />
                  {commonT("loadingPlain")}
                </span>
              ) : null}
            </div>

            <AsyncMultiSelect
              value={selectedAdditiveOptions}
              onChange={(selected) =>
                updateTemplateCodes({
                  nextCodes: selected
                    .map((item: any) => String(item?.code || "").trim())
                    .filter(Boolean),
                  preserveCodes: selectedVisibleAllergenCodeValues,
                })
              }
              placeholder={t("selectAdditiveCodes")}
              fetchOptions={fetchAdditiveOptions}
              labelKey="label"
              valueKey="code"
              maxSelectedLabelCount={3}
            />

            <p className="text-xs leading-5 text-gray-400">
              {t("additiveCodesHelpPrefix")}{" "}
              <span className="font-medium">allergenCodes</span> payload with
              {t("additiveCodesHelpSuffix")}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="space-y-2">
          <Label>{t("preparationTime")}</Label>

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
            placeholder={t("preparationTimePlaceholder")}
            className="h-[44px] rounded-[12px] border-gray-300 focus:border-gray-400"
          />

          {errors.prepTimeMinutes && (
            <p className="text-xs text-red-500">{errors.prepTimeMinutes}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>{t("sortOrder")}</Label>

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
          <Label>{t("deliveryPriceAdjustment")}</Label>

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
          <Label>{t("takeawayPriceAdjustment")}</Label>

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
          <Label>{t("depositAmount")}
          </Label>

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
          <Label>{t("ingredients")}</Label>

          <Textarea
            value={form.ingredients || ""}
            placeholder={t("ingredientsPlaceholder")}
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
          <Label>{t("nutritionalInformation")}</Label>

          <Textarea
            value={form.nutritionalInformation || ""}
            placeholder={t("nutritionalInformationPlaceholder")}
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
          <Label>{t("dietaryFlags")}</Label>

          <Input
            value={form.dietaryFlags || ""}
            onChange={(e) => update("dietaryFlags", e.target.value)}
            placeholder={t("dietaryFlagsPlaceholder")}
            className="h-[44px] rounded-[12px] border-gray-300 focus:border-gray-400"
          />

          <p className="text-xs text-gray-400">
            {t("dietaryFlagsHelp")}
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
            <p className="text-sm font-semibold text-gray-900">{t("itemStatus")}</p>
            <p className="mt-1 text-sm text-gray-500">
              {t("itemStatusDescription")}
            </p>
          </div>

          <label className="flex cursor-pointer items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-gray-100">
            <input
              type="checkbox"
              checked={form.isActive !== false}
              onChange={(e) => update("isActive", e.target.checked)}
              className="accent-primary"
            />
            {commonT("active")}
          </label>
        </div>
      </section>

      <div className="rounded-[16px] border border-primary/15 bg-primary/[0.04] p-4">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-primary" />
          <p className="text-sm leading-6 text-gray-700">
            {t.rich("addonStyleHelp", {
              required: (chunks) => <strong>{chunks}</strong>,
              min: (chunks) => <strong>{chunks}</strong>,
              max: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
        </div>
      </div>
    </div>
  );
});

StepTwo.displayName = "StepTwo";

export default StepTwo;
