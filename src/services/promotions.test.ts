import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createCoupon,
  createAdminPromotionCampaign,
  getAdminPromotionCampaignDetail,
  getAdminPromotionCampaigns,
  updateAdminPromotionCampaign,
  updateCoupon,
  updateCouponStatus,
} from "@/services/promotions";
import api from "@/lib/axios";

vi.mock("@/lib/axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockedGet = vi.mocked(api.get);
const mockedPost = vi.mocked(api.post);
const mockedPatch = vi.mocked(api.patch);

describe("promotions service", () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
    mockedPatch.mockReset();
  });

  it("campaign list/detail responses preserve thumbnailUrl", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        data: [{ id: "promo-1", title: "Promo", thumbnailUrl: "https://cdn.example.com/promo.png" }],
      },
    });
    mockedGet.mockResolvedValueOnce({
      data: {
        data: { id: "promo-1", title: "Promo", thumbnailUrl: "https://cdn.example.com/promo.png" },
      },
    });

    const list = await getAdminPromotionCampaigns({ restaurantId: "restaurant-1" });
    const detail = await getAdminPromotionCampaignDetail("promo-1", { restaurantId: "restaurant-1" });

    expect(list.data[0].thumbnailUrl).toBe("https://cdn.example.com/promo.png");
    expect(detail.data.thumbnailUrl).toBe("https://cdn.example.com/promo.png");
  });

  it("create/update campaign sends thumbnailUrl without /api/v1 duplication", async () => {
    mockedPost.mockResolvedValue({ data: { id: "promo-1" } });
    mockedPatch.mockResolvedValue({ data: { id: "promo-1" } });

    await createAdminPromotionCampaign({
      title: "Promo",
      thumbnailUrl: "/uploads/promo.png",
      restaurantId: "restaurant-1",
      discountType: "FLAT",
      discountValue: 10,
      startsAt: "2026-06-02T00:00:00.000Z",
      isActive: true,
    });
    await updateAdminPromotionCampaign("promo-1", {
      title: "Promo",
      thumbnailUrl: "/uploads/promo.png",
      restaurantId: "restaurant-1",
    });

    expect(mockedPost).toHaveBeenCalledWith("/admin/promotions/campaigns", expect.objectContaining({
      thumbnailUrl: "/uploads/promo.png",
    }));
    expect(mockedPatch).toHaveBeenCalledWith(
      "/admin/promotions/campaigns/promo-1",
      expect.objectContaining({ thumbnailUrl: "/uploads/promo.png" }),
      { params: { restaurantId: "restaurant-1" } }
    );
    expect(mockedPost.mock.calls[0]?.[0]).not.toContain("/api/v1");
    expect(mockedPatch.mock.calls[0]?.[0]).not.toContain("/api/v1");
  });

  it("creates coupons with restaurantId and strips restaurantId from coupon updates", async () => {
    mockedPost.mockResolvedValue({ data: { id: "coupon-1" } });
    mockedPatch.mockResolvedValue({ data: { id: "coupon-1" } });

    await createCoupon({
      code: "SAVE10",
      title: "Save 10",
      restaurantId: "restaurant-1",
      discountType: "FLAT",
      discountValue: 10,
    });
    await updateCoupon("coupon-1", {
      code: "SAVE10",
      title: "Save 10",
      restaurantId: "restaurant-1",
      discountType: "FLAT",
      discountValue: 10,
    });

    expect(mockedPost).toHaveBeenCalledWith(
      "/coupons",
      expect.objectContaining({ restaurantId: "restaurant-1" })
    );
    expect(mockedPatch).toHaveBeenCalledWith(
      "/coupons/coupon-1",
      expect.not.objectContaining({ restaurantId: "restaurant-1" })
    );
  });

  it("updates coupon status with restaurantId through the status endpoint", async () => {
    mockedPatch.mockResolvedValue({ data: { code: "SAVE10", status: "ACTIVE" } });

    await updateCouponStatus("SAVE10", {
      restaurantId: "restaurant-1",
      status: "ACTIVE",
    });
    await updateCouponStatus("SAVE10", {
      restaurantId: "restaurant-1",
      status: "SUSPENDED",
    });

    expect(mockedPatch).toHaveBeenNthCalledWith(1, "/coupons/SAVE10/status", {
      restaurantId: "restaurant-1",
      status: "ACTIVE",
    });
    expect(mockedPatch).toHaveBeenNthCalledWith(2, "/coupons/SAVE10/status", {
      restaurantId: "restaurant-1",
      status: "SUSPENDED",
    });
    expect(mockedPatch.mock.calls[0]?.[0]).not.toContain("/api/v1");
  });

});
