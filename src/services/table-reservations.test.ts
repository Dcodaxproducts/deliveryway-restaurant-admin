import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getTableReservations,
  TABLE_RESERVATIONS_ENDPOINT,
  updateTableReservationStatus,
} from "@/services/table-reservations";
import { httpClient } from "@/lib/axios";

vi.mock("@/lib/axios", () => ({
  httpClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockedGet = vi.mocked(httpClient.get);
const mockedPatch = vi.mocked(httpClient.patch);

describe("table reservations service", () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPatch.mockReset();
  });

  it("calls the table reservations endpoint without duplicating /api/v1", async () => {
    mockedGet.mockResolvedValue({ data: [], meta: { page: 1, limit: 20 } });

    await getTableReservations({ page: 1, limit: 20 });

    expect(mockedGet).toHaveBeenCalledWith(TABLE_RESERVATIONS_ENDPOINT, {
      params: { page: 1, limit: 20 },
    });
    expect(TABLE_RESERVATIONS_ENDPOINT).toBe(
      "/customer-app/admin/table-reservations"
    );
    expect(TABLE_RESERVATIONS_ENDPOINT).not.toContain("/api/v1");
  });

  it("sends params after removing empty search and status values", async () => {
    mockedGet.mockResolvedValue({ data: [], meta: { page: 1, limit: 20 } });

    await getTableReservations({
      page: 2,
      limit: 10,
      search: "",
      status: "",
      sortBy: "createdAt",
      sortOrder: "ASC",
      restaurantId: "restaurant-1",
      branchId: "branch-1",
    });

    expect(mockedGet).toHaveBeenCalledWith(TABLE_RESERVATIONS_ENDPOINT, {
      params: {
        page: 2,
        limit: 10,
        sortBy: "createdAt",
        sortOrder: "ASC",
        restaurantId: "restaurant-1",
        branchId: "branch-1",
      },
    });
  });

  it("normalizes response data and meta", async () => {
    mockedGet.mockResolvedValue({
      success: true,
      data: [
        {
          id: "reservation-1",
          branchId: "branch-1",
          reservationDate: "2026-06-02T10:00:00.000Z",
          guestCount: 4,
          status: "CONFIRMED",
          createdAt: "2026-06-01T10:00:00.000Z",
          customer: {
            id: "customer-1",
            email: "customer@example.com",
            firstName: "Ada",
            lastName: "Lovelace",
            phone: null,
            avatarUrl: null,
          },
          branch: { id: "branch-1", name: "Downtown" },
        },
      ],
      meta: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
      message: "ok",
    });

    const result = await getTableReservations({ page: 1, limit: 20 });

    expect(result.reservations).toHaveLength(1);
    expect(result.reservations[0]).toMatchObject({
      id: "reservation-1",
      branchId: "branch-1",
      guestCount: 4,
      status: "CONFIRMED",
      note: null,
      cancelledAt: null,
    });
    expect(result.meta.total).toBe(1);
    expect(result.message).toBe("ok");
  });

  it("handles missing data and meta safely", async () => {
    mockedGet.mockResolvedValue({ success: true });

    const result = await getTableReservations({ page: 3, limit: 50 });

    expect(result.reservations).toEqual([]);
    expect(result.meta).toEqual({
      page: 3,
      limit: 50,
      total: 0,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
    });
  });

  it("updates reservation status without duplicating /api/v1", async () => {
    mockedPatch.mockResolvedValue({
      data: {
        id: "reservation-1",
        branchId: "branch-1",
        reservationDate: "2026-06-02T10:00:00.000Z",
        guestCount: 4,
        status: "CONFIRMED",
        createdAt: "2026-06-01T10:00:00.000Z",
      },
    });

    await updateTableReservationStatus("reservation-1", {
      status: "CONFIRMED",
      restaurantId: "restaurant-1",
      branchId: "branch-1",
      customerId: "customer-1",
    });

    expect(mockedPatch).toHaveBeenCalledWith(
      `${TABLE_RESERVATIONS_ENDPOINT}/reservation-1/status`,
      {
        status: "CONFIRMED",
        restaurantId: "restaurant-1",
        branchId: "branch-1",
        customerId: "customer-1",
      }
    );
    expect(mockedPatch.mock.calls[0]?.[0]).not.toContain("/api/v1");
  });

  it("omits empty optional reservation status ids", async () => {
    mockedPatch.mockResolvedValue({
      data: {
        id: "reservation-1",
        branchId: null,
        reservationDate: "2026-06-02T10:00:00.000Z",
        guestCount: 4,
        status: "CANCELLED",
        createdAt: "2026-06-01T10:00:00.000Z",
      },
    });

    await updateTableReservationStatus("reservation-1", {
      status: "CANCELLED",
      restaurantId: "",
      branchId: "",
      customerId: "",
    });

    expect(mockedPatch).toHaveBeenCalledWith(
      `${TABLE_RESERVATIONS_ENDPOINT}/reservation-1/status`,
      {
        status: "CANCELLED",
      }
    );
  });
});
