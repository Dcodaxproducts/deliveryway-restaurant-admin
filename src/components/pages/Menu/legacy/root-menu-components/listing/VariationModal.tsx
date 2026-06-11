"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import FormInput from "@/components/forms/common/FormInput";

import {
  useCreateMenuVariation,
  useUpdateMenuVariation,
} from "@/hooks/useMenus";

import {
  blockInvalidNumberKeys,
  blockNegativeNumberPaste,
  sanitizeNonNegativeNumber,
} from "@/lib/number-input";
import { useAuth } from "@/hooks/useAuth";
import { useTranslations } from "next-intl";

type VariationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: any;
  onSuccess?: () => void;
};

type VariationForm = {
  name: string;
  description: string;
  price: string;
  isDefault: boolean;
  isActive: boolean;
};

const PREDEFINED_VARIATIONS = [
  {
    name: "Small",
    description: "Small size option",
    price: "",
  },
  {
    name: "Medium",
    description: "Medium size option",
    price: "",
  },
  {
    name: "Large",
    description: "Large size option",
    price: "",
  },
  {
    name: "Extra Large",
    description: "Extra large size option",
    price: "",
  },
  {
    name: "Regular",
    description: "Regular serving option",
    price: "",
  },
  {
    name: "Family",
    description: "Family size option",
    price: "",
  },
];

const getEmptyForm = (): VariationForm => ({
  name: "",
  description: "",
  price: "",
  isDefault: false,
  isActive: true,
});

export default function VariationModal({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: VariationModalProps) {
  const t = useTranslations("menu.variationModal");
  const commonT = useTranslations("common");
  const isEditMode = Boolean(initialData?.id);
  const { restaurantId } = useAuth();
  const [form, setForm] = useState<VariationForm>(getEmptyForm());

  const { mutate: createVariation, isPending: isCreating } =
    useCreateMenuVariation();

  const { mutate: updateVariation, isPending: isUpdating } =
    useUpdateMenuVariation();

  const isSubmitting = isCreating || isUpdating;

  const modalTitle = useMemo(() => {
    return isEditMode ? t("editTitle") : t("addTitle");
  }, [isEditMode, t]);

  const modalDescription = useMemo(() => {
    return isEditMode
      ? t("editDescription")
      : t("addDescription");
  }, [isEditMode, t]);

  const resetForm = () => {
    setForm(getEmptyForm());
  };

  const populateForm = (data: any) => {
    setForm({
      name: data?.name || "",
      description: data?.description || "",
      price: String(data?.price ?? ""),
      isDefault: Boolean(data?.isDefault),
      isActive: data?.isActive === false ? false : true,
    });
  };

  useEffect(() => {
    if (!open) return;

    if (initialData?.id) {
      populateForm(initialData);
      return;
    }

    resetForm();
  }, [open, initialData]);

  const handleChange = (key: keyof VariationForm, value: any) => {
    setForm((prev) => ({
      ...prev,
      [key]: key === "price" ? sanitizeNonNegativeNumber(String(value)) : value,
    }));
  };

  const applyPresetVariation = (
    preset: (typeof PREDEFINED_VARIATIONS)[number]
  ) => {
    setForm((prev) => ({
      ...prev,
      name: preset.name,
      description: preset.description,
      price: preset.price,
    }));
  };

  const closeModal = () => {
    onOpenChange(false);
    resetForm();
  };

  const buildPayload = () => {
    const price = Number(form.price);

    return {
      name: form.name.trim(),
      description: form.description.trim(),
      price,
      isDefault: Boolean(form.isDefault),
      isActive: Boolean(form.isActive),
    };
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      return t("nameRequired");
    }

    const price = Number(form.price);

    if (Number.isNaN(price)) {
      return t("priceInvalid");
    }

    if (price < 0) {
      return t("priceNegative");
    }

    return null;
  };

  const handleSubmit = () => {
  const validationError = validateForm();

  if (validationError) {
    return;
  }

  const payload = buildPayload();

  if (isEditMode && initialData?.id) {
    updateVariation(
      {
        id: initialData.id,
        data: payload,
      },
      {
        onSuccess: () => {
          onSuccess?.();
          closeModal();
        },
      }
    );

    return;
  }

  const createPayload = {
    ...payload,
    restaurantId: restaurantId || undefined,
  };

  createVariation(createPayload, {
    onSuccess: () => {
      onSuccess?.();
      closeModal();
    },
  });
};

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        onOpenChange(value);

        if (!value) {
          resetForm();
        }
      }}
    >
      <DialogContent className="max-h-[95vh] max-w-[680px] overflow-auto rounded-[22px] bg-[#F5F5F5] p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-2xl font-semibold text-gray-900">
            {modalTitle}
          </DialogTitle>

          <p className="text-sm text-gray-500">{modalDescription}</p>
        </DialogHeader>

        {!isEditMode ? (
          <div className="mt-5 rounded-[18px] bg-white p-5 shadow-sm">
            <div className="mb-3">
              <h3 className="text-base font-semibold text-gray-900">
                {t("quickTemplates")}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {t("quickTemplatesDescription")}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {PREDEFINED_VARIATIONS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPresetVariation(preset)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    form.name === preset.name
                      ? "border-primary bg-primary text-white"
                      : "border-gray-200 bg-[#F9FAFB] text-gray-700 hover:border-primary hover:text-primary"
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-5 space-y-4 rounded-[18px] bg-white p-5 shadow-sm">
          <FormInput
            label={t("name")}
            placeholder={t("namePlaceholder")}
            value={form.name}
            onChange={(value) => handleChange("name", value)}
            required
          />

          <FormInput
            label={commonT("description")}
            placeholder={t("descriptionPlaceholder")}
            value={form.description}
            onChange={(value) => handleChange("description", value)}
          />

          <FormInput
            label={commonT("price")}
            placeholder={t("pricePlaceholder")}
            value={form.price}
            onChange={(value) => handleChange("price", value)}
            type="number"
            onKeyDown={blockInvalidNumberKeys}
            onPaste={blockNegativeNumberPaste}
            min={0}
            required
          />

          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center justify-between rounded-[12px] border border-gray-100 bg-[#FAFAFA] px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {t("defaultVariation")}
                </p>
                <p className="text-xs text-gray-500">
                  {t("defaultVariationDescription")}
                </p>
              </div>

              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => handleChange("isDefault", e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between rounded-[12px] border border-gray-100 bg-[#FAFAFA] px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {t("activeStatus")}
                </p>
                <p className="text-xs text-gray-500">
                  {t("activeStatusDescription")}
                </p>
              </div>

              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => handleChange("isActive", e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
            </label>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={closeModal}
            disabled={isSubmitting}
            className="h-[42px] rounded-[12px]"
          >
            {commonT("cancel")}
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="h-[42px] rounded-[12px] bg-primary px-6 text-white hover:bg-primary/90"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={18} />
                {isEditMode ? commonT("updating") : commonT("saving")}
              </span>
            ) : isEditMode ? (
              t("update")
            ) : (
              t("save")
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
