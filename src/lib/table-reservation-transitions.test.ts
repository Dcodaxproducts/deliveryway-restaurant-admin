import { describe, expect, it } from "vitest";

import {
  canTransitionTableReservation,
  getAllowedTableReservationTransitions,
  isActiveTableReservationStatus,
  isTerminalTableReservationStatus,
  TABLE_RESERVATION_TRANSITIONS,
} from "@/lib/table-reservation-transitions";
import { TABLE_RESERVATION_STATUS_VALUES } from "@/types/table-reservations";

describe("table reservation transitions", () => {
  it("covers every status exactly once and never allows a self transition", () => {
    expect(Object.keys(TABLE_RESERVATION_TRANSITIONS).sort()).toEqual(
      [...TABLE_RESERVATION_STATUS_VALUES].sort()
    );

    for (const status of TABLE_RESERVATION_STATUS_VALUES) {
      expect(canTransitionTableReservation(status, status)).toBe(false);
    }
  });

  it("only allows NO_SHOW while the guest is still expected", () => {
    expect(canTransitionTableReservation("REQUESTED", "NO_SHOW")).toBe(true);
    expect(canTransitionTableReservation("CONFIRMED", "NO_SHOW")).toBe(true);
    expect(canTransitionTableReservation("SEATED", "NO_SHOW")).toBe(false);
    expect(canTransitionTableReservation("COMPLETED", "NO_SHOW")).toBe(false);
    expect(canTransitionTableReservation("CANCELLED", "NO_SHOW")).toBe(false);
    expect(canTransitionTableReservation("NO_SHOW", "NO_SHOW")).toBe(false);
  });

  it("treats NO_SHOW, COMPLETED, and CANCELLED as terminal", () => {
    for (const status of ["NO_SHOW", "COMPLETED", "CANCELLED"]) {
      expect(getAllowedTableReservationTransitions(status)).toEqual([]);
      expect(isTerminalTableReservationStatus(status)).toBe(true);
      expect(isActiveTableReservationStatus(status)).toBe(false);
    }
  });

  it("requires seating before completion", () => {
    expect(canTransitionTableReservation("REQUESTED", "COMPLETED")).toBe(false);
    expect(canTransitionTableReservation("CONFIRMED", "COMPLETED")).toBe(false);
    expect(canTransitionTableReservation("SEATED", "COMPLETED")).toBe(true);
  });

  it("never reopens a reservation to REQUESTED", () => {
    for (const status of TABLE_RESERVATION_STATUS_VALUES) {
      expect(canTransitionTableReservation(status, "REQUESTED")).toBe(false);
    }
  });

  it("normalizes casing and rejects unknown statuses", () => {
    expect(canTransitionTableReservation("requested", "confirmed")).toBe(true);
    expect(getAllowedTableReservationTransitions("PENDING")).toEqual([]);
    expect(getAllowedTableReservationTransitions(undefined)).toEqual([]);
    expect(canTransitionTableReservation("CONFIRMED", "UNKNOWN")).toBe(false);
    expect(isActiveTableReservationStatus("seated")).toBe(true);
  });
});
