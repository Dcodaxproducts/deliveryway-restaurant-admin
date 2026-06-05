"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
} from "react";
import { toast } from "sonner";
import { useCreateModifier, useUpdateModifier } from "@/hooks/useModifiers";
import { useAuth } from "@/hooks/useAuth";
import ModifierCategoryInfiniteSelect from "@/components/pages/Menu/modifiers/components/ModifierCategoryInfiniteSelect";
import {
  blockInvalidNumberKeys,
  blockNegativeNumberPaste,
  sanitizeNonNegativeNumber,
} from "@/lib/number-input";
import { getApiErrorMessage } from "@/lib/errors";
import { useTranslations } from "next-intl";
import type { Modifier } from "@/types/modifiers";

interface ModifierForm {
  categoryId: string;
  name: string;
  priceDelta: string;
  sortOrder: string;
  isActive: boolean;
}

const getEmptyForm = (): ModifierForm => ({
  categoryId: "",
  name: "",
  priceDelta: "0",
  sortOrder: "0",
  isActive: true,
});

type ModifierModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<Modifier> | null;
  refresh?: () => void;
};

export default function ModifierModal({
  open,
  onOpenChange,
  initialData,
  refresh,
}: ModifierModalProps) {
  const t = useTranslations("menu.modifierModal");
  const commonT = useTranslations("common");
  const { restaurantId: authRestaurantId } = useAuth();
  const restaurantId = authRestaurantId ?? undefined;

  const { mutateAsync: createModifier, isPending: isCreating } =
    useCreateModifier();

  const { mutateAsync: updateModifier, isPending: isUpdating } =
    useUpdateModifier();

  const [form, setForm] = useState<ModifierForm>(getEmptyForm());

  const isEditMode = Boolean(initialData?.id);
  const isSubmitting = isCreating || isUpdating;

  useEffect(() => {
    if (!open) return;

    if (initialData?.id) {
      setForm({
        categoryId: initialData.categoryId || initialData.category?.id || "",
        name: initialData?.name || "",
        priceDelta: sanitizeNonNegativeNumber(
          String(initialData?.priceDelta ?? 0)
        ),
        sortOrder: sanitizeNonNegativeNumber(
          String(initialData?.sortOrder ?? 0)
        ),
        isActive: initialData?.isActive ?? true,
      });

      return;
    }

    setForm(getEmptyForm());
  }, [initialData, open]);

  const handleChange = <K extends keyof ModifierForm>(
    key: K,
    value: ModifierForm[K]
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]:
        key === "priceDelta" || key === "sortOrder"
          ? sanitizeNonNegativeNumber(String(value))
          : value,
    }));
  };

  const canSubmit = useMemo(() => {
    return Boolean(form.name?.trim() && form.categoryId.trim());
  }, [form.categoryId, form.name]);

  const closeModal = () => {
    if (isSubmitting) return;

    setForm(getEmptyForm());
    onOpenChange(false);
  };

const handleSubmit = async () => {
  if (!canSubmit) {
    if (!form.categoryId.trim()) {
      toast.error(t("categoryRequired"));
      return;
    }

    toast.error(t("nameRequired"));
    return;
  }

  const priceDelta = Number(form.priceDelta);
  const sortOrder = Number(form.sortOrder);

  if (form.priceDelta === "" || Number.isNaN(priceDelta)) {
    toast.error(t("basePriceInvalid"));
    return;
  }

  if (priceDelta < 0) {
    toast.error(t("basePriceNegative"));
    return;
  }

  if (form.sortOrder === "" || Number.isNaN(sortOrder)) {
    toast.error(t("sortOrderInvalid"));
    return;
  }

  if (sortOrder < 0) {
    toast.error(t("sortOrderNegative"));
    return;
  }

  const basePayload = {
    categoryId: form.categoryId.trim(),
    name: form.name.trim(),
    priceDelta,
    sortOrder,
    isActive: form.isActive,
  };

  try {
    if (isEditMode && initialData?.id) {
      /**
       * PATCH /menu/modifiers/:id does NOT accept restaurantId.
       */
      await updateModifier({
        id: initialData.id,
        data: basePayload,
      });
    } else {
      if (!restaurantId) {
        toast.error(t("restaurantMissing"));
        return;
      }

      /**
       * POST /menu/modifiers requires restaurantId.
       */
      await createModifier({
        categoryId: basePayload.categoryId,
        name: basePayload.name,
        priceDelta: basePayload.priceDelta,
        sortOrder: basePayload.sortOrder,
        restaurantId: String(restaurantId),
      });
    }

    refresh?.();
    closeModal();
  } catch (error: unknown) {
    toast.error(getApiErrorMessage(error, t("saveFailed")));
  }
};

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!isSubmitting) {
          if (!value) {
            closeModal();
            return;
          }

          onOpenChange(value);
        }
      }}
    >
      <DialogContent className="max-h-[95vh] max-w-[520px] overflow-auto rounded-[20px] bg-[#F5F5F5] p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            {isEditMode ? t("editTitle") : t("addTitle")}
          </DialogTitle>

          <p className="text-sm text-gray-500">
            {t("description")}
          </p>
        </DialogHeader>

        <div className="mt-5 space-y-4 rounded-[16px] bg-white p-5">
          <div className="space-y-1">
            <p className="text-sm text-gray-600">{t("category")}</p>
            <ModifierCategoryInfiniteSelect
              value={form.categoryId}
              onChange={(categoryId) => handleChange("categoryId", categoryId)}
              restaurantId={restaurantId}
              selectedCategory={initialData?.category ?? null}
              placeholder={t("categoryPlaceholder")}
              disabled={isSubmitting}
            />
          </div>

          <InputField
            label={t("name")}
            value={form.name}
            onChange={(value: string) => handleChange("name", value)}
            placeholder={t("namePlaceholder")}
            disabled={isSubmitting}
          />

          <InputField
            label={t("sortOrder")}
            type="number"
            value={form.sortOrder}
            onChange={(value: string) => handleChange("sortOrder", value)}
            onKeyDown={blockInvalidNumberKeys}
            onPaste={blockNegativeNumberPaste}
            min={0}
            placeholder="0"
            disabled={isSubmitting}
          />

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) =>
                handleChange("isActive", event.target.checked)
              }
              disabled={isSubmitting}
              className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            {t("activeStatus")}
          </label>

          <InputField
            label={t("basePrice")}
            type="number"
            value={form.priceDelta}
            onChange={(value: string) => handleChange("priceDelta", value)}
            onKeyDown={blockInvalidNumberKeys}
            onPaste={blockNegativeNumberPaste}
            min={0}
            placeholder="0"
            disabled={isSubmitting}
          />

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="mt-2 w-full rounded-[10px] bg-primary py-4"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin" size={18} />
                {commonT("saving")}
              </span>
            ) : isEditMode ? (
              t("update")
            ) : (
              t("create")
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface InputFieldProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "onChange" | "value" | "type"
  > {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: InputHTMLAttributes<HTMLInputElement>["type"];
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
  className = "",
  ...inputProps
}: InputFieldProps) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-gray-600">{label}</p>

      <input
        type={type}
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          onChange(e.target.value)
        }
        className={`
          h-[40px]
          w-full
          rounded-[10px]
          border
          border-gray-300
          px-3
          outline-none
          focus:border-gray-400
          disabled:cursor-not-allowed
          disabled:opacity-60
          ${className}
        `}
        {...inputProps}
      />
    </div>
  );
}
