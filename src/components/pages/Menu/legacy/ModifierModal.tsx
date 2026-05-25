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
import { useCreateModifier, useUpdateModifier } from "@/hooks/useMenus";
import { useAuth } from "@/hooks/useAuth";
import {
  blockInvalidNumberKeys,
  blockNegativeNumberPaste,
  sanitizeNonNegativeNumber,
} from "@/lib/number-input";

interface ModifierForm {
  name: string;
  priceDelta: string;
}

const getEmptyForm = (): ModifierForm => ({
  name: "",
  priceDelta: "0",
});

export default function ModifierModal({
  open,
  onOpenChange,
  initialData,
  refresh,
}: any) {
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
        name: initialData?.name || "",
        priceDelta: sanitizeNonNegativeNumber(
          String(initialData?.priceDelta ?? 0)
        ),
      });

      return;
    }

    setForm(getEmptyForm());
  }, [initialData, open]);

  const handleChange = (key: keyof ModifierForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]:
        key === "priceDelta" ? sanitizeNonNegativeNumber(String(value)) : value,
    }));
  };

  const canSubmit = useMemo(() => {
    return Boolean(form.name?.trim());
  }, [form.name]);

  const closeModal = () => {
    if (isSubmitting) return;

    setForm(getEmptyForm());
    onOpenChange(false);
  };

const handleSubmit = async () => {
  if (!canSubmit) {
    toast.error("Modifier name is required");
    return;
  }

  const priceDelta = Number(form.priceDelta);

  if (form.priceDelta === "" || Number.isNaN(priceDelta)) {
    toast.error("Base price must be a valid number");
    return;
  }

  if (priceDelta < 0) {
    toast.error("Base price cannot be negative");
    return;
  }

  const basePayload = {
    name: form.name.trim(),
    priceDelta,
  };

  try {
    if (isEditMode) {
      /**
       * PATCH /menu/modifiers/:id does NOT accept restaurantId.
       */
      await updateModifier({
        id: initialData.id,
        data: basePayload as any,
      });
    } else {
      if (!restaurantId) {
        toast.error("Restaurant id is missing");
        return;
      }

      /**
       * POST /menu/modifiers requires restaurantId.
       */
      await createModifier({
        ...basePayload,
        restaurantId: String(restaurantId),
      } as any);
    }

    refresh?.();
    closeModal();
  } catch (err: any) {
    toast.error(
      err?.response?.data?.message ||
        err?.message ||
        "Failed to save modifier"
    );
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
            {isEditMode ? "Edit" : "Add"} Modifier
          </DialogTitle>

          <p className="text-sm text-gray-500">
            Configure a reusable modifier for menu items and variations.
          </p>
        </DialogHeader>

        <div className="mt-5 space-y-4 rounded-[16px] bg-white p-5">
          <InputField
            label="Modifier Name"
            value={form.name}
            onChange={(value: string) => handleChange("name", value)}
            placeholder="e.g. Extra Cheese, Extra Patty"
            disabled={isSubmitting}
          />

          <InputField
            label="Base Price"
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
                Saving...
              </span>
            ) : isEditMode ? (
              "Update Modifier"
            ) : (
              "Create Modifier"
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