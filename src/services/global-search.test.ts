import { beforeEach, describe, expect, it, vi } from "vitest";

import { globalSearch } from "@/services/global-search";
import { getAdminDeals } from "@/services/admin-deals";
import { getBranches } from "@/services/branches";
import { getCustomersList } from "@/services/customers";
import { getDeliverymenList } from "@/services/deliverymen";
import { getStaffList } from "@/services/employees";
import { getFaqList } from "@/services/faqs";
import { getMenuItems } from "@/services/menus";
import { getOrders } from "@/services/orders";
import { getAdminPromotionCampaigns } from "@/services/promotions";
import { getRestaurants } from "@/services/restaurants";
import { getTableReservations } from "@/services/table-reservations";

vi.mock("@/services/orders", () => ({ getOrders: vi.fn() }));
vi.mock("@/services/menus", () => ({ getMenuItems: vi.fn() }));
vi.mock("@/services/customers", () => ({ getCustomersList: vi.fn() }));
vi.mock("@/services/branches", () => ({ getBranches: vi.fn() }));
vi.mock("@/services/deliverymen", () => ({ getDeliverymenList: vi.fn() }));
vi.mock("@/services/employees", () => ({ getStaffList: vi.fn() }));
vi.mock("@/services/promotions", () => ({ getAdminPromotionCampaigns: vi.fn() }));
vi.mock("@/services/admin-deals", () => ({ getAdminDeals: vi.fn() }));
vi.mock("@/services/table-reservations", () => ({ getTableReservations: vi.fn() }));
vi.mock("@/services/restaurants", () => ({ getRestaurants: vi.fn() }));
vi.mock("@/services/faqs", () => ({ getFaqList: vi.fn() }));

const mockedGetOrders = vi.mocked(getOrders);
const mockedGetMenuItems = vi.mocked(getMenuItems);
const mockedGetCustomersList = vi.mocked(getCustomersList);
const mockedGetBranches = vi.mocked(getBranches);
const mockedGetDeliverymenList = vi.mocked(getDeliverymenList);
const mockedGetStaffList = vi.mocked(getStaffList);
const mockedGetAdminPromotionCampaigns = vi.mocked(getAdminPromotionCampaigns);
const mockedGetAdminDeals = vi.mocked(getAdminDeals);
const mockedGetTableReservations = vi.mocked(getTableReservations);
const mockedGetRestaurants = vi.mocked(getRestaurants);
const mockedGetFaqList = vi.mocked(getFaqList);

