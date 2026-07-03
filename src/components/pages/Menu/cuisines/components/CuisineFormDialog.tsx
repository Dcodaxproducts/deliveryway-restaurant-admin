"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  blockInvalidNumberKeys,
  blockNegativeNumberPaste,
  sanitizeNonNegativeNumber,
} from "@/lib/number-input";
import { getApiErrorMessage } from "@/lib/errors";
import { useCreateCuisine, useUpdateCuisine } from "@/hooks/useCuisines";
import type { Cuisine } from "@/types/cuisines";
import {
  buildCuisineCreatePayload,
  buildCuisineUpdatePayload,
  cuisineSchema,
  updateCuisineSchema,
} from "@/validations/cuisines";
import { slugifyCuisineName } from "@/components/pages/Menu/cuisines/utils/cuisine-formatters";

type CuisineForm = {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  sortOrder: string;
  isActive: boolean;
};

type CuisineFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantId?: string;
  initialData?: Cuisine | null;
};

const getEmptyForm = (): CuisineForm => ({
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
  sortOrder: "0",
  isActive: true,
});

export default function CuisineFormDialog({
  open,
  onOpenChange,
  restaurantId,
  initialData,
}: CuisineFormDialogProps) {
  const [form, setForm] = useState<CuisineForm>(getEmptyForm());
  const [slugEdited, setSlugEdited] = useState(false);
  const { mutateAsync: createCuisine, isPending: isCreating } =
    useCreateCuisine();
  const { mutateAsync: updateCuisine, isPending: isUpdating } =
    useUpdateCuisine();

  const isEditMode = Boolean(initialData?.id);
  const isSubmitting = isCreating || isUpdating;

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      setForm({
        name: initialData.name,
        slug: initialData.slug,
        description: initialData.description ?? "",
        imageUrl: initialData.imageUrl ?? "",
        sortOrder: sanitizeNonNegativeNumber(String(initialData.sortOrder ?? 0)),
        isActive: initialData.isActive ?? true,
      });
      setSlugEdited(Boolean(initialData.slug));
      return;
    }

    setForm(getEmptyForm());
    setSlugEdited(false);
  }, [initialData, open]);

  const canSubmit = useMemo(
    () => Boolean(form.name.trim() && form.slug.trim() && restaurantId),
    [form.name, form.slug, restaurantId]
  );

  const closeDialog = () => {
    if (isSubmitting) return;

    setForm(getEmptyForm());
    setSlugEdited(false);
    onOpenChange(false);
  };

  const handleNameChange = (value: string) => {
    setForm((previous) => ({
      ...previous,
      name: value,
      slug: slugEdited ? previous.slug : slugifyCuisineName(value),
    }));
  };

  const handleSubmit = async () => {
    if (!canSubmit || !restaurantId) {
      toast.error("Cuisine name, slug, and restaurant context are required.");
      return;
    }

    const sortOrder = Number(form.sortOrder);

    if (form.sortOrder === "" || Number.isNaN(sortOrder)) {
      toast.error("Sort order must be a valid number.");
      return;
    }

    const basePayload = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugifyCuisineName(form.name),
      description: form.description.trim(),
      imageUrl: form.imageUrl.trim(),
      sortOrder,
      isActive: form.isActive,
    };

    try {
      if (isEditMode && initialData?.id) {
        const parsed = updateCuisineSchema.safeParse(basePayload);

        if (!parsed.success) {
          toast.error(parsed.error.issues[0]?.message || "Invalid cuisine data.");
          return;
        }

        await updateCuisine({
          id: initialData.id,
          data: buildCuisineUpdatePayload(parsed.data),
        });
      } else {
        const parsed = cuisineSchema.safeParse({
          ...basePayload,
          restaurantId,
        });

        if (!parsed.success) {
          toast.error(parsed.error.issues[0]?.message || "Invalid cuisine data.");
          return;
        }

        await createCuisine(buildCuisineCreatePayload(parsed.data));
      }

      closeDialog();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Unable to save cuisine."));
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          closeDialog();
          return;
        }

        onOpenChange(value);
      }}
    >
      <DialogContent className="max-h-[95vh] max-w-[560px] overflow-auto rounded-[20px] bg-[#F5F5F5] p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            {isEditMode ? "Edit cuisine" : "Add cuisine"}
          </DialogTitle>

          <p className="text-sm text-gray-500">
            Manage cuisines such as Italian, Pakistani, Chinese, and Mexican.
          </p>
        </DialogHeader>

        <div className="mt-5 space-y-4 rounded-[16px] bg-white p-5">
          <InputField
            label="Name"
            value={form.name}
            onChange={handleNameChange}
            placeholder="Italian"
            disabled={isSubmitting}
          />

          <InputField
            label="Slug"
            value={form.slug}
            onChange={(value) => {
              setSlugEdited(true);
              setForm((previous) => ({
                ...previous,
                slug: slugifyCuisineName(value),
              }));
            }}
            placeholder="italian"
            disabled={isSubmitting}
          />

          <div className="space-y-1">
            <p className="text-sm text-gray-600">Description</p>
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  description: event.target.value,
                }))
              }
              rows={3}
              placeholder="Cuisine description"
              disabled={isSubmitting}
              className="w-full rounded-[10px] border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <InputField
            label="Image URL"
            value={form.imageUrl}
            onChange={(value) =>
              setForm((previous) => ({ ...previous, imageUrl: value }))
            }
            placeholder="https://example.com/cuisine.jpg"
            disabled={isSubmitting}
          />

          <InputField
            label="Sort order"
            type="number"
            value={form.sortOrder}
            onChange={(value) =>
              setForm((previous) => ({
                ...previous,
                sortOrder: sanitizeNonNegativeNumber(value),
              }))
            }
            onKeyDown={blockInvalidNumberKeys}
            onPaste={blockNegativeNumberPaste}
            min={0}
            disabled={isSubmitting}
          />

          {isEditMode ? (
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    isActive: event.target.checked,
                  }))
                }
                disabled={isSubmitting}
                className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              Active
            </label>
          ) : null}

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="mt-2 w-full rounded-[10px] bg-primary py-4"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin" size={18} />
                Saving
              </span>
            ) : isEditMode ? (
              "Update cuisine"
            ) : (
              "Create cuisine"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type InputFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: "text" | "number";
  min?: number;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  onPaste?: React.ClipboardEventHandler<HTMLInputElement>;
};

function InputField({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  type = "text",
  min,
  onKeyDown,
  onPaste,
}: InputFieldProps) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-gray-600">{label}</p>
      <input
        type={type}
        value={value}
        min={min}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        disabled={disabled}
        className="h-[42px] w-full rounded-[10px] border border-gray-300 px-3 text-sm outline-none focus:border-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </div>
  );
}
