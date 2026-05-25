"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import FormInput from "@/components/register/form/FormInput";

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
  sortOrder: number;
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

const SORT_ORDER_OPTIONS = [
  { label: "Top Priority", value: 0 },
  { label: "High Priority", value: 10 },
  { label: "Medium Priority", value: 50 },
  { label: "Low Priority", value: 100 },
];

const getEmptyForm = (): VariationForm => ({
  name: "",
  description: "",
  price: "",
  sortOrder: 0,
  isDefault: false,
  isActive: true,
});

export default function VariationModal({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: VariationModalProps) {
  const isEditMode = Boolean(initialData?.id);
const { restaurantId } = useAuth();
  const [form, setForm] = useState<VariationForm>(getEmptyForm());

  const { mutate: createVariation, isPending: isCreating } =
    useCreateMenuVariation();

  const { mutate: updateVariation, isPending: isUpdating } =
    useUpdateMenuVariation();

  const isSubmitting = isCreating || isUpdating;

  const modalTitle = useMemo(() => {
    return isEditMode ? "Edit Variation" : "Add Variation";
  }, [isEditMode]);

  const modalDescription = useMemo(() => {
    return isEditMode
      ? "Update this generic menu variation."
      : "Create a generic variation that can be reused across menu setup.";
  }, [isEditMode]);

  const resetForm = () => {
    setForm(getEmptyForm());
  };

  const populateForm = (data: any) => {
    setForm({
      name: data?.name || "",
      description: data?.description || "",
      price: String(data?.price ?? ""),
      sortOrder: Number(data?.sortOrder ?? 0),
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
      sortOrder: Number(form.sortOrder),
      isDefault: Boolean(form.isDefault),
      isActive: Boolean(form.isActive),
    };
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      return "Variation name is required";
    }

    const price = Number(form.price);

    if (Number.isNaN(price)) {
      return "Price must be a valid number";
    }

    if (price < 0) {
      return "Price cannot be negative";
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

  const getSortOrderHelperText = () => {
    const selected = SORT_ORDER_OPTIONS.find(
      (option) => option.value === Number(form.sortOrder)
    );

    if (!selected) return "Lower number appears first.";

    return `${selected.label} variations appear based on their display priority.`;
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
                Quick Variation Templates
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Select a preset or enter a custom variation below.
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
            label="Variation Name"
            placeholder="e.g. Small, Medium, Large"
            value={form.name}
            onChange={(value) => handleChange("name", value)}
            required
          />

          <FormInput
            label="Description"
            placeholder="Enter variation description"
            value={form.description}
            onChange={(value) => handleChange("description", value)}
          />

          <FormInput
            label="Price"
            placeholder="Enter price"
            value={form.price}
            onChange={(value) => handleChange("price", value)}
            type="number"
            onKeyDown={blockInvalidNumberKeys}
            onPaste={blockNegativeNumberPaste}
            min={0}
            required
          />

          <div className="space-y-2">
            <Label>Display Priority</Label>

            <div className="relative">
              <select
                value={String(form.sortOrder)}
                onChange={(e) =>
                  handleChange("sortOrder", Number(e.target.value))
                }
                className="h-11 w-full appearance-none rounded-[10px] border border-[#BBBBBB] bg-white px-4 pr-12 text-sm text-gray-600 outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
              >
                {SORT_ORDER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <div className="pointer-events-none absolute right-0 top-0 flex h-full w-10 items-center justify-center rounded-r-[10px] bg-primary">
                <ChevronDown size={16} className="text-white" />
              </div>
            </div>

            <p className="text-xs text-gray-500">{getSortOrderHelperText()}</p>
          </div>

          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center justify-between rounded-[12px] border border-gray-100 bg-[#FAFAFA] px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  Default Variation
                </p>
                <p className="text-xs text-gray-500">
                  Mark this variation as default.
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
                  Active Status
                </p>
                <p className="text-xs text-gray-500">
                  Show this variation in active flows.
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
            Cancel
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
                {isEditMode ? "Updating..." : "Saving..."}
              </span>
            ) : isEditMode ? (
              "Update Variation"
            ) : (
              "Save Variation"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}