describe("global search service", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    mockedGetOrders.mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 5, total: 0, totalPages: 1, hasNext: false, hasPrevious: false },
      success: true,
    });
    mockedGetMenuItems.mockResolvedValue({ data: [], meta: { total: 0 } });
    mockedGetCustomersList.mockResolvedValue({ data: [], meta: { total: 0 } });
    mockedGetBranches.mockResolvedValue({ data: [], meta: { total: 0 } });
    mockedGetDeliverymenList.mockResolvedValue({ data: [], meta: { total: 0 } });
    mockedGetStaffList.mockResolvedValue({ data: [], meta: { total: 0 } });
    mockedGetAdminPromotionCampaigns.mockResolvedValue({ data: [], meta: { total: 0 } });
    mockedGetAdminDeals.mockResolvedValue({
      deals: [],
      meta: {
        page: 1,
        limit: 5,
        total: 0,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
    });
    mockedGetTableReservations.mockResolvedValue({
      reservations: [],
      meta: {
        page: 1,
        limit: 5,
        total: 0,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
    });
    mockedGetRestaurants.mockResolvedValue({ data: [], meta: { total: 0 } });
    mockedGetFaqList.mockResolvedValue({ data: [], meta: { total: 0 } });
  });

  it("aggregates groups from existing list services", async () => {
    mockedGetOrders.mockResolvedValue({
      success: true,
      data: [
        {
          id: "order-1",
          orderNumber: "1001",
          orderType: "DELIVERY",
          status: "PENDING",
          createdAt: "2026-06-02T10:00:00.000Z",
          customer: { fullName: "Ada Lovelace" },
        },
      ],
      meta: { page: 1, limit: 5, total: 1, totalPages: 1, hasNext: false, hasPrevious: false },
    });
    mockedGetCustomersList.mockResolvedValue({
      data: [
        {
          id: "customer-1",
          email: "ada@example.com",
          profile: { firstName: "Ada", lastName: "Lovelace", phone: "123" },
        },
      ],
      meta: { total: 1 },
    });
    mockedGetAdminDeals.mockResolvedValue({
      deals: [
        {
          id: "deal-1",
          title: "Lunch Deal",
          discountValue: 9,
          startsAt: "2026-06-02T10:00:00.000Z",
          expiresAt: "2026-06-03T10:00:00.000Z",
          scopeMenuItemIds: ["item-1", "item-2"],
          isActive: true,
          lifecycle: "ACTIVE",
        },
      ],
      meta: { page: 1, limit: 5, total: 1, totalPages: 1, hasNext: false, hasPrevious: false },
    });
    mockedGetTableReservations.mockResolvedValue({
      reservations: [
        {
          id: "reservation-1",
          branchId: "branch-1",
          reservationDate: "2026-06-02T12:00:00.000Z",
          guestCount: 4,
          note: null,
          status: "CONFIRMED",
          createdAt: "2026-06-01T12:00:00.000Z",
          cancelledAt: null,
          customer: {
            id: "customer-1",
            email: "ada@example.com",
            firstName: "Ada",
            lastName: "Lovelace",
            phone: null,
            avatarUrl: null,
          },
          branch: null,
        },
      ],
      meta: { page: 1, limit: 5, total: 1, totalPages: 1, hasNext: false, hasPrevious: false },
    });

    const result = await globalSearch({
      query: "ada",
      restaurantId: "restaurant-1",
      branchId: "branch-1",
      limit: 5,
    });

    expect(result.groups).toHaveLength(11);
    expect(result.total).toBe(4);
    expect(result.groups.find((group) => group.entity === "orders")?.results[0]).toMatchObject({
      title: "Order #1001",
      subtitle: "Ada Lovelace",
      status: "PENDING",
      href: "/orders/details/order-1",
    });
    expect(result.groups.find((group) => group.entity === "customers")?.results[0]).toMatchObject({
      title: "Ada Lovelace",
      subtitle: "ada@example.com • 123",
      href: "/customer-settings?search=ada",
    });
    expect(result.groups.find((group) => group.entity === "deals")?.results[0]).toMatchObject({
      title: "Lunch Deal",
      subtitle: "9 • 2 items",
      href: "/menu/deals?search=ada",
    });
    expect(result.groups.find((group) => group.entity === "tableReservations")?.results[0]).toMatchObject({
      title: "Ada Lovelace",
      subtitle: "2026-06-02T12:00:00.000Z • 4 guests",
      href: "/table-reservations?search=ada",
    });
  });

  it("keeps other groups when one service fails", async () => {
    mockedGetOrders.mockRejectedValue(new Error("Orders failed"));
    mockedGetCustomersList.mockResolvedValue({
      data: [{ id: "customer-1", email: "ada@example.com" }],
      meta: { total: 1 },
    });

    const result = await globalSearch({ query: "ada", restaurantId: "restaurant-1" });

    expect(result.groups.find((group) => group.entity === "orders")?.results).toEqual([]);
    expect(result.groups.find((group) => group.entity === "customers")?.results).toHaveLength(1);
  });

  it("passes search, limit, page, restaurant and branch scope to list APIs", async () => {
    await globalSearch({
      query: "Lunch Deal",
      restaurantId: "restaurant-1",
      branchId: "branch-1",
      limit: 5,
    });

    expect(mockedGetOrders).toHaveBeenCalledWith(
      expect.objectContaining({
        search: "Lunch Deal",
        limit: 5,
        page: 1,
        restaurantId: "restaurant-1",
        branchId: "branch-1",
      })
    );
    expect(mockedGetAdminDeals).toHaveBeenCalledWith(
      expect.objectContaining({
        search: "Lunch Deal",
        limit: 5,
        page: 1,
        restaurantId: "restaurant-1",
        branchId: "branch-1",
      })
    );
  });

  it("view all hrefs encode the search query", async () => {
    const result = await globalSearch({ query: "lunch deal", restaurantId: "restaurant-1" });

    expect(result.groups.find((group) => group.entity === "deals")?.href).toBe(
      "/menu/deals?search=lunch+deal"
    );
  });

  it("does not define duplicated /api/v1 paths", async () => {
    const result = await globalSearch({ query: "ada", restaurantId: "restaurant-1" });

    expect(result.groups.every((group) => !group.href.includes("/api/v1"))).toBe(true);
  });
});
