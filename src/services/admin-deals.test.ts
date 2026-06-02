import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ADMIN_DEALS_ENDPOINT,
  createAdminDeal,
  deleteAdminDeal,
  getAdminDeal,
  getAdminDeals,
  getAdminDealStats,
  updateAdminDeal,
} from "@/services/admin-deals";
import { httpClient } from "@/lib/axios";
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

const dealPayload: AdminDealCreatePayload = {
  title: "Lunch Deal",
  discountValue: 12,
  startsAt: "2026-06-02T06:17:00.000Z",
  expiresAt: "2026-06-03T06:17:00.000Z",
  scopeMenuItemIds: ["item-1", "item-2"],
  autoApply: true,
  isActive: true,
};

const dealResponse = {
  data: {
    id: "deal-1",
    title: "Lunch Deal",
    thumbnailUrl: "https://cdn.example.com/deal.png",
    discountValue: 12,
    startsAt: "2026-06-02T06:17:00.000Z",
    expiresAt: "2026-06-03T06:17:00.000Z",
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

  it("list calls /admin/deals without duplicating /api/v1", async () => {
    mockedGet.mockResolvedValue({ data: [], meta: { page: 1, limit: 20 } });

    await getAdminDeals({ page: 1, limit: 20 });

    expect(mockedGet).toHaveBeenCalledWith(ADMIN_DEALS_ENDPOINT, {
      params: { page: 1, limit: 20 },
    });
    expect(ADMIN_DEALS_ENDPOINT).toBe("/admin/deals");
    expect(ADMIN_DEALS_ENDPOINT).not.toContain("/api/v1");
  });

  it("list passes filters and removes empty params", async () => {
    mockedGet.mockResolvedValue({ data: [], meta: { page: 2, limit: 10 } });

    await getAdminDeals({
      page: 2,
      limit: 10,
      search: "",
      lifecycle: "",
      restaurantId: "restaurant-1",
      branchId: "branch-1",
      includeInactive: true,
      sortBy: "createdAt",
      sortOrder: "DESC",
    });

    expect(mockedGet).toHaveBeenCalledWith(ADMIN_DEALS_ENDPOINT, {
      params: {
        page: 2,
        limit: 10,
        restaurantId: "restaurant-1",
        branchId: "branch-1",
        includeInactive: true,
        sortBy: "createdAt",
        sortOrder: "DESC",
      },
    });
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

  it("create calls POST /admin/deals and does not send applyMode or discountType", async () => {
    mockedPost.mockResolvedValue(dealResponse);

    await createAdminDeal(dealPayload);

    expect(mockedPost).toHaveBeenCalledWith(ADMIN_DEALS_ENDPOINT, dealPayload);
    expect(mockedPost.mock.calls[0]?.[1]).not.toHaveProperty("applyMode");
    expect(mockedPost.mock.calls[0]?.[1]).not.toHaveProperty("discountType");
  });

  it("normalizes deal thumbnailUrl from detail responses", async () => {
    mockedGet.mockResolvedValue(dealResponse);

    const result = await getAdminDeal("deal-1");

    expect(result.thumbnailUrl).toBe("https://cdn.example.com/deal.png");
  });

  it("normalizes edit detail fields from scoped menu item response data", async () => {
    mockedGet.mockResolvedValue({
      success: true,
      data: [
        {
          id: "deal-1",
          code: "PIZZA100",
          title: "Pizza Combo Deal",
          description: "shorter desc",
          discountValue: 100,
          minOrderAmount: 100,
          maxUses: 100,
          maxUsesPerCustomer: 2,
          startsAt: "2026-06-02T09:05:00.000Z",
          expiresAt: "2026-06-13T09:05:00.000Z",
          isActive: true,
          restaurant: {
            id: "restaurant-1",
            name: "kfcs",
          },
          branch: {
            id: "branch-1",
            name: "Main Branch",
          },
          scopeMenuItems: [
            {
              id: "item-1",
              name: "1. Basic Pizza Copy",
            },
            {
              id: "item-2",
              name: "Pizza",
            },
          ],
        },
      ],
    });

    const result = await getAdminDeal("deal-1");

    expect(result.code).toBe("PIZZA100");
    expect(result.restaurantId).toBe("restaurant-1");
    expect(result.branchId).toBe("branch-1");
    expect(result.scopeMenuItemIds).toEqual(["item-1", "item-2"]);
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
