import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCustomersList } from "@/services/customers";
import {
  normalizeWalkInCustomers,
  searchWalkInCustomers,
  WALK_IN_CUSTOMER_SEARCH_LIMIT,
} from "@/services/walk-in-customers";

vi.mock("@/services/customers", () => ({ getCustomersList: vi.fn() }));

const listMock = vi.mocked(getCustomersList);

describe("walk-in customer lookup", () => {
  beforeEach(() => vi.clearAllMocks());

  it("queries the admin customer list with the restaurant scope and trimmed search", async () => {
    listMock.mockResolvedValue({ data: [] });

    await searchWalkInCustomers({ restaurantId: "restaurant-1", search: "  ada " });

    expect(listMock).toHaveBeenCalledWith({
      page: 1,
      limit: WALK_IN_CUSTOMER_SEARCH_LIMIT,
      includeInactive: false,
      restaurantId: "restaurant-1",
      search: "ada",
    });
  });

  it("omits empty search and restaurant params", async () => {
    listMock.mockResolvedValue({ data: [] });

    await searchWalkInCustomers({ search: "" });

    expect(listMock).toHaveBeenCalledWith({ page: 1, limit: WALK_IN_CUSTOMER_SEARCH_LIMIT, includeInactive: false });
  });

  it("normalizes profile-nested and flat customer rows and drops rows without an id", () => {
    const customers = normalizeWalkInCustomers({
      data: [
        { id: "c1", email: "ada@example.com", profile: { firstName: "Ada", lastName: "Lovelace", phone: "+49 30 1" } },
        { id: "c2", email: "grace@example.com", firstName: "Grace", lastName: "" },
        { id: "c3", email: "anon@example.com" },
        { email: "no-id@example.com" },
        "junk",
      ],
    });

    expect(customers).toEqual([
      { id: "c1", name: "Ada Lovelace", email: "ada@example.com", phone: "+49 30 1" },
      { id: "c2", name: "Grace", email: "grace@example.com", phone: null },
      { id: "c3", name: "anon@example.com", email: "anon@example.com", phone: null },
    ]);
  });

  it("accepts a nested data envelope", async () => {
    listMock.mockResolvedValue({ data: { data: [{ id: "c1", email: "ada@example.com" }], meta: {} } });

    const customers = await searchWalkInCustomers({ search: "ada" });

    expect(customers.map((customer) => customer.id)).toEqual(["c1"]);
  });
});
