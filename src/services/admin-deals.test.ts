import { beforeEach, describe, expect, it, vi } from "vitest";

import { httpClient } from "@/lib/axios";
import {
  ADMIN_DEALS_ENDPOINT,
  createAdminDeal,
  deleteAdminDeal,
  getAdminDeal,
  getAdminDeals,
  getAdminDealStats,
  updateAdminDeal,
} from "@/services/admin-deals";
import type { AdminDealCreatePayload } from "@/types/admin-deals";

vi.mock("@/lib/axios", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedGet = vi.mocked(httpClient.get);
const mockedPost = vi.mocked(httpClient.post);
const mockedPatch = vi.mocked(httpClient.patch);
const mockedDelete = vi.mocked(httpClient.delete);

const fixedDealPayload: AdminDealCreatePayload = {
  title: "Lunch Deal",
  discountValue: 12,
  startsAt: "2026-06-02T06:17:00.000Z",
  expiresAt: "2026-06-03T06:17:00.000Z",
  dealSelectionMode: "FIXED_ITEMS",
  scopeMenuItemIds: ["item-1", "item-2"],
  isActive: true,
};

const dealResponse = {
  data: {
    id: "deal-1",
    title: "Lunch Deal",
    thumbnailUrl: "https://cdn.example.com/deal.png",
    imageUrl: "https://cdn.example.com/deal-full.png",
    discountValue: 12,
    startsAt: "2026-06-02T06:17:00.000Z",
    expiresAt: "2026-06-03T06:17:00.000Z",
    dealSelectionMode: "FIXED_ITEMS",
    scopeMenuItemIds: ["item-1", "item-2"],
    isActive: true,
  },
};

describe("admin deals service", () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
    mockedPatch.mockReset();
    mockedDelete.mockReset();
  });

  it("list sends lifecycle/search/page/limit without duplicating /api/v1", async () => {
    mockedGet.mockResolvedValue({ data: [], meta: { page: 1, limit: 20 } });

    await getAdminDeals({
      page: 1,
      limit: 20,
      search: "pizza",
      lifecycle: "active",
      restaurantId: "restaurant-1",
      branchId: "branch-1",
    });

    expect(mockedGet).toHaveBeenCalledWith(ADMIN_DEALS_ENDPOINT, {
      params: {
        page: 1,
        limit: 20,
        search: "pizza",
        lifecycle: "active",
        restaurantId: "restaurant-1",
        branchId: "branch-1",
      },
    });
    expect(ADMIN_DEALS_ENDPOINT).toBe("/admin/deals");
    expect(ADMIN_DEALS_ENDPOINT).not.toContain("/api/v1");
  });

  it("normalizes safe default meta when meta is missing", async () => {
    mockedGet.mockResolvedValue({ success: true });

    const result = await getAdminDeals({ page: 3, limit: 50 });

    expect(result.deals).toEqual([]);
    expect(result.meta).toEqual({
      page: 3,
      limit: 50,
      total: 0,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
    });
  });

  it("create sends /admin/deals fixed item payload", async () => {
    mockedPost.mockResolvedValue(dealResponse);

    await createAdminDeal(fixedDealPayload);

    expect(mockedPost).toHaveBeenCalledWith(ADMIN_DEALS_ENDPOINT, fixedDealPayload);
    expect(mockedPost.mock.calls[0]?.[1]).not.toHaveProperty("applyMode");
    expect(mockedPost.mock.calls[0]?.[1]).not.toHaveProperty("discountType");
    expect(mockedPost.mock.calls[0]?.[1]).not.toHaveProperty("autoApply");
  });

  it("create sends flexible item payload", async () => {
    mockedPost.mockResolvedValue(dealResponse);
    const payload: AdminDealCreatePayload = {
      ...fixedDealPayload,
      dealSelectionMode: "FLEXIBLE_ITEMS",
      dealRequiredQuantity: 2,
      scopeMenuItemIds: ["item-1", "item-2", "item-3"],
    };

    await createAdminDeal(payload);

    expect(mockedPost).toHaveBeenCalledWith(ADMIN_DEALS_ENDPOINT, payload);
  });

  it("create sends flexible category payload", async () => {
    mockedPost.mockResolvedValue(dealResponse);
    const payload: AdminDealCreatePayload = {
      title: "Any 3 Pizza Deal",
      discountValue: 1499,
      startsAt: "2026-06-02T06:17:00.000Z",
      expiresAt: "2026-06-03T06:17:00.000Z",
      dealSelectionMode: "FLEXIBLE_ITEMS",
      dealRequiredQuantity: 3,
      scopeCategoryIds: ["category-1"],
      isActive: true,
    };

    await createAdminDeal(payload);

    expect(mockedPost).toHaveBeenCalledWith(ADMIN_DEALS_ENDPOINT, payload);
  });

  it("normalizes deal detail fields", async () => {
    mockedGet.mockResolvedValue({
      success: true,
      data: [
        {
          id: "deal-1",
          title: "Pizza Combo Deal",
          discountValue: 100,
          startsAt: "2026-06-02T09:05:00.000Z",
          expiresAt: "2026-06-13T09:05:00.000Z",
          dealSelectionMode: "FLEXIBLE_ITEMS",
          dealRequiredQuantity: 2,
          imageUrl: "https://cdn.example.com/deal.png",
          isActive: true,
          restaurant: {
            id: "restaurant-1",
            name: "kfcs",
          },
          branch: {
            id: "branch-1",
            name: "Main Branch",
          },
          scopeCategories: [
            {
              id: "category-1",
              name: "Pizza",
            },
          ],
        },
      ],
    });

    const result = await getAdminDeal("deal-1");

    expect(result.restaurantId).toBe("restaurant-1");
    expect(result.branchId).toBe("branch-1");
    expect(result.dealSelectionMode).toBe("FLEXIBLE_ITEMS");
    expect(result.dealRequiredQuantity).toBe(2);
    expect(result.imageUrl).toBe("https://cdn.example.com/deal.png");
    expect(result.scopeCategoryIds).toEqual(["category-1"]);
  });

  it("normalizes invalid optional deal dates to null", async () => {
    mockedGet.mockResolvedValue({
      success: true,
      data: {
        id: "deal-1",
        title: "Open Deal",
        discountValue: 100,
        startsAt: "invalid-date",
        expiresAt: "also-invalid",
        isActive: true,
      },
    });

    const result = await getAdminDeal("deal-1");

    expect(result.startsAt).toBeNull();
    expect(result.expiresAt).toBeNull();
  });

  it("detail calls /admin/deals/:id", async () => {
    mockedGet.mockResolvedValue(dealResponse);

    await getAdminDeal("deal-1", {
      restaurantId: "restaurant-1",
      branchId: "branch-1",
    });

    expect(mockedGet).toHaveBeenCalledWith("/admin/deals/deal-1", {
      params: { restaurantId: "restaurant-1", branchId: "branch-1" },
    });
  });

  it("update calls PATCH /admin/deals/:id", async () => {
    mockedPatch.mockResolvedValue(dealResponse);

    await updateAdminDeal("deal-1", { title: "Updated" }, { restaurantId: "restaurant-1" });

    expect(mockedPatch).toHaveBeenCalledWith(
      "/admin/deals/deal-1",
      { title: "Updated" },
      { params: { restaurantId: "restaurant-1" } }
    );
  });

  it("delete calls DELETE /admin/deals/:id", async () => {
    mockedDelete.mockResolvedValue({});

    await deleteAdminDeal("deal-1", { branchId: "branch-1" });

    expect(mockedDelete).toHaveBeenCalledWith("/admin/deals/deal-1", {
      params: { branchId: "branch-1" },
    });
  });

  it("stats calls /admin/deals/:id/stats", async () => {
    mockedGet.mockResolvedValue({ data: { totalUses: 4 } });

    await getAdminDealStats("deal-1", { restaurantId: "restaurant-1" });

    expect(mockedGet).toHaveBeenCalledWith("/admin/deals/deal-1/stats", {
      params: { restaurantId: "restaurant-1" },
    });
  });
});
