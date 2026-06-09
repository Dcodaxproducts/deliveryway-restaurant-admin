import { describe, expect, it } from "vitest";

import type { AdminDealFormValues } from "@/types/admin-deals";
import {
  adminDealFormSchema,
  buildAdminDealCreatePayload,
  buildAdminDealUpdatePayload,
} from "@/validations/admin-deals";

const validValues: AdminDealFormValues = {
  title: "Lunch Deal",
  description: "Fixed lunch price",
  thumbnailUrl: "",
  imageUrl: "",
  restaurantId: "restaurant-1",
  branchId: "branch-1",
  discountValue: 12,
  startsAt: "2026-06-02T06:17",
  expiresAt: "2026-06-03T06:17",
  dealSelectionMode: "FIXED_ITEMS",
  dealSourceType: "ITEMS",
  dealRequiredQuantity: null,
  scopeMenuItemIds: ["item-1", "item-2"],
  scopeCategoryIds: [],
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

  it("requires expiresAt after startsAt", () => {
    const result = adminDealFormSchema.safeParse({
      ...validValues,
      expiresAt: "2026-06-01T06:17",
    });

    expect(result.success).toBe(false);
  });

  it("allows empty start and expiry dates", () => {
    const result = adminDealFormSchema.safeParse({
      ...validValues,
      startsAt: "",
      expiresAt: "",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid start and expiry dates when provided", () => {
    const result = adminDealFormSchema.safeParse({
      ...validValues,
      startsAt: "invalid",
      expiresAt: "also-invalid",
    });

    expect(result.success).toBe(false);
  });

  it("fixed item deal requires at least 2 items", () => {
    const result = adminDealFormSchema.safeParse({
      ...validValues,
      scopeMenuItemIds: ["item-1"],
    });

    expect(result.success).toBe(false);
  });

  it("fixed item deal rejects categories", () => {
    const result = adminDealFormSchema.safeParse({
      ...validValues,
      scopeCategoryIds: ["category-1"],
    });

    expect(result.success).toBe(false);
  });

  it("flexible item deal requires dealRequiredQuantity", () => {
    const result = adminDealFormSchema.safeParse({
      ...validValues,
      dealSelectionMode: "FLEXIBLE_ITEMS",
      dealRequiredQuantity: null,
      scopeMenuItemIds: ["item-1", "item-2"],
    });

    expect(result.success).toBe(false);
  });

  it("flexible item deal rejects required quantity greater than selected item count", () => {
    const result = adminDealFormSchema.safeParse({
      ...validValues,
      dealSelectionMode: "FLEXIBLE_ITEMS",
      dealRequiredQuantity: 3,
      scopeMenuItemIds: ["item-1", "item-2"],
    });

    expect(result.success).toBe(false);
  });

  it("flexible category deal requires at least 1 category", () => {
    const result = adminDealFormSchema.safeParse({
      ...validValues,
      dealSelectionMode: "FLEXIBLE_ITEMS",
      dealSourceType: "CATEGORIES",
      dealRequiredQuantity: 2,
      scopeMenuItemIds: [],
      scopeCategoryIds: [],
    });

    expect(result.success).toBe(false);
  });

  it("flexible category deal requires dealRequiredQuantity", () => {
    const result = adminDealFormSchema.safeParse({
      ...validValues,
      dealSelectionMode: "FLEXIBLE_ITEMS",
      dealSourceType: "CATEGORIES",
      dealRequiredQuantity: null,
      scopeMenuItemIds: [],
      scopeCategoryIds: ["category-1"],
    });

    expect(result.success).toBe(false);
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

  it("payload excludes discountType, applyMode, and autoApply", () => {
    const payload = buildAdminDealCreatePayload(validValues);

    expect(payload).not.toHaveProperty("discountType");
    expect(payload).not.toHaveProperty("applyMode");
    expect(payload).not.toHaveProperty("autoApply");
  });

  it("payload includes dealSelectionMode", () => {
    const payload = buildAdminDealCreatePayload(validValues);

    expect(payload.dealSelectionMode).toBe("FIXED_ITEMS");
  });

  it("payload omits start and expiry dates when blank", () => {
    const payload = buildAdminDealCreatePayload({
      ...validValues,
      startsAt: "",
      expiresAt: "",
    });

    expect(payload).not.toHaveProperty("startsAt");
    expect(payload).not.toHaveProperty("expiresAt");
  });

  it("payload includes dealRequiredQuantity only for flexible deals", () => {
    const fixedPayload = buildAdminDealCreatePayload(validValues);
    const flexiblePayload = buildAdminDealCreatePayload({
      ...validValues,
      dealSelectionMode: "FLEXIBLE_ITEMS",
      dealRequiredQuantity: 2,
    });

    expect(fixedPayload).not.toHaveProperty("dealRequiredQuantity");
    expect(flexiblePayload.dealRequiredQuantity).toBe(2);
  });

  it("create payload includes thumbnailUrl when non-empty", () => {
    const payload = buildAdminDealCreatePayload({
      ...validValues,
      thumbnailUrl: " https://cdn.example.com/deal.png ",
    });

    expect(payload.thumbnailUrl).toBe("https://cdn.example.com/deal.png");
  });

  it("update payload clears opposite scope when switching source", () => {
    const payload = buildAdminDealUpdatePayload({
      ...validValues,
      dealSelectionMode: "FLEXIBLE_ITEMS",
      dealSourceType: "CATEGORIES",
      dealRequiredQuantity: 3,
      scopeMenuItemIds: [],
      scopeCategoryIds: ["category-1"],
    });

    expect(payload.scopeCategoryIds).toEqual(["category-1"]);
    expect(payload.scopeMenuItemIds).toEqual([]);
  });
});
