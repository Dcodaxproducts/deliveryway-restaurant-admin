"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
} from "react";
import { toast } from "sonner";
import { useCreateModifier, useUpdateModifier } from "@/hooks/useModifiers";
import { useModifierGroups } from "@/hooks/useModifierGroups";
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
import { syncModifierGroupLinks } from "@/services/modifiers";

interface ModifierForm {
  categoryId: string;
  name: string;
  priceDelta: string;
  sortOrder: string;
  isActive: boolean;
  modifierGroupIds: string[];
}

const getEmptyForm = (): ModifierForm => ({
  categoryId: "",
  name: "",
  priceDelta: "0",
  sortOrder: "0",
  isActive: true,
  modifierGroupIds: [],
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
  const [isSyncingGroups, setIsSyncingGroups] = useState(false);

  const { data: modifierGroupsResponse, isLoading: isLoadingGroups } =
    useModifierGroups({
      restaurantId,
      page: 1,
      limit: 100,
    });
  const modifierGroups = useMemo(
    () => modifierGroupsResponse?.data ?? [],
    [modifierGroupsResponse?.data]
  );

  const isEditMode = Boolean(initialData?.id);
  const isSubmitting = isCreating || isUpdating || isSyncingGroups;

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
        modifierGroupIds:
          initialData.modifierGroups?.map((group) => group.id) ?? [],
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

  const toggleModifierGroup = (groupId: string) => {
    setForm((current) => ({
      ...current,
      modifierGroupIds: current.modifierGroupIds.includes(groupId)
        ? current.modifierGroupIds.filter((id) => id !== groupId)
        : [...current.modifierGroupIds, groupId],
    }));
  };

  const closeModal = () => {
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
    let modifierId = initialData?.id;

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
      const createdModifier = await createModifier({
        categoryId: basePayload.categoryId,
        name: basePayload.name,
        priceDelta: basePayload.priceDelta,
        sortOrder: basePayload.sortOrder,
        restaurantId: String(restaurantId),
      });
      modifierId = createdModifier?.id;
    }

    if (!modifierId) {
      throw new Error("Modifier was saved but no modifier id was returned");
    }

    setIsSyncingGroups(true);
    await syncModifierGroupLinks({
      modifierId,
      previousGroupIds:
        initialData?.modifierGroups?.map((group) => group.id) ?? [],
      nextGroupIds: form.modifierGroupIds,
      sortOrder,
    });

    setIsSyncingGroups(false);
    refresh?.();
    closeModal();
  } catch (error: unknown) {
    toast.error(getApiErrorMessage(error, t("saveFailed")));
  } finally {
    setIsSyncingGroups(false);
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
            <p className="text-xs leading-5 text-gray-500">
              {t("categoryHelp")}
            </p>
          </div>

          <InputField
            label={t("name")}
            value={form.name}
            onChange={(value: string) => handleChange("name", value)}
            placeholder={t("namePlaceholder")}
            disabled={isSubmitting}
          />

          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium text-gray-700">
                {t("modifierGroups")}
              </p>
              <p className="mt-1 text-xs leading-5 text-gray-500">
                {t("modifierGroupsHelp")}
              </p>
            </div>

            <div className="max-h-48 space-y-2 overflow-y-auto rounded-[12px] border border-gray-200 bg-[#FAFAFA] p-2">
              {isLoadingGroups ? (
                <div className="flex items-center justify-center gap-2 p-4 text-sm text-gray-500">
                  <Loader2 size={16} className="animate-spin" />
                  {t("loadingGroups")}
                </div>
              ) : modifierGroups.length === 0 ? (
                <p className="p-4 text-center text-sm text-gray-500">
                  {t("noGroups")}
                </p>
              ) : (
                modifierGroups.map((group) => {
                  const selected = form.modifierGroupIds.includes(group.id);

                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => toggleModifierGroup(group.id)}
                      disabled={isSubmitting}
                      aria-pressed={selected}
                      className={`flex w-full items-start gap-3 rounded-[10px] border p-3 text-left transition ${
                        selected
                          ? "border-primary bg-primary/5"
                          : "border-gray-100 bg-white hover:border-primary/30"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[6px] border ${
                          selected
                            ? "border-primary bg-primary text-white"
                            : "border-gray-300 text-transparent"
                        }`}
                      >
                        <Check size={14} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-gray-900">
                          {group.name}
                        </span>
                        <span className="mt-1 block text-xs text-gray-500">
                          {t("groupRules", {
                            min: group.minSelect,
                            max: group.maxSelect,
                          })}
                        </span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

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
