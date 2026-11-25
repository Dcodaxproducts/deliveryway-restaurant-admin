import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/lib/axios";
import { getCustomersList } from "./customers";

vi.mock("@/lib/axios", () => ({
  api: { get: vi.fn() },
}));

describe("customer management API client", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends every selected filter, including explicit false values", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 1 } },
    });

    await getCustomersList({
      page: 1,
      search: "Nino",
      sortOrder: "ASC",
      withDeleted: false,
      includeInactive: true,
      isGuest: false,
      isVerified: false,
      isActive: false,
      fromDate: "2026-09-01",
      toDate: "2026-11-10",
      restaurantId: "restaurant-1",
      branchId: "branch-1",
    });

    expect(api.get).toHaveBeenCalledWith("/admin/users/customers", {
      params: {
        page: 1,
        search: "Nino",
        sortOrder: "ASC",
        withDeleted: false,
        includeInactive: true,
        isGuest: false,
        isVerified: false,
        isActive: false,
        fromDate: "2026-09-01",
        toDate: "2026-11-10",
        restaurantId: "restaurant-1",
        branchId: "branch-1",
      },
    });
  });
});
