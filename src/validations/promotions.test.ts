import { describe, expect, it } from "vitest";

import {
  couponSchema,
  happyHourSchema,
  promotionSchema,
} from "@/validations/promotions";

const validPromotion = {
  code: "",
  title: "Summer Promo",
  description: "",
  thumbnailUrl: "",
  discountType: "FLAT",
  discountValue: "10",
  maxDiscountAmount: "",
  minOrderAmount: "",
  maxUses: "",
  maxUsesPerCustomer: "",
  startsAt: "2026-06-02T06:17",
  expiresAt: "2026-06-03T06:17",
  applyMode: "ORDER_TOTAL",
  autoApply: true,
  isActive: true,
  assignPermanently: false,
  branchId: "",
  selectedBranch: null,
  selectedMenuItems: [],
  selectedCategories: [],
};

const validHappyHour = {
  code: "HAPPY",
  title: "Happy Hour",
  description: "",
  thumbnailUrl: "",
  discountType: "FLAT",
  discountValue: "10",
  maxDiscountAmount: "",
  minOrderAmount: "",
  maxUses: "",
  maxUsesPerCustomer: "",
  startsAt: "2026-06-02T06:17",
  expiresAt: "2026-06-03T06:17",
  isActive: true,
  activeDays: [1],
  dailyStartTime: "12:00",
  dailyEndTime: "14:00",
  selectedMenuItem: null,
  selectedCategory: null,
};

const validCoupon = {
  code: "COUPON",
  title: "Coupon",
  discountType: "FLAT",
  discountValue: "10",
  startsAt: "",
  expiresAt: "",
  description: "",
  thumbnailUrl: "",
  branchId: "",
  maxDiscountAmount: "",
  minOrderAmount: "",
  maxUses: "",
  maxUsesPerCustomer: "",
  scopeMenuItemId: "",
  scopeCategoryId: "",
};

describe("promotion thumbnailUrl validation", () => {
  it("allows empty, relative, and http thumbnail URLs", () => {
    for (const thumbnailUrl of ["", "/uploads/promo.png", "https://cdn.example.com/promo.png"]) {
      expect(promotionSchema.safeParse({ ...validPromotion, thumbnailUrl }).success).toBe(true);
      expect(happyHourSchema.safeParse({ ...validHappyHour, thumbnailUrl }).success).toBe(true);
      expect(couponSchema.safeParse({ ...validCoupon, thumbnailUrl }).success).toBe(true);
    }
  });

  it("rejects invalid thumbnail URLs", () => {
    expect(promotionSchema.safeParse({ ...validPromotion, thumbnailUrl: "invalid-url" }).success).toBe(false);
    expect(happyHourSchema.safeParse({ ...validHappyHour, thumbnailUrl: "invalid-url" }).success).toBe(false);
    expect(couponSchema.safeParse({ ...validCoupon, thumbnailUrl: "invalid-url" }).success).toBe(false);
  });
});
