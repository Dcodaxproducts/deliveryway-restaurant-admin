"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import FormInput from "@/components/register/form/FormInput";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import PageWrapper from "@/components/forms/Promotions/PageWrapper";
import Section from "@/components/forms/Promotions/Section";
import AsyncSelect from "@/components/ui/AsyncSelect";

import { useAuth } from "@/hooks/useAuth";
import {
  useCreateAdminHappyHour,
  useGetAdminHappyHourDetail,
  useUpdateAdminHappyHour,
} from "@/hooks/usePromotions";

import { getMenuItems } from "@/services/menu/menu.api";
import { getMenuCategories } from "@/services/menu/categories/menu-categories.api";

type DiscountType = "FLAT" | "PERCENTAGE";

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
  isActive: boolean;
  activeDays: number[];
  dailyStartTime: string;
  dailyEndTime: string;
};

const days = [
  { label: "Sunday", value: 0 },
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
];

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
  isActive: true,
  activeDays: [0, 1, 2, 3, 4, 5, 6],
  dailyStartTime: "",
  dailyEndTime: "",
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

export default function AddHappyHour() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const id = searchParams.get("id");
  const isEditMode = Boolean(id);

  const { user, restaurantId } = useAuth();
  const branchId = user?.branchId ?? "";

  const [form, setForm] = useState<FormState>(initialForm);
  const [selectedMenuItem, setSelectedMenuItem] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  const { data: detailResponse, isLoading: detailLoading } =
    useGetAdminHappyHourDetail(id ?? undefined);

  const createMutation = useCreateAdminHappyHour();
  const updateMutation = useUpdateAdminHappyHour();

  const submitting = createMutation.isPending || updateMutation.isPending;

  const pageTitle = isEditMode ? "Update Happy Hour" : "Add Happy Hour";

  useEffect(() => {
    if (!isEditMode || !detailResponse) return;

    const detail = normalizeDetail(detailResponse);
    if (!detail) return;

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
      isActive: Boolean(detail.isActive),
      activeDays:
        Array.isArray(detail.activeDays) && detail.activeDays.length > 0
          ? detail.activeDays
          : [0, 1, 2, 3, 4, 5, 6],
      dailyStartTime: detail.dailyStartTime ?? "",
      dailyEndTime: detail.dailyEndTime ?? "",
    });

    if (detail.scopeMenuItem) {
      setSelectedMenuItem(detail.scopeMenuItem);
    } else if (detail.scopeMenuItemId) {
      setSelectedMenuItem({
        id: detail.scopeMenuItemId,
        name: "Selected Menu Item",
      });
    }

    if (detail.scopeCategory) {
      setSelectedCategory(detail.scopeCategory);
    } else if (detail.scopeCategoryId) {
      setSelectedCategory({
        id: detail.scopeCategoryId,
        name: "Selected Category",
      });
    }
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

  const toggleDay = (day: number) => {
    setForm((prev) => {
      const exists = prev.activeDays.includes(day);

      return {
        ...prev,
        activeDays: exists
          ? prev.activeDays.filter((item) => item !== day)
          : [...prev.activeDays, day].sort((a, b) => a - b),
      };
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
    return {
      code: form.code.trim(),
      title: form.title.trim(),
      description: form.description.trim(),
      restaurantId,
      branchId: branchId || null,
      discountType: form.discountType,
      discountValue: toNumber(form.discountValue),
      maxDiscountAmount: toNumber(form.maxDiscountAmount),
      minOrderAmount: toNumber(form.minOrderAmount),
      maxUses: toNumber(form.maxUses),
      maxUsesPerCustomer: toNumber(form.maxUsesPerCustomer),
      startsAt: toISOStringOrNull(form.startsAt),
      expiresAt: toISOStringOrNull(form.expiresAt),
      scopeMenuItemId: selectedMenuItem?.id ?? null,
      scopeCategoryId: selectedCategory?.id ?? null,
      isActive: form.isActive,
      activeDays: form.activeDays,
      dailyStartTime: form.dailyStartTime,
      dailyEndTime: form.dailyEndTime,
    };
  }, [form, restaurantId, branchId, selectedMenuItem, selectedCategory]);

  const validateForm = () => {
    if (!restaurantId) {
      toast.error("Restaurant ID is missing.");
      return false;
    }

    if (!form.code.trim()) {
      toast.error("Happy hour code is required.");
      return false;
    }

    if (!form.title.trim()) {
      toast.error("Happy hour title is required.");
      return false;
    }

    if (!form.discountValue || Number(form.discountValue) <= 0) {
      toast.error("Discount value must be greater than 0.");
      return false;
    }

    if (!form.startsAt) {
      toast.error("Start date is required.");
      return false;
    }

    if (!form.expiresAt) {
      toast.error("Expiry date is required.");
      return false;
    }

    if (new Date(form.expiresAt).getTime() <= new Date(form.startsAt).getTime()) {
      toast.error("Expiry date must be after start date.");
      return false;
    }

    if (!form.dailyStartTime) {
      toast.error("Daily start time is required.");
      return false;
    }

    if (!form.dailyEndTime) {
      toast.error("Daily end time is required.");
      return false;
    }

    if (form.dailyEndTime <= form.dailyStartTime) {
      toast.error("Daily end time must be after daily start time.");
      return false;
    }

    if (form.activeDays.length === 0) {
      toast.error("Please select at least one active day.");
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

        toast.success("Happy hour updated successfully.");
      } else {
        await createMutation.mutateAsync(payload);

        toast.success("Happy hour created successfully.");
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
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-600">
            Do you want to activate the happy hour promotion?
          </p>

          <Switch
            checked={form.isActive}
            onCheckedChange={(checked) =>
              updateField("isActive", Boolean(checked))
            }
          />
        </div>

        <Section label="Setup Basic Info">
          <FormInput
            label="Happy Hour Code *"
            placeholder="eg. EVENING20"
            value={form.code}
            onChange={(val) => updateField("code", val)}
          />

          <FormInput
            label="Happy Hour Title *"
            placeholder="eg. Evening Happy Hour"
            value={form.title}
            onChange={(val) => updateField("title", val)}
          />

          <div className="space-y-2">
            <Label>Description</Label>
            <textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Write happy hour description"
              className="min-h-[110px] w-full rounded-md border border-[#BBBBBB] px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                onChange={(e) => updateField("expiresAt", e.target.value)}
                className="h-[44px] border-[#BBBBBB] focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[15px] font-medium">Active Days *</Label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {days.map((day) => (
                <label
                  key={day.value}
                  className="flex items-center gap-2 text-sm text-gray-600"
                >
                  <Checkbox
                    checked={form.activeDays.includes(day.value)}
                    onCheckedChange={() => toggleDay(day.value)}
                  />
                  {day.label}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Daily Start Time *</Label>
              <Input
                type="time"
                value={form.dailyStartTime}
                onChange={(e) =>
                  updateField("dailyStartTime", e.target.value)
                }
                className="h-[44px] border-[#BBBBBB] focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label>Daily End Time *</Label>
              <Input
                type="time"
                value={form.dailyEndTime}
                onChange={(e) => updateField("dailyEndTime", e.target.value)}
                className="h-[44px] border-[#BBBBBB] focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </Section>

        <Section label="Discount Setup">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label>Discount Type *</Label>
              <select
                value={form.discountType}
                onChange={(e) =>
                  updateField("discountType", e.target.value as DiscountType)
                }
                className="h-[44px] w-full rounded-md border border-[#BBBBBB] bg-white px-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
        </Section>

        <Section label="Happy Hour Scope">
          <div className="space-y-2">
            <Label className="text-[16px]">Select Food Item</Label>

            <AsyncSelect
              value={selectedMenuItem}
              onChange={(value) => {
                setSelectedMenuItem(value);
                setSelectedCategory(null);
              }}
              placeholder="Search food item"
              fetchOptions={fetchMenuItemOptions}
              labelKey="name"
              valueKey="id"
            />

            {selectedMenuItem && (
              <button
                type="button"
                onClick={() => setSelectedMenuItem(null)}
                className="text-sm text-primary"
              >
                Clear selected food item
              </button>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-[16px]">Select Food Category</Label>

            <AsyncSelect
              value={selectedCategory}
              onChange={(value) => {
                setSelectedCategory(value);
                setSelectedMenuItem(null);
              }}
              placeholder="Search category"
              fetchOptions={fetchCategoryOptions}
              labelKey="name"
              valueKey="id"
            />

            {selectedCategory && (
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="text-sm text-primary"
              >
                Clear selected category
              </button>
            )}
          </div>

          <p className="text-sm text-gray-500">
            Leave both fields empty if happy hour applies to all items.
          </p>
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
            className="h-[44px] rounded-lg bg-primary px-6 text-sm font-medium text-white disabled:opacity-60 inline-flex items-center gap-2"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {isEditMode ? "Update Happy Hour" : "Create Happy Hour"}
          </button>
        </div>
      </form>
    </PageWrapper>
  );
}