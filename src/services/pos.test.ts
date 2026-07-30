import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/lib/axios";
import {
  createCustomerAddress,
  deleteCartDeal,
  updateCartDealQuantity,
} from "@/services/pos";

vi.mock("@/lib/axios", () => ({
  api: {
    delete: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

describe("pos cart service", () => {
  beforeEach(() => {
    mockedApi.delete.mockReset();
    mockedApi.patch.mockReset();
    mockedApi.post.mockReset();
  });

  it("updates deal quantity by encoded rendered row id", async () => {
    mockedApi.patch.mockResolvedValueOnce({ data: { success: true } });

    await updateCartDealQuantity({
      customerId: "customer-1",
      dealTargetId: "deal:deal-1:0:1",
      quantity: 2,
    });

    expect(mockedApi.patch).toHaveBeenCalledWith(
      "/cart/deals/deal%3Adeal-1%3A0%3A1?customerId=customer-1",
      { quantity: 2 },
    );
  });

  it("deletes deals by encoded rendered row id", async () => {
    mockedApi.delete.mockResolvedValueOnce({ data: { success: true } });

    await deleteCartDeal({
      customerId: "customer-1",
      dealTargetId: "deal:deal-1:0:1",
    });

    expect(mockedApi.delete).toHaveBeenCalledWith(
      "/cart/deals/deal%3Adeal-1%3A0%3A1?customerId=customer-1",
    );
  });

  it("creates a scoped registered-customer address from POS", async () => {
    mockedApi.post.mockResolvedValueOnce({
      data: { data: { id: "address-1" } },
    });

    await createCustomerAddress({
      customerId: "customer-1",
      branchId: "branch-1",
      address: {
        street: "Main Street",
        area: "12",
        postalCode: "10115",
        city: "Berlin",
        state: "Berlin",
        country: "Germany",
        lat: "52.5200",
        lng: "13.4050",
      },
    });

    expect(mockedApi.post).toHaveBeenCalledWith("/addresses", {
      customerId: "customer-1",
      branchId: "branch-1",
      street: "Main Street",
      houseNumber: "12",
      postalCode: "10115",
      city: "Berlin",
      state: "Berlin",
      country: "Germany",
      lat: "52.5200",
      lng: "13.4050",
    });
  });
});
