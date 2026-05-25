"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronDown, Loader2, PlusCircle } from "lucide-react";
import FormInput from "@/components/register/form/FormInput";
import { toast } from "sonner";
import {
  useCreateMenuCategory,
  useUpdateMenuCategory,
} from "@/hooks/useMenuCategories";
import ImageDropzoneUpload from "@/components/ui/ImageDropzoneUpload";

interface CreateMenuModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: any;
  onSuccess?: () => void;
}

const SORT_ORDER_OPTIONS = [
  { label: "Top Priority", value: 0 },
  { label: "High Priority", value: 10 },
  { label: "Medium Priority", value: 50 },
  { label: "Low Priority", value: 100 },
];

const revokeBlobUrl = (url?: string | null) => {
  if (url?.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
};

const buildSlug = (value: string) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");

const getInitialForm = (restaurantId?: string, initialData?: any) => ({
  name: initialData?.name || "",
  slug: initialData?.slug || "",
  description: initialData?.description || "",
  imageUrl: initialData?.imageUrl || "",
  imagePreview: initialData?.imageUrl || "",
  sortOrder:
    initialData?.sortOrder !== undefined && initialData?.sortOrder !== null
      ? Number(initialData.sortOrder)
      : 0,
  isActive:
    typeof initialData?.isActive === "boolean" ? initialData.isActive : true,
  parentCategoryId:
    initialData?.parentCategoryId || initialData?.parentCategory?.id || "",
  restaurantId: restaurantId || initialData?.restaurantId || "",
});

export default function CreateCategoryModalParent({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: CreateMenuModalProps) {
  const { restaurantId: authRestaurantId } = useAuth();

const restaurantId = authRestaurantId ?? undefined;

  const { mutate: createMenuCategory, isPending: isCreating } =
    useCreateMenuCategory();

  const { mutate: updateMenuCategory, isPending: isUpdating } =
    useUpdateMenuCategory();

  const isEditMode = Boolean(initialData?.id);
  const isSubmitting = isCreating || isUpdating;

  const [form, setForm] = useState(getInitialForm(restaurantId, initialData));
  const [imageUploading, setImageUploading] = useState(false);

  const imagePreviewRef = useRef<string | null>(form.imagePreview || null);

  const isBusy = isSubmitting || imageUploading;

  useEffect(() => {
    imagePreviewRef.current = form.imagePreview || null;
  }, [form.imagePreview]);

  useEffect(() => {
    return () => {
      revokeBlobUrl(imagePreviewRef.current);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    setForm((prev: any) => {
      revokeBlobUrl(prev.imagePreview);

      return getInitialForm(restaurantId, initialData);
    });
  }, [open, restaurantId, initialData]);

  const updateForm = (key: string, value: any) => {
    if (key === "name") {
      const slug = buildSlug(value);

      setForm((prev) => ({
        ...prev,
        name: value,
        slug:
          !initialData?.id || prev.slug === initialData?.slug || !prev.slug
            ? slug
            : prev.slug,
      }));

      return;
    }

    setForm((prev) => ({
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
      revokeBlobUrl(prev.imagePreview);

      return {
        ...prev,
        imageUrl: "",
        imagePreview: "",
      };
    });
  };

  const payload = useMemo(
    () => ({
      restaurantId: restaurantId || undefined,
      parentCategoryId: form.parentCategoryId || undefined,
      name: form.name?.trim(),
      slug: form.slug?.trim() || buildSlug(form.name),
      description: form.description || "",
      imageUrl: form.imageUrl || "",
      sortOrder: Number(form.sortOrder || 0),
      isActive: Boolean(form.isActive),
    }),
    [form, restaurantId]
  );

  const resetForm = () => {
    setForm((prev: any) => {
      revokeBlobUrl(prev.imagePreview);

      return getInitialForm(restaurantId);
    });
  };

  const handleClose = () => {
    if (isBusy) return;

    onOpenChange(false);
    resetForm();
  };

  const handleSubmit = () => {
    if (imageUploading) {
      toast.error("Please wait until image upload is complete");
      return;
    }

    if (!payload.name) {
      toast.error("Category name is required");
      return;
    }

    if (!restaurantId && !isEditMode) {
      toast.error("Restaurant id is missing");
      return;
    }

    if (isEditMode) {
      const { restaurantId: _restaurantId, ...updatePayload } = payload;

      updateMenuCategory(
        {
          id: initialData.id,
          data: updatePayload,
        },
        {
          onSuccess: () => {
            onSuccess?.();
            onOpenChange(false);
            resetForm();
          },
          onError: (err: any) => {
            toast.error(
              err?.response?.data?.message || "Failed to update category"
            );
          },
        }
      );

      return;
    }

    createMenuCategory(payload as any, {
      onSuccess: () => {
        onSuccess?.();
        onOpenChange(false);
        resetForm();
        toast.success("Category created successfully");
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to create category");
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (isBusy) return;

        if (!value) {
          handleClose();
          return;
        }

        onOpenChange(value);
      }}
    >
      <DialogContent className="max-h-[95vh] max-w-[420px] overflow-auto rounded-[20px] bg-[#F5F5F5] p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-2xl font-semibold">
            {isEditMode ? "Update Category" : "Create Category"}
          </DialogTitle>

          <p className="text-sm text-gray-500">
            {isEditMode
              ? "Update restaurant category details"
              : "Create restaurant category"}
          </p>
        </DialogHeader>

        <div className="mt-5 space-y-4 rounded-[16px] bg-white p-5">
          <FormInput
            label="Category Name"
            placeholder="e.g Burgers"
            value={form.name}
            onChange={(v) => updateForm("name", v)}
            required
          />

          <FormInput
            label="Description"
            placeholder="Short category description"
            value={form.description}
            onChange={(v) => updateForm("description", v)}
          />

          <ImageDropzoneUpload
            label="Image"
            value={form.imageUrl}
            previewUrl={form.imagePreview}
            onChange={handleImageUrlChange}
            onPreviewChange={handleImagePreviewChange}
            onClear={handleClearImage}
            disabled={isSubmitting}
            onUploadingChange={setImageUploading}
            previewAlt="Category preview"
            previewHeightClassName="h-[180px]"
            emptyTitle="Drag & drop category image here"
          />

          {/* <div className="space-y-2">
            <label className="text-sm font-medium">Display Priority</label>

            <div className="relative">
              <select
                value={String(form.sortOrder)}
                onChange={(e) =>
                  updateForm("sortOrder", Number(e.target.value))
                }
                disabled={isBusy}
                className="h-11 w-full appearance-none rounded-[10px] border border-[#BBBBBB] bg-white px-4 pr-12 text-sm text-gray-600 outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
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

            <p className="text-xs text-gray-500">
              Top priority categories appear first in the menu.
            </p>
          </div> */}

          <label className="flex cursor-pointer items-center justify-between rounded-[12px] border border-gray-100 bg-[#FAFAFA] px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-800">
                Active Status
              </p>
              <p className="text-xs text-gray-500">
                Show this category in active menu flows.
              </p>
            </div>

            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => updateForm("isActive", e.target.checked)}
              disabled={isBusy}
              className="h-4 w-4 accent-primary disabled:cursor-not-allowed"
            />
          </label>
        </div>

        <div className="mt-5 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            className="rounded-[10px] px-6 py-2 text-[16px] text-gray-700"
            onClick={handleClose}
            disabled={isBusy}
          >
            Close
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            className="rounded-[10px] bg-primary px-6 py-2 text-[16px] hover:bg-primary/90"
            disabled={isBusy}
          >
            {isBusy ? (
              <>
                <Loader2 className="mr-2 animate-spin" size={18} />
                {imageUploading
                  ? "Uploading..."
                  : isEditMode
                  ? "Updating..."
                  : "Creating..."}
              </>
            ) : isEditMode ? (
              <>
                <PlusCircle size={18} />
                Update
              </>
            ) : (
              <>
                <PlusCircle size={18} />
                Create
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}