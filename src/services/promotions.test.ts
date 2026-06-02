import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createAdminHappyHour,
  createAdminPromotionCampaign,
  createCoupon,
  getAdminHappyHourDetail,
  getAdminPromotionCampaignDetail,
  getAdminPromotionCampaigns,
  updateAdminHappyHour,
  updateAdminPromotionCampaign,
  updateCoupon,
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

  it("happy hour list/detail and mutations preserve thumbnailUrl", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        data: { id: "happy-1", title: "Happy", thumbnailUrl: "https://cdn.example.com/happy.png" },
      },
    });
    mockedPost.mockResolvedValue({ data: { id: "happy-1" } });
    mockedPatch.mockResolvedValue({ data: { id: "happy-1" } });

    const detail = await getAdminHappyHourDetail("happy-1");
    await createAdminHappyHour({
      code: "HAPPY",
      title: "Happy",
      thumbnailUrl: "https://cdn.example.com/happy.png",
      discountType: "FLAT",
      discountValue: 10,
      startsAt: "2026-06-02T00:00:00.000Z",
      isActive: true,
    });
    await updateAdminHappyHour("happy-1", {
      thumbnailUrl: "https://cdn.example.com/happy.png",
    });

    expect(detail.data.thumbnailUrl).toBe("https://cdn.example.com/happy.png");
    expect(mockedPost).toHaveBeenCalledWith("/admin/promotions/happy-hours", expect.objectContaining({
      thumbnailUrl: "https://cdn.example.com/happy.png",
    }));
    expect(mockedPatch).toHaveBeenCalledWith("/admin/promotions/happy-hours/happy-1", expect.objectContaining({
      thumbnailUrl: "https://cdn.example.com/happy.png",
    }));
  });

  it("coupon create/update sends thumbnailUrl", async () => {
    mockedPost.mockResolvedValue({ data: { id: "coupon-1" } });
    mockedPatch.mockResolvedValue({ data: { id: "coupon-1" } });

    await createCoupon({ title: "Coupon", thumbnailUrl: "/uploads/coupon.png" });
    await updateCoupon("coupon-1", { thumbnailUrl: "/uploads/coupon.png" });

    expect(mockedPost).toHaveBeenCalledWith("/coupons", expect.objectContaining({
      thumbnailUrl: "/uploads/coupon.png",
    }));
    expect(mockedPatch).toHaveBeenCalledWith("/coupons/coupon-1", expect.objectContaining({
      thumbnailUrl: "/uploads/coupon.png",
    }));
  });
});
