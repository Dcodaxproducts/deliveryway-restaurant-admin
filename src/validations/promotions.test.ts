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
  code: "",
  title: "Lunch Happy Hour",
  description: "",
  discountType: "FLAT",
  discountValue: "5",
  maxDiscountAmount: "",
  minOrderAmount: "",
  maxUses: "",
  maxUsesPerCustomer: "",
  startsAt: "2026-06-02",
  expiresAt: "2026-06-03",
  isActive: true,
  activeDays: [1, 2, 3],
  dailyStartTime: "12:00",
  dailyEndTime: "14:00",
  selectedMenuItem: null,
  selectedCategory: null,
};

describe("promotion thumbnailUrl validation", () => {
  it("allows empty, relative, and http thumbnail URLs", () => {
    for (const thumbnailUrl of ["", "/uploads/promo.png", "https://cdn.example.com/promo.png"]) {
      expect(promotionSchema.safeParse({ ...validPromotion, thumbnailUrl }).success).toBe(true);
    }
  });

  it("rejects invalid thumbnail URLs", () => {
    expect(promotionSchema.safeParse({ ...validPromotion, thumbnailUrl: "invalid-url" }).success).toBe(false);
  });
});

describe("happy hour validation", () => {
  it("allows an empty happy hour code", () => {
    expect(happyHourSchema.safeParse(validHappyHour).success).toBe(true);
  });

  it("still requires a happy hour title", () => {
    const result = happyHourSchema.safeParse({ ...validHappyHour, title: "" });

    expect(result.success).toBe(false);
  });

  it("allows date-only same-day happy hours because daily times define the time window", () => {
    const result = happyHourSchema.safeParse({
      ...validHappyHour,
      startsAt: "2026-06-02",
      expiresAt: "2026-06-02",
      dailyStartTime: "12:00",
      dailyEndTime: "14:00",
    });

    expect(result.success).toBe(true);
  });
});

describe("coupon validation", () => {
  const validCoupon = {
    code: "SAVE10",
    title: "Save ten",
    discountType: "FLAT",
    discountValue: "10",
    startsAt: "2026-08-03T10:00",
    expiresAt: "2026-08-04T10:00",
    description: "",
    audience: "BOTH",
    applyMode: "ORDER_TOTAL",
    branchId: "",
    maxDiscountAmount: "",
    minOrderAmount: "",
    maxUses: "",
    maxUsesPerCustomer: "",
    selectedMenuItems: [],
    selectedCategories: [],
  };

  it("requires the values that the coupon API requires", () => {
    expect(couponSchema.safeParse(validCoupon).success).toBe(true);
    expect(
      couponSchema.safeParse({ ...validCoupon, discountValue: "" }).success,
    ).toBe(false);
    expect(
      couponSchema.safeParse({ ...validCoupon, startsAt: "" }).success,
    ).toBe(false);
  });

  it("rejects a coupon whose expiry is not after its start", () => {
    expect(
      couponSchema.safeParse({
        ...validCoupon,
        expiresAt: "2026-08-03T09:00",
      }).success,
    ).toBe(false);
  });
});
