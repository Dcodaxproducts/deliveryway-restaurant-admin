import { beforeEach, describe, expect, it, vi } from "vitest";

import { httpClient } from "@/lib/axios";
import {
  createGiftCard,
  deleteGiftCard,
  getGiftCard,
  getGiftCards,
  GIFT_CARDS_ENDPOINT,
  updateGiftCard,
} from "@/services/gift-cards";
import type { GiftCardCreatePayload } from "@/types/gift-cards";

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

const giftCardPayload: GiftCardCreatePayload = {
  restaurantId: "restaurant-1",
  branchId: "branch-1",
  title: "Rs 1000 Gift Card",
  amount: 1000,
  startsAt: "2026-06-04T00:00:00.000Z",
  expiresAt: "2026-12-31T23:59:59.000Z",
  isActive: true,
};

const giftCardResponse = {
  data: {
    id: "gift-card-1",
    code: "GIFT-ABCD1234",
    title: "Rs 1000 Gift Card",
    kind: "GIFT_CARD",
    discountValue: 1000,
    amount: 1000,
    startsAt: "2026-06-04T00:00:00.000Z",
    expiresAt: "2026-12-31T23:59:59.000Z",
    isActive: true,
  },
};

describe("gift cards service", () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
    mockedPatch.mockReset();
    mockedDelete.mockReset();
  });

  it("list calls /admin/promotions/gift-cards with filters and no /api/v1 duplication", async () => {
    mockedGet.mockResolvedValue({
      data: {
        giftCards: [],
        meta: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    });

    await getGiftCards({
      page: 1,
      limit: 20,
      search: "gift",
      restaurantId: "restaurant-1",
      branchId: "branch-1",
      lifecycle: "active",
    });

    expect(mockedGet).toHaveBeenCalledWith(GIFT_CARDS_ENDPOINT, {
      params: {
        page: 1,
        limit: 20,
        search: "gift",
        restaurantId: "restaurant-1",
        branchId: "branch-1",
        lifecycle: "active",
      },
    });
    expect(GIFT_CARDS_ENDPOINT).toBe("/admin/promotions/gift-cards");
    expect(GIFT_CARDS_ENDPOINT).not.toContain("/api/v1");
  });

  it("normalizes meta hasNextPage and hasPreviousPage", async () => {
    mockedGet.mockResolvedValue({
      data: {
        giftCards: [],
        meta: {
          page: 2,
          limit: 10,
          total: 25,
          totalPages: 3,
          hasNextPage: true,
          hasPreviousPage: true,
        },
      },
    });

    const result = await getGiftCards({ page: 2, limit: 10 });

    expect(result.meta).toEqual({
      page: 2,
      limit: 10,
      total: 25,
      totalPages: 3,
      hasNext: true,
      hasPrevious: true,
    });
  });

  it("create calls POST and omits derived promotion fields", async () => {
    mockedPost.mockResolvedValue(giftCardResponse);

    await createGiftCard(giftCardPayload);

    expect(mockedPost).toHaveBeenCalledWith(GIFT_CARDS_ENDPOINT, giftCardPayload);
    expect(mockedPost.mock.calls[0]?.[1]).not.toHaveProperty("kind");
    expect(mockedPost.mock.calls[0]?.[1]).not.toHaveProperty("applyMode");
    expect(mockedPost.mock.calls[0]?.[1]).not.toHaveProperty("autoApply");
    expect(mockedPost.mock.calls[0]?.[1]).not.toHaveProperty("discountType");
  });

  it("detail calls GET /:id", async () => {
    mockedGet.mockResolvedValue(giftCardResponse);

    await getGiftCard("gift-card-1", {
      restaurantId: "restaurant-1",
      branchId: "branch-1",
    });

    expect(mockedGet).toHaveBeenCalledWith(
      "/admin/promotions/gift-cards/gift-card-1",
      {
        params: { restaurantId: "restaurant-1", branchId: "branch-1" },
      }
    );
  });

  it("update calls PATCH /:id", async () => {
    mockedPatch.mockResolvedValue(giftCardResponse);

    await updateGiftCard(
      "gift-card-1",
      { title: "Updated Gift Card" },
      { restaurantId: "restaurant-1" }
    );

    expect(mockedPatch).toHaveBeenCalledWith(
      "/admin/promotions/gift-cards/gift-card-1",
      { title: "Updated Gift Card" },
      { params: { restaurantId: "restaurant-1" } }
    );
  });

  it("delete calls DELETE /:id", async () => {
    mockedDelete.mockResolvedValue({});

    await deleteGiftCard("gift-card-1", { branchId: "branch-1" });

    expect(mockedDelete).toHaveBeenCalledWith(
      "/admin/promotions/gift-cards/gift-card-1",
      {
        params: { branchId: "branch-1" },
      }
    );
  });
});
