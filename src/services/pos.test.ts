import { beforeEach, describe, expect, it, vi } from "vitest";

import api from "@/lib/axios";
import { deleteCartDeal, updateCartDealQuantity } from "@/services/pos";

vi.mock("@/lib/axios", () => ({
  default: {
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

describe("pos cart service", () => {
  beforeEach(() => {
    mockedApi.delete.mockReset();
    mockedApi.patch.mockReset();
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
});
