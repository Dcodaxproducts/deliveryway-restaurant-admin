import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/lib/axios";
import { getCustomersList } from "@/services/customers";

vi.mock("@/lib/axios", () => ({
  api: { get: vi.fn() },
}));

describe("customer list filters", () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
    vi.mocked(api.get).mockResolvedValue({ data: { data: [], meta: {} } });
  });

  it("forwards bounded server-side filters including the selected branch scope", async () => {
    await getCustomersList({
      page: 2,
      limit: 25,
      restaurantId: "restaurant-1",
      branchId: "jwt-branch",
      isGuest: false,
      isVerified: true,
      isActive: false,
      includeInactive: true,
      fromDate: "2026-11-01",
      toDate: "2026-11-15",
      sortOrder: "DESC",
    });

    expect(api.get).toHaveBeenCalledWith("/admin/users/customers", {
      params: {
        page: 2,
        limit: 25,
        restaurantId: "restaurant-1",
        branchId: "jwt-branch",
        isGuest: false,
        isVerified: true,
        isActive: false,
        includeInactive: true,
        fromDate: "2026-11-01",
        toDate: "2026-11-15",
        sortOrder: "DESC",
      },
    });
  });
});
