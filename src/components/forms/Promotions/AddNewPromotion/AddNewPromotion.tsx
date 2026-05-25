"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import FormInput from "@/components/register/form/FormInput";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import PageWrapper from "@/components/forms/Promotions/PageWrapper";
import Section from "@/components/forms/Promotions/Section";
import AsyncSelect from "@/components/ui/AsyncSelect";
import AsyncMultiSelect from "@/components/ui/AsyncMultiSelect";

import { useAuth } from "@/hooks/useAuth";
import {
  useCreateAdminPromotionCampaign,
  useGetAdminPromotionCampaignDetail,
  useUpdateAdminPromotionCampaign,
} from "@/hooks/usePromotions";

import { getBranches } from "@/services/branches/branches.api";
import { getMenuItems } from "@/services/menu/menu.api";
import { getMenuCategories } from "@/services/menu/categories/menu-categories.api";

type DiscountType = "FLAT" | "PERCENTAGE";
type ApplyMode = "ORDER_TOTAL" | "SCOPED_ITEMS";

type FormState = {
  code: string;
  title: string;
  description: string;
  discountType: DiscountType;
  discountValue: string;
  maxDiscountAmount: string;
  minOrderAmount: string;
  maxUses: string;
  maxUsesPerCustomer: string;
  startsAt: string;
  expiresAt: string;
  applyMode: ApplyMode;
  autoApply: boolean;
  isActive: boolean;
  assignPermanently: boolean;
};

const initialForm: FormState = {
  code: "",
  title: "",
  description: "",
  discountType: "FLAT",
  discountValue: "",
  maxDiscountAmount: "",
  minOrderAmount: "",
  maxUses: "",
  maxUsesPerCustomer: "",
  startsAt: "",
  expiresAt: "",
  applyMode: "ORDER_TOTAL",
  autoApply: true,
  isActive: true,
  assignPermanently: false,
};

const toDatetimeLocal = (value?: string | null) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 16);
};

const toISOStringOrNull = (value: string) => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
};

const toNumber = (value: string) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const normalizeDetail = (response: any) => {
  return response?.data?.data ?? response?.data ?? response ?? null;
};

const getOptionId = (option: any) => {
  return String(option?.id ?? option?.value ?? option?._id ?? "").trim();
};

const getIds = (options: any[]) => {
  return Array.from(
    new Set(
      (Array.isArray(options) ? options : [])
        .map((option) => getOptionId(option))
        .filter(Boolean)
    )
  );
};

const normalizeSelectedOptions = ({
  records,
  ids,
  singleRecord,
  singleId,
  fallbackLabel,
}: {
  records?: any[];
  ids?: string[];
  singleRecord?: any;
  singleId?: string | null;
  fallbackLabel: string;
}) => {
  const map = new Map<string, any>();

  const pushOption = (option: any, fallbackId?: string) => {
    const id = String(
      option?.id ?? option?.value ?? option?._id ?? fallbackId ?? ""
    ).trim();

    if (!id) return;

    map.set(id, {
      ...option,
      id,
      name:
        option?.name ||
        option?.title ||
        option?.label ||
        `${fallbackLabel} ${map.size + 1}`,
    });
  };

  if (Array.isArray(records)) {
    records.forEach((record) => pushOption(record));
  }

  if (Array.isArray(ids)) {
    ids.forEach((id) =>
      pushOption({ id, name: `${fallbackLabel} ${map.size + 1}` })
    );
  }

  if (singleRecord) {
    pushOption(singleRecord, singleId || undefined);
  } else if (singleId) {
    pushOption({ id: singleId, name: `Selected ${fallbackLabel}` });
  }

  return Array.from(map.values());
};

