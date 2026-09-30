import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createWalkInReservation,
  getTableReservation,
  getTableReservationDetailEndpoint,
  getTableReservations,
  TABLE_RESERVATIONS_ENDPOINT,
  updateTableReservationStatus,
  WALK_IN_RESERVATIONS_ENDPOINT,
} from "@/services/table-reservations";
import { httpClient } from "@/lib/axios";

vi.mock("@/lib/axios", () => ({
  httpClient: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedGet = vi.mocked(httpClient.get);
const mockedPatch = vi.mocked(httpClient.patch);
const mockedPost = vi.mocked(httpClient.post);

describe("table reservations service", () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPatch.mockReset();
    mockedPost.mockReset();
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

  it("fetches one reservation from GET /customer-app/admin/table-reservations/:reservationId", async () => {
    mockedGet.mockResolvedValue({
      success: true,
      data: {
        id: "reservation-1",
        branchId: "branch-1",
        reservationDate: "2026-06-02T10:00:00.000Z",
        guestCount: 2,
        status: "SEATED",
        createdAt: "2026-06-01T10:00:00.000Z",
        customer: { id: "customer-1", email: "customer@example.com" },
      },
    });

    const reservation = await getTableReservation("reservation-1", {
      restaurantId: "restaurant-1",
      branchId: "",
    });

    expect(mockedGet).toHaveBeenCalledWith(
      "/customer-app/admin/table-reservations/reservation-1",
      { params: { restaurantId: "restaurant-1" } }
    );
    expect(reservation).toMatchObject({ id: "reservation-1", status: "SEATED", guestCount: 2 });
    expect(reservation?.customer?.id).toBe("customer-1");
  });

  it("encodes the reservation id and accepts a bare reservation body", async () => {
    mockedGet.mockResolvedValue({ id: "res/1", status: "REQUESTED", guestCount: 1 });

    const reservation = await getTableReservation("res/1");

    expect(getTableReservationDetailEndpoint("res/1")).toBe(
      "/customer-app/admin/table-reservations/res%2F1"
    );
    expect(mockedGet.mock.calls[0]?.[0]).toBe("/customer-app/admin/table-reservations/res%2F1");
    expect(reservation?.id).toBe("res/1");
  });

  it("resolves null when the detail response carries no reservation", async () => {
    mockedGet.mockResolvedValue({ success: true, data: null });
    expect(await getTableReservation("missing")).toBeNull();

    mockedGet.mockResolvedValue({ success: true, data: { status: "SEATED" } });
    expect(await getTableReservation("missing")).toBeNull();
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

  it("sends NO_SHOW through the same status endpoint", async () => {
    mockedPatch.mockResolvedValue({
      data: { id: "reservation-1", status: "NO_SHOW", guestCount: 4 },
    });

    const reservation = await updateTableReservationStatus("reservation-1", { status: "NO_SHOW" });

    expect(mockedPatch).toHaveBeenCalledWith(
      `${TABLE_RESERVATIONS_ENDPOINT}/reservation-1/status`,
      { status: "NO_SHOW" }
    );
    expect(reservation.status).toBe("NO_SHOW");
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

  it("rejects a status response without a reservation", async () => {
    mockedPatch.mockResolvedValue({ success: true, data: null });

    await expect(
      updateTableReservationStatus("reservation-1", { status: "SEATED" })
    ).rejects.toThrow("Invalid table reservation response");
  });

  it("creates walk-in reservations through POST /pos/orders/walk-in-reservations", async () => {
    mockedPost.mockResolvedValue({
      data: {
        id: "walk-in-1",
        branchId: "branch-1",
        reservationDate: "2026-09-30T12:15:00.000Z",
        guestCount: 3,
        note: null,
        status: "REQUESTED",
        createdAt: "2026-09-30T12:00:00.000Z",
        cancelledAt: null,
        customerId: "guest-1",
      },
      message: "Walk-in table reservation created successfully",
    });

    const result = await createWalkInReservation({
      branchId: "branch-1",
      guestName: "Ada",
      guestPhone: undefined,
      reservationDate: "2026-09-30T12:15:00.000Z",
      guestCount: 3,
      note: "",
    });

    expect(WALK_IN_RESERVATIONS_ENDPOINT).toBe("/pos/orders/walk-in-reservations");
    expect(mockedPost).toHaveBeenCalledWith(WALK_IN_RESERVATIONS_ENDPOINT, {
      branchId: "branch-1",
      guestName: "Ada",
      reservationDate: "2026-09-30T12:15:00.000Z",
      guestCount: 3,
    });
    expect(result.reservation).toMatchObject({ id: "walk-in-1", status: "REQUESTED", guestCount: 3 });
    expect(result.customerId).toBe("guest-1");
    expect(result.message).toBe("Walk-in table reservation created successfully");
  });

  it("rejects a walk-in response without a reservation", async () => {
    mockedPost.mockResolvedValue({ success: true });

    await expect(
      createWalkInReservation({ reservationDate: "2026-09-30T12:15:00.000Z", guestCount: 2 })
    ).rejects.toThrow("Invalid walk-in reservation response");
  });
});
