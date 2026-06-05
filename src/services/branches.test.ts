import { beforeEach, describe, expect, it, vi } from "vitest";

import api from "@/lib/axios";
import { updateBranch } from "@/services/branches";

vi.mock("@/lib/axios", () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

describe("branches service", () => {
  beforeEach(() => {
    mockedApi.get.mockReset();
    mockedApi.patch.mockReset();
  });

  it("does not re-add opening hours fields when merging service charge settings", async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: {
        data: {
          settings: {
            allowedOrderTypes: ["DELIVERY"],
            openingHours: [{ dayOfWeek: "MONDAY" }],
            holidayRanges: [{ fromDate: "2026-01-01" }],
            customSetting: "keep-me",
          },
        },
      },
    });
    mockedApi.patch.mockResolvedValueOnce({ data: { success: true } });

    await updateBranch("branch-1", {
      settings: {
        serviceCharge: {
          isEnabled: true,
          type: "PERCENTAGE",
          value: 10,
        },
      },
    });

    expect(mockedApi.patch).toHaveBeenCalledWith("/branches/branch-1", {
      settings: {
        allowedOrderTypes: ["DELIVERY"],
        customSetting: "keep-me",
        serviceCharge: {
          isEnabled: true,
          type: "PERCENTAGE",
          value: 10,
        },
      },
    });
  });
});
