import { beforeEach, describe, expect, it, vi } from "vitest";

const queryHarness = vi.hoisted(() => ({
  useQuery: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useMutation: vi.fn(),
  useQuery: queryHarness.useQuery,
  useQueryClient: vi.fn(),
}));
vi.mock("@/lib/constants", () => ({
  API_BASE_URL: "https://api.platform.feastflow.co/api/v1",
}));

import { useDeliverymen } from "@/hooks/useDeliverymen";
import { useGetLoyaltyProgram } from "@/hooks/useLoyalty";

describe("restaurant-scoped queries", () => {
  beforeEach(() => {
    queryHarness.useQuery.mockClear();
  });

  it.each([
    ["deliverymen", () => useDeliverymen({ page: 1 })],
    ["loyalty program", () => useGetLoyaltyProgram({})],
  ])("does not request %s without a selected restaurant", (_name, run) => {
    run();

    expect(queryHarness.useQuery).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false }),
    );
  });

  it.each([
    ["deliverymen", () => useDeliverymen({ restaurantId: "restaurant-1" })],
    [
      "loyalty program",
      () => useGetLoyaltyProgram({ restaurantId: "restaurant-1" }),
    ],
  ])("requests %s for the selected restaurant", (_name, run) => {
    run();

    expect(queryHarness.useQuery).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true }),
    );
  });
});
