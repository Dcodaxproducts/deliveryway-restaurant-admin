"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import FormInput from "@/components/register/form/FormInput";
import PageWrapper from "@/components/forms/Promotions/PageWrapper";
import Section from "@/components/forms/Promotions/Section";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHttpClient } from "@/hooks/useHttpClient";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const isApiError = (res: any) => {
  return !res || Boolean(res?.error) || res?.success === false;
};

const getApiErrorMessage = (res: any, fallback: string) => {
  if (!res) return fallback;

  if (typeof res?.error === "string") return res.error;
  if (typeof res?.error?.message === "string") return res.error.message;
  if (typeof res?.message === "string") return res.message;
  if (typeof res?.data?.message === "string") return res.data.message;

  return fallback;
};

const normalizeApiArray = (res: any) => {
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.items)) return res.items;
  return [];
};

export default function AddNewCoupon() {
  const { token, restaurantId: authRestaurantId, user } = useAuth();
  const { get, post, patch } = useHttpClient(token);
  const router = useRouter();
  const searchParams = useSearchParams();

  const couponCode = searchParams.get("coupon");

  const [saving, setSaving] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [couponId, setCouponId] = useState("");

  const [branches, setBranches] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);

  const [form, setForm] = useState<any>({
    code: "",
    title: "",
    discountType: "FLAT",
    discountValue: "",
    startsAt: "",
    expiresAt: "",
    description: "",
    branchId: "",
    maxDiscountAmount: "",
    minOrderAmount: "",
    maxUses: "",
    maxUsesPerCustomer: "",
    scopeMenuItemId: "",
    scopeCategoryId: "",
  });

  const getStoredAuth = () => {
    if (typeof window === "undefined") return null;

    try {
      const stored = localStorage.getItem("auth");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const restaurantId = useMemo(() => {
    const stored = getStoredAuth();

    return (
      authRestaurantId ||
      user?.restaurantId ||
      stored?.user?.restaurantId ||
      ""
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authRestaurantId, user?.restaurantId]);

  const formatDate = (date: string) => {
    if (!date) return "";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return "";

    return parsed.toISOString().slice(0, 16);
  };

  const toOptionalNumber = (value: any) => {
    if (value === "" || value === null || value === undefined) return undefined;

    const numeric = Number(value);

    return Number.isFinite(numeric) ? numeric : undefined;
  };

  const cleanPayload = (payload: Record<string, any>) => {
    return Object.fromEntries(
      Object.entries(payload).filter(([, value]) => {
        return value !== undefined && value !== null && value !== "";
      })
    );
  };

  /* ================= FETCH BASE DATA ================= */

  useEffect(() => {
    const fetchData = async () => {
      if (!restaurantId || !token) return;

      const [branchRes, itemRes] = await Promise.all([
        get(`/v1/branches?restaurantId=${restaurantId}`),
        get(`/v1/menu/items?restaurantId=${restaurantId}`),
      ]);

      if (!isApiError(branchRes)) {
        setBranches(normalizeApiArray(branchRes));
      }

      if (!isApiError(itemRes)) {
        setItems(normalizeApiArray(itemRes));
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, restaurantId]);

  /* ================= FETCH EDIT DATA ================= */

  useEffect(() => {
    const fetchCoupon = async () => {
      if (!couponCode || !token) return;

      setIsEdit(true);

      const params = new URLSearchParams({
        search: couponCode,
      });

      if (restaurantId) {
        params.set("restaurantId", restaurantId);
      }

      const res = await get(`/v1/coupons?${params.toString()}`);

      if (isApiError(res)) {
        return;
      }

      const coupons = normalizeApiArray(res);
      const coupon = coupons?.[0];

      if (!coupon) {
        toast.error("Coupon not found");
        return;
      }

      setCouponId(coupon.id);

      setForm({
        code: coupon.code || "",
        title: coupon.title || "",
        discountType: coupon.discountType || "FLAT",
        discountValue: coupon.discountValue ?? "",
        startsAt: formatDate(coupon.startsAt),
        expiresAt: formatDate(coupon.expiresAt),
        description: coupon.description || "",
        branchId: coupon.branchId || "",
        maxDiscountAmount: coupon.maxDiscountAmount ?? "",
        minOrderAmount: coupon.minOrderAmount ?? "",
        maxUses: coupon.maxUses ?? "",
        maxUsesPerCustomer: coupon.maxUsesPerCustomer ?? "",
        scopeMenuItemId: coupon.scopeMenuItemId || "",
        scopeCategoryId: coupon.scopeCategoryId || "",
      });
    };

    fetchCoupon();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couponCode, token, restaurantId]);

  /* ================= HELPERS ================= */

  const updateField = (key: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleItemSelect = (id: string) => {
    const item = items.find((i) => i.id === id);

    setForm((prev: any) => ({
      ...prev,
      scopeMenuItemId: id,
      scopeCategoryId: item?.categoryId || "",
    }));
  };

  /* ================= SAVE ================= */

  const handleSave = async () => {
    if (saving) return;

    if (!restaurantId) {
      toast.error("Restaurant id is missing");
      return;
    }

    if (!form.code?.trim() || !form.title?.trim()) {
      toast.error("Coupon title and code are required");
      return;
    }

    if (isEdit && !couponId) {
      toast.error("Coupon id is missing");
      return;
    }

    setSaving(true);

    const payload = cleanPayload({
      ...form,

      // Required by backend for create/update context
      restaurantId,

      code: form.code?.trim(),
      title: form.title?.trim(),
      description: form.description?.trim() || undefined,

      discountValue: toOptionalNumber(form.discountValue) ?? 0,
      maxDiscountAmount: toOptionalNumber(form.maxDiscountAmount),
      minOrderAmount: toOptionalNumber(form.minOrderAmount),
      maxUses: toOptionalNumber(form.maxUses),
      maxUsesPerCustomer: toOptionalNumber(form.maxUsesPerCustomer),
    });

    try {
      let res: any;

      if (isEdit) {
        res = await patch(`/v1/coupons/${couponId}`, payload);

        if (isApiError(res)) {
          if (res?.success === false) {
            toast.error(getApiErrorMessage(res, "Failed to update coupon"));
          }
          return;
        }

        toast.success("Coupon updated successfully");
      } else {
        res = await post("/v1/coupons", payload);

        if (isApiError(res)) {
          if (res?.success === false) {
            toast.error(getApiErrorMessage(res, "Failed to create coupon"));
          }
          return;
        }

        toast.success("Coupon created successfully");
      }

      router.push("/promotion-management");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm({
      code: "",
      title: "",
      discountType: "FLAT",
      discountValue: "",
      startsAt: "",
      expiresAt: "",
      description: "",
      branchId: "",
      maxDiscountAmount: "",
      minOrderAmount: "",
      maxUses: "",
      maxUsesPerCustomer: "",
      scopeMenuItemId: "",
      scopeCategoryId: "",
    });
  };

  return (
    <PageWrapper
      title={isEdit ? "Update Coupon" : "Add New Coupon"}
      onSave={handleSave}
      saving={saving}
      onReset={handleReset}
    >
      {/* BASIC */}
      <Section label="Setup Basic Info">
        <FormInput
          label="Coupon Title"
          value={form.title}
          onChange={(val) => updateField("title", val)}
        />

        <FormInput
          label="Coupon Code"
          value={form.code}
          onChange={(val) => updateField("code", val)}
        />

        <FormInput
          label="Max Uses"
          type="number"
          value={form.maxUses}
          onChange={(val) => updateField("maxUses", val)}
        />
      </Section>

      {/* DISCOUNT */}
      <Section label="Discount Setup">
        <Select
          value={form.discountType}
          onValueChange={(val) => updateField("discountType", val)}
        >
          <SelectTrigger className="h-10">
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="FLAT">Flat Amount</SelectItem>
            <SelectItem value="PERCENTAGE">Percentage</SelectItem>
          </SelectContent>
        </Select>

        <FormInput
          label="Discount Value"
          type="number"
          value={form.discountValue}
          onChange={(val) => updateField("discountValue", val)}
        />

        <FormInput
          label="Starts At"
          type="datetime-local"
          value={form.startsAt}
          onChange={(val) => updateField("startsAt", val)}
        />

        <FormInput
          label="Expires At"
          type="datetime-local"
          value={form.expiresAt}
          onChange={(val) => updateField("expiresAt", val)}
        />
      </Section>

      {/* BRANCH */}
      <Section label="Branch">
        <Select
          value={form.branchId}
          onValueChange={(val) => updateField("branchId", val)}
        >
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Select branch" />
          </SelectTrigger>

          <SelectContent>
            {branches.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Section>

      {/* ITEM */}
      <Section label="Apply To (Optional)">
        <Select value={form.scopeMenuItemId} onValueChange={handleItemSelect}>
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Select item" />
          </SelectTrigger>

          <SelectContent>
            {items.map((i) => (
              <SelectItem key={i.id} value={i.id}>
                {i.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Section>

      {/* ADVANCED */}
      <Section label="Advanced">
        <FormInput
          label="Min Order Amount"
          type="number"
          value={form.minOrderAmount}
          onChange={(val) => updateField("minOrderAmount", val)}
        />

        <FormInput
          label="Max Discount Amount"
          type="number"
          value={form.maxDiscountAmount}
          onChange={(val) => updateField("maxDiscountAmount", val)}
        />

        <FormInput
          label="Max Uses Per Customer"
          type="number"
          value={form.maxUsesPerCustomer}
          onChange={(val) => updateField("maxUsesPerCustomer", val)}
        />
      </Section>
    </PageWrapper>
  );
}