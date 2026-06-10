import { beforeEach, describe, expect, it, vi } from "vitest";

import api from "@/lib/axios";
import {
  getDeliveryHours,
  updateBranch,
  updateDeliveryHours,
  updateBranchHolidayOpeningHours,
} from "@/services/branches";

vi.mock("@/lib/axios", () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);
const allPaymentMethods = [
  "COD",
  "STRIPE",
  "PAYPAL",
];

describe("branches service", () => {
  beforeEach(() => {
    mockedApi.get.mockReset();
    mockedApi.patch.mockReset();
    mockedApi.put.mockReset();
  });

  it("does not re-add opening hours fields when merging service charge settings", async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: {
        data: {
          settings: {
            allowedOrderTypes: ["DELIVERY"],
            openingHours: [{ dayOfWeek: "MONDAY" }],
            deliveryHours: [{ dayOfWeek: "TUESDAY" }],
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
        allowedPaymentMethods: allPaymentMethods,
        customSetting: "keep-me",
        serviceCharge: {
          isEnabled: true,
          type: "PERCENTAGE",
          value: 10,
        },
      },
    });
  });

  it("updates branch admin through the branch patch endpoint", async () => {
    mockedApi.patch.mockResolvedValueOnce({ data: { success: true } });

    const payload = {
      name: "Blue Area",
      branchAdmin: {
        email: "manager@example.com",
        firstName: "Ali",
        lastName: "Khan",
        phone: "+923001234567",
      },
    };

    await updateBranch("branch-1", payload);

    expect(mockedApi.patch).toHaveBeenCalledWith("/branches/branch-1", payload);
    expect(mockedApi.patch).not.toHaveBeenCalledWith(
      "/api/v1/branches/branch-1",
      payload
    );
  });

  it("updates holiday opening hours without duplicating api version prefix", async () => {
    const payload = {
      holidayOpeningHours: [
        {
          fromDate: "2026-06-17",
          toDate: "2026-06-19",
          isClosed: true,
          note: "Eid holidays",
        },
      ],
    };

    mockedApi.put.mockResolvedValueOnce({ data: { success: true } });

    await updateBranchHolidayOpeningHours({
      branchId: "branch-1",
      payload,
    });

    expect(mockedApi.put).toHaveBeenCalledWith(
      "/branches/branch-1/holiday-opening-hours",
      payload
    );
    expect(mockedApi.put).not.toHaveBeenCalledWith(
      "/api/v1/branches/branch-1/holiday-opening-hours",
      payload
    );
  });

  it("gets and updates delivery hours without duplicating api version prefix", async () => {
    const payload = {
      deliveryHours: [
        {
          dayOfWeek: "MONDAY" as const,
          isClosed: false,
          openTime: "10:00",
          closeTime: "22:00",
          breakTimes: [{ startTime: "14:00", endTime: "15:00" }],
        },
      ],
    };

    mockedApi.get.mockResolvedValueOnce({ data: { data: payload } });
    mockedApi.put.mockResolvedValueOnce({ data: { success: true } });

    await getDeliveryHours("branch-1");
    await updateDeliveryHours("branch-1", payload);

    expect(mockedApi.get).toHaveBeenCalledWith(
      "/branches/branch-1/delivery-hours"
    );
    expect(mockedApi.put).toHaveBeenCalledWith(
      "/branches/branch-1/delivery-hours",
      payload
    );
    expect(mockedApi.put).not.toHaveBeenCalledWith(
      "/api/v1/branches/branch-1/delivery-hours",
      payload
    );
  });
});
