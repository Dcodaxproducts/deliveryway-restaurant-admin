import { describe, expect, it } from "vitest";

import {
  adminDealFormSchema,
  buildAdminDealCreatePayload,
  buildAdminDealUpdatePayload,
} from "@/validations/admin-deals";
import type { AdminDealFormValues } from "@/types/admin-deals";

const validValues: AdminDealFormValues = {
  code: "DEAL",
  title: "Lunch Deal",
  description: "Fixed lunch price",
  thumbnailUrl: "",
  restaurantId: "restaurant-1",
  branchId: "branch-1",
  discountValue: 12,
  maxDiscountAmount: null,
  minOrderAmount: null,
  maxUses: null,
  maxUsesPerCustomer: null,
  startsAt: "2026-06-02T06:17",
  expiresAt: "2026-06-03T06:17",
  scopeMenuItemIds: ["item-1", "item-2"],
  isActive: true,
};

describe("admin deal validation", () => {
  it("requires title", () => {
    const result = adminDealFormSchema.safeParse({ ...validValues, title: "" });

    expect(result.success).toBe(false);
  });

  it("requires positive discountValue", () => {
    const result = adminDealFormSchema.safeParse({
      ...validValues,
      discountValue: 0,
    });

    expect(result.success).toBe(false);
  });

  it("requires at least 2 scope menu items", () => {
    const result = adminDealFormSchema.safeParse({
      ...validValues,
      scopeMenuItemIds: ["item-1"],
    });

    expect(result.success).toBe(false);
  });

  it("requires startsAt and expiresAt", () => {
    expect(
      adminDealFormSchema.safeParse({ ...validValues, startsAt: "" }).success
    ).toBe(false);
    expect(
      adminDealFormSchema.safeParse({ ...validValues, expiresAt: "" }).success
    ).toBe(false);
  });

  it("requires expiresAt after startsAt", () => {
    const result = adminDealFormSchema.safeParse({
      ...validValues,
      expiresAt: "2026-06-01T06:17",
    });

    expect(result.success).toBe(false);
  });

  it("allows optional numeric fields when empty or undefined", () => {
    const result = adminDealFormSchema.safeParse({
      ...validValues,
      maxDiscountAmount: undefined,
      minOrderAmount: undefined,
      maxUses: undefined,
      maxUsesPerCustomer: undefined,
    });

    expect(result.success).toBe(true);
  });

  it("allows empty, relative, and http thumbnail URLs", () => {
    expect(adminDealFormSchema.safeParse({ ...validValues, thumbnailUrl: "" }).success).toBe(true);
    expect(adminDealFormSchema.safeParse({ ...validValues, thumbnailUrl: "/uploads/deal.png" }).success).toBe(true);
    expect(adminDealFormSchema.safeParse({ ...validValues, thumbnailUrl: "https://cdn.example.com/deal.png" }).success).toBe(true);
  });

  it("rejects invalid thumbnail URLs", () => {
    const result = adminDealFormSchema.safeParse({
      ...validValues,
      thumbnailUrl: "not-a-url",
    });

    expect(result.success).toBe(false);
  });

  it("create payload includes autoApply true and excludes backend-handled fields", () => {
    const payload = buildAdminDealCreatePayload(validValues);

    expect(payload.autoApply).toBe(true);
    expect(payload).not.toHaveProperty("applyMode");
    expect(payload).not.toHaveProperty("discountType");
  });

  it("create payload includes thumbnailUrl when non-empty", () => {
    const payload = buildAdminDealCreatePayload({
      ...validValues,
      thumbnailUrl: " https://cdn.example.com/deal.png ",
    });

    expect(payload.thumbnailUrl).toBe("https://cdn.example.com/deal.png");
  });

  it("create payload omits thumbnailUrl when empty", () => {
    const payload = buildAdminDealCreatePayload({
      ...validValues,
      thumbnailUrl: " ",
    });

    expect(payload).not.toHaveProperty("thumbnailUrl");
  });

  it("update payload includes thumbnailUrl when changed", () => {
    const payload = buildAdminDealUpdatePayload({
      ...validValues,
      thumbnailUrl: "/uploads/deal.png",
    });

    expect(payload.thumbnailUrl).toBe("/uploads/deal.png");
  });
});
