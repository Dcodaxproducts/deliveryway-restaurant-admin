import { describe, expect, it } from "vitest";

import {
  getEligiblePosCustomers,
  parsePosCustomerSelection,
  serializePosCustomerSelection,
} from "@/components/pages/Pos/components/pos/pos-customer-selection";

const customer = {
  id: "customer-1",
  email: "customer@example.com",
  profile: { firstName: "Ada", lastName: "Lovelace" },
};

describe("POS customer selection", () => {
  it("exposes only active registered customers from the current restaurant", () => {
    expect(
      getEligiblePosCustomers(
        {
          data: [
            { ...customer, restaurantId: "restaurant-1", isActive: true },
            { ...customer, id: "guest-1", isGuest: true },
            { ...customer, id: "inactive-1", isActive: false },
            { ...customer, id: "other-1", restaurantId: "restaurant-2" },
          ],
        },
        "restaurant-1",
      ).map((value) => value.id),
    ).toEqual(["customer-1"]);
  });

  it("hydrates a persisted current-restaurant selection", () => {
    const raw = serializePosCustomerSelection({
      customer: { id: "customer-1", firstName: "Ada" },
      restaurantId: "restaurant-1",
      branchId: "branch-1",
    });

    expect(
      parsePosCustomerSelection({ raw, restaurantId: "restaurant-1" }),
    ).toMatchObject({ id: "customer-1", firstName: "Ada" });
  });

  it("drops a stale selection after a restaurant switch", () => {
    const raw = serializePosCustomerSelection({
      customer: { id: "customer-1", firstName: "Ada" },
      restaurantId: "restaurant-1",
    });

    expect(
      parsePosCustomerSelection({ raw, restaurantId: "restaurant-2" }),
    ).toBeNull();
  });
});