export default function AddNewPromotion() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const isEditMode = Boolean(id);

  const { user, restaurantId, isBranchAdmin } = useAuth();

  const authBranchId = user?.branchId ?? "";

  const [form, setForm] = useState<FormState>(initialForm);
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [selectedMenuItems, setSelectedMenuItems] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<any[]>([]);

  const { data: detailResponse, isLoading: detailLoading } =
    useGetAdminPromotionCampaignDetail(id ?? undefined, {
      restaurantId,
      branchId: authBranchId,
    });

  const createMutation = useCreateAdminPromotionCampaign();
  const updateMutation = useUpdateAdminPromotionCampaign();

  const submitting = createMutation.isPending || updateMutation.isPending;

  const pageTitle = isEditMode ? "Update Promotion" : "Add New Promotion";

  useEffect(() => {
    if (isEditMode || !isBranchAdmin) return;
    if (!authBranchId || selectedBranch) return;

    setSelectedBranch({
      id: authBranchId,
      name: "Current Branch",
    });
  }, [authBranchId, isBranchAdmin, isEditMode, selectedBranch]);

  useEffect(() => {
    if (!isEditMode || !detailResponse) return;

    const detail = normalizeDetail(detailResponse);

    if (!detail) return;

    const detailAutoApply = Boolean(detail.autoApply ?? !detail.code);
    const detailApplyMode: ApplyMode =
      detail.applyMode === "SCOPED_ITEMS" ? "SCOPED_ITEMS" : "ORDER_TOTAL";

    setForm({
      code: detail.code ?? "",
      title: detail.title ?? "",
      description: detail.description ?? "",
      discountType: detail.discountType ?? "FLAT",
      discountValue: String(detail.discountValue ?? ""),
      maxDiscountAmount: String(detail.maxDiscountAmount ?? ""),
      minOrderAmount: String(detail.minOrderAmount ?? ""),
      maxUses: String(detail.maxUses ?? ""),
      maxUsesPerCustomer: String(detail.maxUsesPerCustomer ?? ""),
      startsAt: toDatetimeLocal(detail.startsAt),
      expiresAt: toDatetimeLocal(detail.expiresAt),
      applyMode: detailApplyMode,
      autoApply: detailAutoApply,
      isActive: Boolean(detail.isActive),
      assignPermanently: !detail.expiresAt,
    });

    if (detail.branch) {
      setSelectedBranch(detail.branch);
    } else if (detail.branchId) {
      setSelectedBranch({
        id: detail.branchId,
        name: "Selected Branch",
      });
    }

    setSelectedMenuItems(
      normalizeSelectedOptions({
        records: detail.scopeMenuItems,
        ids: detail.scopeMenuItemIds,
        singleRecord: detail.scopeMenuItem,
        singleId: detail.scopeMenuItemId,
        fallbackLabel: "Menu Item",
      })
    );

    setSelectedCategories(
      normalizeSelectedOptions({
        records: detail.scopeCategories,
        ids: detail.scopeCategoryIds,
        singleRecord: detail.scopeCategory,
        singleId: detail.scopeCategoryId,
        fallbackLabel: "Category",
      })
    );
  }, [detailResponse, isEditMode]);

  const updateField = <K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const selectedBranchId = isBranchAdmin
    ? getOptionId(selectedBranch) || authBranchId || ""
    : getOptionId(selectedBranch) || "";

  const fetchBranchOptions = async ({ search }: { search: string; page: number }) => {
    return getBranches({
      search,
      sortOrder: "ASC",
      includeInactive: true,
      restaurantId: restaurantId ?? undefined,
    });
  };

  const fetchMenuItemOptions = async ({
    search,
    page,
  }: {
    search: string;
    page: number;
  }) => {
    return getMenuItems({
      page,
      limit: 10,
      search,
      restaurantId: restaurantId ?? undefined,
    });
  };

  const fetchCategoryOptions = async ({
    search,
    page,
  }: {
    search: string;
    page: number;
  }) => {
    return getMenuCategories({
      page,
      limit: 10,
      search,
      restaurantId: restaurantId ?? undefined,
    });
  };

  const payload = useMemo(() => {
    const scopeMenuItemIds =
      form.applyMode === "SCOPED_ITEMS" ? getIds(selectedMenuItems) : [];

    const scopeCategoryIds =
      form.applyMode === "SCOPED_ITEMS" ? getIds(selectedCategories) : [];

    const trimmedCode = form.code.trim();

    return {
      ...(form.autoApply || !trimmedCode ? {} : { code: trimmedCode }),
      title: form.title.trim(),
      description: form.description.trim(),
      restaurantId,
      branchId: selectedBranchId || undefined,
      discountType: form.discountType,
      discountValue: toNumber(form.discountValue),
      maxDiscountAmount: toNumber(form.maxDiscountAmount),
      minOrderAmount: toNumber(form.minOrderAmount),
      maxUses: toNumber(form.maxUses),
      maxUsesPerCustomer: toNumber(form.maxUsesPerCustomer),
      startsAt: toISOStringOrNull(form.startsAt),
      expiresAt: form.assignPermanently
        ? null
        : toISOStringOrNull(form.expiresAt),
      scopeMenuItemId: scopeMenuItemIds[0] ?? null,
      scopeCategoryId: scopeCategoryIds[0] ?? null,
      scopeMenuItemIds,
      scopeCategoryIds,
      applyMode: form.applyMode,
      autoApply: form.autoApply,
      isActive: form.isActive,
    };
  }, [
    form,
    restaurantId,
    selectedBranchId,
    selectedMenuItems,
    selectedCategories,
  ]);

  const validateForm = () => {
    if (!restaurantId) {
      toast.error("Restaurant ID is missing.");
      return false;
    }

    if (!form.title.trim()) {
      toast.error("Offer title is required.");
      return false;
    }

    if (!form.discountValue || Number(form.discountValue) <= 0) {
      toast.error("Discount value must be greater than 0.");
      return false;
    }

    if (
      form.discountType === "PERCENTAGE" &&
      Number(form.discountValue) > 100
    ) {
      toast.error("Percentage discount cannot be greater than 100.");
      return false;
    }

    if (!form.startsAt) {
      toast.error("Start date is required.");
      return false;
    }

    if (!form.assignPermanently && !form.expiresAt) {
      toast.error("Expiry date is required.");
      return false;
    }

    if (
      !form.assignPermanently &&
      new Date(form.expiresAt).getTime() <= new Date(form.startsAt).getTime()
    ) {
      toast.error("Expiry date must be after start date.");
      return false;
    }

    if (
      form.applyMode === "SCOPED_ITEMS" &&
      selectedMenuItems.length === 0 &&
      selectedCategories.length === 0
    ) {
      toast.error("Select at least one item or category for scoped promotion.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      if (isEditMode && id) {
        await updateMutation.mutateAsync({
          id,
          payload,
        });

        toast.success("Promotion updated successfully.");
      } else {
        await createMutation.mutateAsync(payload);

        toast.success("Promotion created successfully.");
      }

      router.push("/promotion-management");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Something went wrong."
      );
    }
  };

  if (detailLoading && isEditMode) {
    return (
      <PageWrapper title={pageTitle}>
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title={pageTitle}>
      <form onSubmit={handleSubmit} className="space-y-8">
        <Section label="Setup Basic Info">
          {/* Branch selection is intentionally hidden for now.
          <div className="space-y-2">
            <Label className="text-[16px]">
              Branch{isBranchAdmin ? " *" : " (optional)"}
            </Label>
            <p className="text-sm text-gray-500">
              {isBranchAdmin
                ? "Select the branch where this promotion should be available."
                : "Leave blank to make this promotion available across all branches, or choose a branch to scope it."}
            </p>

            {isBranchAdmin ? (
              <div className="rounded-[12px] border border-primary/10 bg-primary/5 px-4 py-3 text-sm font-medium text-gray-800">
                {selectedBranch?.name || "Current Branch"}
              </div>
            ) : (
              <AsyncSelect
                value={selectedBranch}
                onChange={setSelectedBranch}
                placeholder="Search branch (optional)"
                fetchOptions={fetchBranchOptions}
                labelKey="name"
                valueKey="id"
              />
            )}
          </div>
          */}

          <FormInput
            label="Offer Title *"
            placeholder="eg. 20% Off On Orders"
            value={form.title}
            onChange={(val) => updateField("title", val)}
          />

          <div className="space-y-2">
            <Label>Description</Label>
            <textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Write promotion description"
              className="min-h-[110px] w-full rounded-md border border-[#BBBBBB] px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="rounded-xl border border-primary/10 bg-primary/5 p-4">
            <label className="flex items-start gap-3 text-sm text-gray-700">
              <Checkbox
                checked={form.autoApply}
                onCheckedChange={(checked) =>
                  updateField("autoApply", Boolean(checked))
                }
              />

              <span>
                <span className="block font-medium text-gray-900">
                  Auto-apply promotion
                </span>
                <span className="mt-1 block text-xs leading-5 text-gray-500">
                  When enabled, customers do not need a coupon code. The
                  frontend will not send a code for this promotion.
                </span>
              </span>
            </label>
          </div>

          {!form.autoApply ? (
            <FormInput
              label="Promotion Code (optional)"
              placeholder="eg. SUMMER20"
              value={form.code}
              onChange={(val) => updateField("code", val)}
            />
          ) : null}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Discount Type *</Label>
              <select
                value={form.discountType}
                onChange={(e) =>
                  updateField("discountType", e.target.value as DiscountType)
                }
                className="h-[52px] w-full rounded-md border border-[#BBBBBB] bg-white px-4 text-base outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="FLAT">Flat Discount</option>
                <option value="PERCENTAGE">Percentage Discount</option>
              </select>
            </div>

            <FormInput
              label="Discount Value *"
              type="number"
              placeholder="eg. 20"
              value={form.discountValue}
              onChange={(val) => updateField("discountValue", val)}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FormInput
              label="Minimum Order Amount"
              type="number"
              placeholder="eg. 100"
              value={form.minOrderAmount}
              onChange={(val) => updateField("minOrderAmount", val)}
            />

            <FormInput
              label="Maximum Discount Amount"
              type="number"
              placeholder="eg. 50"
              value={form.maxDiscountAmount}
              onChange={(val) => updateField("maxDiscountAmount", val)}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FormInput
              label="Maximum Uses"
              type="number"
              placeholder="eg. 100"
              value={form.maxUses}
              onChange={(val) => updateField("maxUses", val)}
            />

            <FormInput
              label="Maximum Uses Per Customer"
              type="number"
              placeholder="eg. 1"
              value={form.maxUsesPerCustomer}
              onChange={(val) => updateField("maxUsesPerCustomer", val)}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Starts At *</Label>
              <Input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => updateField("startsAt", e.target.value)}
                className="h-[44px] border-[#BBBBBB] focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label>Expires At *</Label>
              <Input
                type="datetime-local"
                value={form.expiresAt}
                disabled={form.assignPermanently}
                onChange={(e) => updateField("expiresAt", e.target.value)}
                className="h-[44px] border-[#BBBBBB] focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:bg-gray-100"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <Checkbox
              checked={form.assignPermanently}
              onCheckedChange={(checked) =>
                updateField("assignPermanently", Boolean(checked))
              }
            />
            Assign this offer permanently
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <Checkbox
              checked={form.isActive}
              onCheckedChange={(checked) =>
                updateField("isActive", Boolean(checked))
              }
            />
            Active promotion
          </label>
        </Section>

        <Section label="Promotion Scope">
          <div className="space-y-2">
            <Label>Apply Mode *</Label>
            <select
              value={form.applyMode}
              onChange={(e) =>
                updateField("applyMode", e.target.value as ApplyMode)
              }
              className="h-[44px] w-full rounded-md border border-[#BBBBBB] bg-white px-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="ORDER_TOTAL">
                Order Total - apply discount on full order
              </option>
              <option value="SCOPED_ITEMS">
                Scoped Items - apply only on selected items/categories
              </option>
            </select>

            <p className="text-sm text-gray-500">
              ORDER_TOTAL discounts the full order total. SCOPED_ITEMS discounts
              only matching items and/or categories.
            </p>
          </div>

          {form.applyMode === "SCOPED_ITEMS" ? (
            <>
              <div className="space-y-2">
                <Label className="text-[16px]">Select Food Items</Label>
                <p className="text-sm text-gray-500">
                  Select one or more food items. The promotion can be scoped to
                  only items, only categories, or both.
                </p>

                <AsyncMultiSelect
                  value={selectedMenuItems}
                  onChange={setSelectedMenuItems}
                  placeholder="Search and select food items"
                  fetchOptions={fetchMenuItemOptions}
                  labelKey="name"
                  valueKey="id"
                />

                {selectedMenuItems.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setSelectedMenuItems([])}
                    className="text-sm text-primary"
                  >
                    Clear selected food items
                  </button>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label className="text-[16px]">Select Food Categories</Label>
                <p className="text-sm text-gray-500">
                  Select one or more categories. All matching items inside these
                  categories can receive the discount.
                </p>

                <AsyncMultiSelect
                  value={selectedCategories}
                  onChange={setSelectedCategories}
                  placeholder="Search and select categories"
                  fetchOptions={fetchCategoryOptions}
                  labelKey="name"
                  valueKey="id"
                />

                {selectedCategories.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setSelectedCategories([])}
                    className="text-sm text-primary"
                  >
                    Clear selected categories
                  </button>
                ) : null}
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-500">
              This promotion applies to the full eligible order total. No item
              or category scope is needed.
            </div>
          )}
        </Section>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={submitting}
            className="h-[44px] rounded-lg border px-6 text-sm font-medium text-gray-600 disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-[44px] items-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {isEditMode ? "Update Promotion" : "Create Promotion"}
          </button>
        </div>
      </form>
    </PageWrapper>
  );
}
