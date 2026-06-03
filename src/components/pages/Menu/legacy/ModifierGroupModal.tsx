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
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import AsyncSelect from "@/components/ui/AsyncSelect";
import {
  useAttachModifierGroupToCategory,
  useCreateModifierGroup,
  useUpdateModifierGroup,
} from "@/hooks/useMenus";
import { getMenuCategories } from "@/services/menu/categories/menu-categories.api";
import {
  blockInvalidNumberKeys,
  blockNegativeNumberPaste,
  sanitizeNonNegativeNumber,
} from "@/lib/number-input";
import { useTranslations } from "next-intl";

interface ModifierGroupForm {
  name: string;
  description: string;
  minSelect: string;
  maxSelect: string;
  isRequired: boolean;
  sortOrder: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: any;
  refresh: () => void;
}

const getDefaultForm = (): ModifierGroupForm => ({
  name: "",
  description: "",
  minSelect: "0",
  maxSelect: "1",
  isRequired: false,
  sortOrder: "0",
});

export default function ModifierGroupModal({
  open,
  onOpenChange,
  initialData,
  refresh,
}: Props) {
  const t = useTranslations("menu.modifierGroupModal");
  const commonT = useTranslations("common");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<ModifierGroupForm>(getDefaultForm());
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  const { mutateAsync: createModifierGroup, isPending: isCreating } =
    useCreateModifierGroup();

  const { mutateAsync: updateModifierGroup, isPending: isUpdating } =
    useUpdateModifierGroup();

  const {
    mutateAsync: attachModifierGroupToCategory,
    isPending: isAttaching,
  } = useAttachModifierGroupToCategory();

  const isLoading = isCreating || isUpdating || isAttaching;

  const resolveInitialCategory = async () => {
    const directCategory = initialData?.category || initialData?.menuCategory;

    if (directCategory?.id) {
      setSelectedCategory(directCategory);
      return;
    }

    const categoryId = initialData?.categoryIds?.[0];

    if (!categoryId) {
      setSelectedCategory(null);
      return;
    }

    const res = await getMenuCategories({
      page: 1,
      limit: 100,
      restaurantId: user?.restaurantId ?? undefined,
    });

    const categories = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.data?.data)
      ? res.data.data
      : [];

    const matchedCategory = categories.find(
      (category: any) => category.id === categoryId
    );

    setSelectedCategory(matchedCategory || null);
  };

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData?.name || "",
        description: initialData?.description || "",
        minSelect: sanitizeNonNegativeNumber(String(initialData?.minSelect ?? 0)),
        maxSelect: sanitizeNonNegativeNumber(String(initialData?.maxSelect ?? 1)),
        isRequired: Boolean(initialData?.isRequired),
        sortOrder: sanitizeNonNegativeNumber(String(initialData?.sortOrder ?? 0)),
      });

      resolveInitialCategory();
    } else {
      setForm(getDefaultForm());
      setSelectedCategory(null);
    }
  }, [initialData, open, user?.restaurantId]);

  const handleChange = <K extends keyof ModifierGroupForm>(
    key: K,
    value: ModifierGroupForm[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleNumberChange = (
    key: "minSelect" | "maxSelect" | "sortOrder",
    value: string
  ) => {
    handleChange(key, sanitizeNonNegativeNumber(value));
  };

  const handleClose = (value: boolean) => {
    onOpenChange(value);

    if (!value) {
      setForm(getDefaultForm());
      setSelectedCategory(null);
    }
  };

  const fetchCategoryOptions = async ({
    search,
    page,
  }: {
    search: string;
    page: number;
  }): Promise<{ data: any[]; meta?: any }> => {
    const res = await getMenuCategories({
      page,
      limit: 10,
      search,
      restaurantId: user?.restaurantId ?? undefined,
    });

    return {
      data: Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
        ? res.data.data
        : [],
      meta: res?.meta || res?.data?.meta,
    };
  };

  const extractCreatedGroupId = (res: any) => {
    return (
      res?.id ||
      res?.data?.id ||
      res?.data?.data?.id ||
      res?.modifierGroup?.id ||
      null
    );
  };

  const handleSubmit = async () => {
    const minSelect = Number(form.minSelect);
    const maxSelect = Number(form.maxSelect);
    const sortOrder = Number(form.sortOrder);

    if (!form.name.trim()) {
      toast.error(t("nameRequired"));
      return;
    }

    if (form.minSelect === "" || Number.isNaN(minSelect)) {
      toast.error(t("minInvalid"));
      return;
    }

    if (form.maxSelect === "" || Number.isNaN(maxSelect)) {
      toast.error(t("maxInvalid"));
      return;
    }

    if (form.sortOrder === "" || Number.isNaN(sortOrder)) {
      toast.error(t("sortInvalid"));
      return;
    }

    if (minSelect < 0) {
      toast.error(t("minNegative"));
      return;
    }

    if (maxSelect < 0) {
      toast.error(t("maxNegative"));
      return;
    }

    if (sortOrder < 0) {
      toast.error(t("sortNegative"));
      return;
    }

    if (maxSelect < minSelect) {
      toast.error(t("maxLessThanMin"));
      return;
    }

    if (!selectedCategory?.id) {
      toast.error(t("categoryRequired"));
      return;
    }

    const payload: any = {
      name: form.name.trim(),
      description: form.description.trim(),
      minSelect,
      maxSelect,
      isRequired: form.isRequired,
      sortOrder,
    };

    if (!initialData?.id) {
      payload.restaurantId = user?.restaurantId || "";
    }

    try {
      if (initialData?.id) {
        await updateModifierGroup({
          id: initialData.id,
          data: payload,
        });

        await attachModifierGroupToCategory({
          categoryId: selectedCategory.id,
          groupId: initialData.id,
          sortOrder: 0,
        });
      } else {
        const createdRes = await createModifierGroup(payload);
        const groupId = extractCreatedGroupId(createdRes);

        if (!groupId) {
          throw new Error("Modifier group created but no group id was returned");
        }

        await attachModifierGroupToCategory({
          categoryId: selectedCategory.id,
          groupId,
          sortOrder: 0,
        });
      }

      await queryClient.invalidateQueries({ queryKey: ["modifier-groups"] });
      await queryClient.invalidateQueries({ queryKey: ["menu-categories"] });

      refresh();
      handleClose(false);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          initialData?.id ? t("updateFailed") : t("createFailed")
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-[420px] overflow-auto rounded-[20px] bg-[#F5F5F5] p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            {initialData ? t("editTitle") : t("addTitle")}
          </DialogTitle>

          <p className="text-sm text-gray-500">
            {t("description")}
          </p>
        </DialogHeader>

        <div className="mt-5 space-y-4 rounded-[16px] bg-white p-5">
          <div className="space-y-1">
            <p className="text-sm text-gray-600">{commonT("category")}</p>
            <AsyncSelect
              value={selectedCategory}
              onChange={setSelectedCategory}
              placeholder={t("selectCategory")}
              fetchOptions={fetchCategoryOptions}
              labelKey="name"
              valueKey="id"
            />
          </div>

          <InputField
            label={t("groupName")}
            value={form.name}
            onChange={(v) => handleChange("name", v)}
          />

          <InputField
            label={commonT("description")}
            value={form.description}
            onChange={(v) => handleChange("description", v)}
          />

          <InputField
            label={t("minSelect")}
            type="number"
            value={form.minSelect}
            onChange={(v) => handleNumberChange("minSelect", v)}
            onKeyDown={blockInvalidNumberKeys}
            onPaste={blockNegativeNumberPaste}
            min={0}
          />

          <InputField
            label={t("maxSelect")}
            type="number"
            value={form.maxSelect}
            onChange={(v) => handleNumberChange("maxSelect", v)}
            onKeyDown={blockInvalidNumberKeys}
            onPaste={blockNegativeNumberPaste}
            min={0}
          />

          <InputField
            label={t("sortOrder")}
            type="number"
            value={form.sortOrder}
            onChange={(v) => handleNumberChange("sortOrder", v)}
            onKeyDown={blockInvalidNumberKeys}
            onPaste={blockNegativeNumberPaste}
            min={0}
          />

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={form.isRequired}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleChange("isRequired", e.target.checked)
              }
              className="accent-primary"
            />
            {t("required")}
          </label>

          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="mt-2 w-full rounded-[10px] bg-primary py-4"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin" size={18} />
                {commonT("saving")}
              </span>
            ) : initialData ? (
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
          ${className}
        `}
        {...inputProps}
      />
    </div>
  );
}
