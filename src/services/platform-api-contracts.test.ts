/**
 * Contract regression tests against platform API commit b9b00bc52b90be7cdbe3c4746218f164b6e27a90
 * ("fix(api): harden launch checkout and reservations").
 *
 * Each assertion pins an exact route, field name, payload shape, or transition edge from the
 * API source so a partner-side drift fails here before it fails on a device.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { httpClient } from "@/lib/axios";
import { TABLE_RESERVATION_TRANSITIONS } from "@/lib/table-reservation-transitions";
import { authApi, buildPosPrinterLoginRequest, POS_PRINTER_LOGIN_ENDPOINT } from "@/services/auth/auth.api";
import { buildPosPrinterCreateRequest, POS_PRINTER_ACCOUNTS_ENDPOINT, posPrinterApi } from "@/services/pos-printer";
import {
  assignTableReservation,
  buildTableReservationAssignmentRequest,
  buildWalkInReservationRequest,
  createWalkInReservation,
  getTableReservation,
  getTableReservationAssignmentEndpoint,
  getTableReservationDetailEndpoint,
  getTableReservationStatusEndpoint,
  TABLE_RESERVATIONS_ENDPOINT,
  updateTableReservationStatus,
  WALK_IN_RESERVATIONS_ENDPOINT,
} from "@/services/table-reservations";
import {
  TABLE_RESERVATION_QUEUE_STATES,
  TABLE_RESERVATION_STATUS_VALUES,
  normalizeTableReservation,
} from "@/types/table-reservations";
import { posPrinterLoginSchema, buildPosPrinterAccountCreateSchema } from "@/validations/pos-printer";
import { walkInReservationSchema, tableLabelSchema } from "@/validations/table-reservations";

vi.mock("@/lib/axios", () => ({ httpClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));

const getMock = vi.mocked(httpClient.get);
const postMock = vi.mocked(httpClient.post);
const patchMock = vi.mocked(httpClient.patch);

const keysOf = (value: unknown) => Object.keys(value as object).sort();

beforeEach(() => vi.clearAllMocks());

describe("CustomerAppController admin table reservation routes", () => {
  it("uses the exact admin reservation routes", () => {
    expect(TABLE_RESERVATIONS_ENDPOINT).toBe("/customer-app/admin/table-reservations");
    expect(getTableReservationDetailEndpoint("r1")).toBe("/customer-app/admin/table-reservations/r1");
    expect(WALK_IN_RESERVATIONS_ENDPOINT).toBe("/customer-app/admin/table-reservations/walk-ins");
    expect(getTableReservationAssignmentEndpoint("r1")).toBe(
      "/customer-app/admin/table-reservations/r1/assignment"
    );
    expect(getTableReservationStatusEndpoint("r1")).toBe("/customer-app/admin/table-reservations/r1/status");
  });

  it("GET :reservationId is the detail route and is called with the scope query only", async () => {
    getMock.mockResolvedValue({ data: { id: "r1", status: "CONFIRMED" } });
    await getTableReservation("r1", { restaurantId: "rest-1", branchId: "b1", customerId: "c1" });
    expect(getMock).toHaveBeenCalledWith("/customer-app/admin/table-reservations/r1", {
      params: { restaurantId: "rest-1", branchId: "b1", customerId: "c1" },
    });
  });

  it("POST walk-ins sends exactly CreateAdminWalkInReservationDto", async () => {
    postMock.mockResolvedValue({ data: { id: "w1", status: "CONFIRMED", isWalkIn: true } });
    const full = { customerId: "c1", branchId: "b1", guestCount: 2, tableLabel: "T1", note: "n", restaurantId: "rest-1" };
    await createWalkInReservation(full);

    const [route, body] = postMock.mock.calls[0];
    expect(route).toBe("/customer-app/admin/table-reservations/walk-ins");
    expect(keysOf(body)).toEqual(["branchId", "customerId", "guestCount", "note", "restaurantId", "tableLabel"]);
    expect(body).toEqual(full);
    expect(keysOf(buildWalkInReservationRequest({ customerId: "c1", branchId: "b1", guestCount: 2 }))).toEqual([
      "branchId",
      "customerId",
      "guestCount",
    ]);
    expect(keysOf(walkInReservationSchema.shape)).toEqual(["branchId", "customerId", "guestCount", "note", "tableLabel"]);
  });

  it("PATCH :reservationId/assignment sends exactly AssignAdminTableReservationDto and trusts the response", async () => {
    patchMock.mockResolvedValue({ data: { id: "r1", status: "CONFIRMED", tableLabel: "SERVER-T7" } });
    const reservation = await assignTableReservation("r1", {
      tableLabel: "T7",
      restaurantId: "rest-1",
      branchId: "b1",
      customerId: "c1",
    });

    const [route, body] = patchMock.mock.calls[0];
    expect(route).toBe("/customer-app/admin/table-reservations/r1/assignment");
    expect(keysOf(body)).toEqual(["branchId", "customerId", "restaurantId", "tableLabel"]);
    expect(body).toEqual({ tableLabel: "T7", restaurantId: "rest-1", branchId: "b1", customerId: "c1" });
    expect(keysOf(buildTableReservationAssignmentRequest({ tableLabel: "T7" }))).toEqual(["tableLabel"]);
    expect(reservation.tableLabel).toBe("SERVER-T7");
    expect(keysOf(tableLabelSchema.shape)).toEqual(["tableLabel"]);
  });

  it("PATCH :reservationId/status sends exactly UpdateTableReservationStatusDto plus scope", async () => {
    patchMock.mockResolvedValue({ data: { id: "r1", status: "NO_SHOW" } });
    await updateTableReservationStatus("r1", { status: "NO_SHOW", restaurantId: "rest-1", branchId: "b1", customerId: "c1" });
    const [route, body] = patchMock.mock.calls[0];
    expect(route).toBe("/customer-app/admin/table-reservations/r1/status");
    expect(keysOf(body)).toEqual(["branchId", "customerId", "restaurantId", "status"]);
  });

  it("reads the persisted TableReservationRecord fields by their exact names", () => {
    const reservation = normalizeTableReservation({
      id: "r1",
      branchId: "b1",
      reservationDate: "2026-09-30T10:00:00.000Z",
      guestCount: 2,
      note: null,
      status: "CONFIRMED",
      createdAt: "2026-09-30T10:00:00.000Z",
      cancelledAt: null,
      isWalkIn: true,
      queueState: "WAITING",
      tableLabel: "T1",
    });
    expect(reservation).toMatchObject({ isWalkIn: true, queueState: "WAITING", tableLabel: "T1" });
    expect([...TABLE_RESERVATION_STATUS_VALUES]).toEqual([
      "REQUESTED",
      "CONFIRMED",
      "SEATED",
      "COMPLETED",
      "CANCELLED",
      "NO_SHOW",
    ]);
    expect([...TABLE_RESERVATION_QUEUE_STATES]).toEqual(["WAITING", "SEATED", "COMPLETED", "CANCELLED", "NO_SHOW"]);
  });
});

describe("CustomerAppService.assertTableReservationTransition graph", () => {
  it("is reproduced edge for edge", () => {
    expect(TABLE_RESERVATION_TRANSITIONS).toStrictEqual({
      REQUESTED: ["CONFIRMED", "CANCELLED", "NO_SHOW"],
      CONFIRMED: ["SEATED", "CANCELLED", "NO_SHOW"],
      SEATED: ["COMPLETED"],
      COMPLETED: [],
      CANCELLED: [],
      NO_SHOW: [],
    });
  });

  it.each([
    ["REQUESTED", "SEATED"],
    ["SEATED", "CANCELLED"],
    ["SEATED", "NO_SHOW"],
    ["REQUESTED", "COMPLETED"],
    ["CONFIRMED", "COMPLETED"],
    ["COMPLETED", "CONFIRMED"],
    ["CANCELLED", "CONFIRMED"],
    ["NO_SHOW", "CONFIRMED"],
  ] as const)("forbids %s -> %s", (from, to) => {
    expect(TABLE_RESERVATION_TRANSITIONS[from]).not.toContain(to);
  });
});

describe("POS printer account and login contracts", () => {
  it("POST /pos-printer/accounts sends exactly username, displayName, password, branchId", async () => {
    postMock.mockResolvedValue({ data: {} });
    await posPrinterApi.create({ username: "Kitchen-1", displayName: "Kitchen  Printer", password: "CorrectHorseBattery1", branchId: "b1" });

    const [route, body] = postMock.mock.calls[0];
    expect(POS_PRINTER_ACCOUNTS_ENDPOINT).toBe("/pos-printer/accounts");
    expect(route).toBe("/pos-printer/accounts");
    expect(keysOf(body)).toEqual(["branchId", "displayName", "password", "username"]);
    expect(body).toEqual({ username: "kitchen-1", displayName: "Kitchen Printer", password: "CorrectHorseBattery1", branchId: "b1" });
    expect(keysOf(buildPosPrinterCreateRequest({ username: "u1x", displayName: "Dn", password: "p".repeat(12) }))).toEqual([
      "displayName",
      "password",
      "username",
    ]);
    expect(keysOf(buildPosPrinterAccountCreateSchema({ requireBranch: true }).shape)).toEqual([
      "branchId",
      "displayName",
      "password",
      "username",
    ]);
    for (const legacy of ["email", "firstName", "lastName"]) expect(body).not.toHaveProperty(legacy);
  });

  it("POST /auth/pos-printer/login sends exactly identifier and password", async () => {
    postMock.mockResolvedValue({ data: { accessToken: "t", user: { id: "p1", accountType: "POS_PRINTER" } } });
    await authApi.posPrinterLogin({ identifier: "Kitchen-1", password: "Password@123" });
    await authApi.posPrinterLogin({ identifier: "legacy@example.com", password: "Password@123" });

    expect(POS_PRINTER_LOGIN_ENDPOINT).toBe("/auth/pos-printer/login");
    expect(postMock).toHaveBeenNthCalledWith(1, "/auth/pos-printer/login", { identifier: "kitchen-1", password: "Password@123" });
    expect(postMock).toHaveBeenNthCalledWith(2, "/auth/pos-printer/login", { identifier: "legacy@example.com", password: "Password@123" });
    for (const [, body] of postMock.mock.calls) {
      expect(keysOf(body)).toEqual(["identifier", "password"]);
      expect(body).not.toHaveProperty("email");
    }
    expect(keysOf(buildPosPrinterLoginRequest({ identifier: "x", password: "y" }))).toEqual(["identifier", "password"]);
    expect(keysOf(posPrinterLoginSchema.shape)).toEqual(["identifier", "password"]);
  });

  it("never synthesizes the @pos-printer.feastflow.local alias on the client", () => {
    const login = buildPosPrinterLoginRequest({ identifier: "kitchen-1", password: "x" });
    const create = buildPosPrinterCreateRequest({ username: "kitchen-1", displayName: "Kitchen", password: "x".repeat(12) });
    expect(JSON.stringify([login, create])).not.toContain("pos-printer.feastflow.local");
  });
});
