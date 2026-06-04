import { describe, expect, it } from "vitest";

import type { GiftCardFormValues } from "@/types/gift-cards";
import {
  buildGiftCardCreatePayload,
  buildGiftCardUpdatePayload,
  giftCardFormSchema,
} from "@/validations/gift-cards";

const validValues: GiftCardFormValues = {
  restaurantId: "restaurant-1",
  branchId: "branch-1",
  code: "gift-abcd1234",
  title: "Rs 1000 Gift Card",
  description: "Wallet gift card",
  imageUrl: "",
  thumbnailUrl: "",
  amount: 1000,
  maxUses: 100,
  maxUsesPerCustomer: 1,
  startsAt: "2026-06-04T00:00",
  expiresAt: "2026-12-31T23:59",
  isActive: true,
};

describe("gift card validation", () => {
  it("requires title", () => {
    const result = giftCardFormSchema.safeParse({ ...validValues, title: "" });

    expect(result.success).toBe(false);
  });

  it("requires amount greater than 0", () => {
    const result = giftCardFormSchema.safeParse({ ...validValues, amount: 0 });

    expect(result.success).toBe(false);
  });

  it("requires startsAt and expiresAt", () => {
    expect(giftCardFormSchema.safeParse({ ...validValues, startsAt: "" }).success).toBe(
      false
    );
    expect(giftCardFormSchema.safeParse({ ...validValues, expiresAt: "" }).success).toBe(
      false
    );
  });

  it("requires expiresAt after startsAt", () => {
    const result = giftCardFormSchema.safeParse({
      ...validValues,
      expiresAt: "2026-06-03T00:00",
    });

    expect(result.success).toBe(false);
  });

  it("allows empty, relative, http, and https image URLs", () => {
    expect(giftCardFormSchema.safeParse({ ...validValues, imageUrl: "" }).success).toBe(
      true
    );
    expect(
      giftCardFormSchema.safeParse({ ...validValues, imageUrl: "/uploads/gift.png" })
        .success
    ).toBe(true);
    expect(
      giftCardFormSchema.safeParse({
        ...validValues,
        thumbnailUrl: "http://cdn.example.com/gift.png",
      }).success
    ).toBe(true);
    expect(
      giftCardFormSchema.safeParse({
        ...validValues,
        imageUrl: "https://cdn.example.com/gift.png",
      }).success
    ).toBe(true);
  });

  it("rejects invalid image URL", () => {
    const result = giftCardFormSchema.safeParse({
      ...validValues,
      imageUrl: "not-a-url",
    });

    expect(result.success).toBe(false);
  });

  it("allows optional positive usage limits", () => {
    expect(
      giftCardFormSchema.safeParse({
        ...validValues,
        maxUses: null,
        maxUsesPerCustomer: null,
      }).success
    ).toBe(true);
    expect(giftCardFormSchema.safeParse({ ...validValues, maxUses: 1 }).success).toBe(
      true
    );
    expect(
      giftCardFormSchema.safeParse({ ...validValues, maxUsesPerCustomer: 0 }).success
    ).toBe(false);
  });

  it("payload builder uppercases code and sets both image aliases when one is present", () => {
    const payload = buildGiftCardCreatePayload({
      ...validValues,
      imageUrl: " https://cdn.example.com/gift.png ",
      thumbnailUrl: "",
    });

    expect(payload.code).toBe("GIFT-ABCD1234");
    expect(payload.imageUrl).toBe("https://cdn.example.com/gift.png");
    expect(payload.thumbnailUrl).toBe("https://cdn.example.com/gift.png");
  });

  it("payload builder omits empty optional fields and derived promotion fields", () => {
    const payload = buildGiftCardCreatePayload({
      ...validValues,
      branchId: "",
      code: "",
      description: "",
      imageUrl: "",
      thumbnailUrl: "",
      maxUses: null,
      maxUsesPerCustomer: null,
    });

    expect(payload).not.toHaveProperty("branchId");
    expect(payload).not.toHaveProperty("code");
    expect(payload).not.toHaveProperty("description");
    expect(payload).not.toHaveProperty("imageUrl");
    expect(payload).not.toHaveProperty("thumbnailUrl");
    expect(payload).not.toHaveProperty("kind");
    expect(payload).not.toHaveProperty("applyMode");
    expect(payload).not.toHaveProperty("autoApply");
    expect(payload).not.toHaveProperty("discountType");
  });

  it("update payload follows create payload rules", () => {
    const payload = buildGiftCardUpdatePayload({
      ...validValues,
      imageUrl: "",
      thumbnailUrl: "/uploads/gift.png",
    });

    expect(payload.imageUrl).toBe("/uploads/gift.png");
    expect(payload.thumbnailUrl).toBe("/uploads/gift.png");
  });
});
