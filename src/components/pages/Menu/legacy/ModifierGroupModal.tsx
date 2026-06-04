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
import { useAuth } from "@/hooks/useAuth";
import {
  useCreateModifierGroup,
  useUpdateModifierGroup,
} from "@/hooks/useModifierGroups";
import {
  blockInvalidNumberKeys,
  blockNegativeNumberPaste,
  sanitizeNonNegativeNumber,
} from "@/lib/number-input";
import { getApiErrorMessage } from "@/lib/errors";
import type { ModifierGroup } from "@/types/modifier-groups";
import {
  modifierGroupSchema,
  updateModifierGroupSchema,
} from "@/validations/modifier-groups";
import { useTranslations } from "next-intl";

type ModifierGroupForm = {
  name: string;
  description: string;
  minSelect: string;
  maxSelect: string;
  sortOrder: string;
  isActive: boolean;
};

type ModifierGroupModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: ModifierGroup | null;
  refresh: () => void;
};

const getDefaultForm = (): ModifierGroupForm => ({
  name: "",
  description: "",
  minSelect: "0",
  maxSelect: "1",
  sortOrder: "0",
  isActive: true,
});

export function ModifierGroupModal({
  open,
  onOpenChange,
  initialData,
  refresh,
}: ModifierGroupModalProps) {
  const t = useTranslations("menu.modifierGroupModal");
  const commonT = useTranslations("common");
  const { restaurantId: authRestaurantId } = useAuth();
  const restaurantId = authRestaurantId ?? undefined;

  const [form, setForm] = useState<ModifierGroupForm>(getDefaultForm());

  const { mutateAsync: createModifierGroup, isPending: isCreating } =
    useCreateModifierGroup();
  const { mutateAsync: updateModifierGroup, isPending: isUpdating } =
    useUpdateModifierGroup();

  const isSubmitting = isCreating || isUpdating;
  const isEditMode = Boolean(initialData?.id);

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      setForm({
        name: initialData.name || "",
        description: initialData.description || "",
        minSelect: sanitizeNonNegativeNumber(String(initialData.minSelect ?? 0)),
        maxSelect: sanitizeNonNegativeNumber(String(initialData.maxSelect ?? 1)),
        sortOrder: sanitizeNonNegativeNumber(String(initialData.sortOrder ?? 0)),
        isActive: initialData.isActive ?? true,
      });
      return;
    }

    setForm(getDefaultForm());
  }, [initialData, open]);

  const canSubmit = useMemo(() => {
    return Boolean(form.name.trim() && restaurantId);
  }, [form.name, restaurantId]);

  const handleChange = <K extends keyof ModifierGroupForm>(
    key: K,
    value: ModifierGroupForm[K]
  ) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const handleNumberChange = (
    key: "minSelect" | "maxSelect" | "sortOrder",
    value: string
  ) => {
    handleChange(key, sanitizeNonNegativeNumber(value));
  };

  const handleClose = (value: boolean) => {
    if (isSubmitting) return;

    onOpenChange(value);

    if (!value) {
      setForm(getDefaultForm());
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit || !restaurantId) {
      toast.error(t("nameRequired"));
      return;
    }

    const basePayload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      minSelect: Number(form.minSelect),
      maxSelect: Number(form.maxSelect),
      sortOrder: Number(form.sortOrder),
    };
    const updatePayload = {
      ...basePayload,
      isActive: form.isActive,
    };

    const parsed = isEditMode
      ? updateModifierGroupSchema.safeParse(updatePayload)
      : modifierGroupSchema.safeParse({
          ...basePayload,
          restaurantId,
        });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || t("saveFailed"));
      return;
    }

    try {
      if (isEditMode && initialData?.id) {
        await updateModifierGroup({
          id: initialData.id,
          data: updatePayload,
        });
      } else {
        await createModifierGroup({
          ...basePayload,
          restaurantId,
        });
      }

      refresh();
      handleClose(false);
    } catch (error: unknown) {
      toast.error(
        getApiErrorMessage(
          error,
          isEditMode ? t("updateFailed") : t("createFailed")
        )
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-[420px] overflow-auto rounded-[20px] bg-[#F5F5F5] p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            {isEditMode ? t("editTitle") : t("addTitle")}
          </DialogTitle>

          <p className="text-sm text-gray-500">{t("description")}</p>
        </DialogHeader>

        <div className="mt-5 space-y-4 rounded-[16px] bg-white p-5">
          <InputField
            label={t("groupName")}
            value={form.name}
            onChange={(value) => handleChange("name", value)}
          />

          <InputField
            label={commonT("description")}
            value={form.description}
            onChange={(value) => handleChange("description", value)}
          />

          <InputField
            label={t("minSelect")}
            type="number"
            value={form.minSelect}
            onChange={(value) => handleNumberChange("minSelect", value)}
            onKeyDown={blockInvalidNumberKeys}
            onPaste={blockNegativeNumberPaste}
            min={0}
          />

          <InputField
            label={t("maxSelect")}
            type="number"
            value={form.maxSelect}
            onChange={(value) => handleNumberChange("maxSelect", value)}
            onKeyDown={blockInvalidNumberKeys}
            onPaste={blockNegativeNumberPaste}
            min={0}
          />

          <InputField
            label={t("sortOrder")}
            type="number"
            value={form.sortOrder}
            onChange={(value) => handleNumberChange("sortOrder", value)}
            onKeyDown={blockInvalidNumberKeys}
            onPaste={blockNegativeNumberPaste}
            min={0}
          />

          <Button
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
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onChange(event.target.value)
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
          ${className}
        `}
        {...inputProps}
      />
    </div>
  );
}
