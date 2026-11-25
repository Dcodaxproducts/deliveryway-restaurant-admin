import { describe, expect, it } from "vitest";
import {
  buildCustomerListParams,
  customerListQueryKey,
  mergeCustomerListFilters,
} from "./customer-list-query";

describe("customer list query contract", () => {
  it("keeps explicit false filters while removing empty values", () => {
    expect(
      buildCustomerListParams({
        page: 1,
        isGuest: false,
        isVerified: false,
        isActive: false,
        search: "",
      }),
    ).toEqual({
      page: 1,
      isGuest: false,
      isVerified: false,
      isActive: false,
    });
  });

  it("changes the query key when Guest and Registered are selected", () => {
    expect(customerListQueryKey({ isGuest: true })).not.toEqual(
      customerListQueryKey({ isGuest: false }),
    );
  });

  it("resets pagination for a filter change but preserves explicit pages", () => {
    const current = { page: 7, isGuest: undefined as boolean | undefined };
    expect(mergeCustomerListFilters(current, { isGuest: false }).page).toBe(1);
    expect(mergeCustomerListFilters(current, { page: 3 }).page).toBe(3);
  });
});
