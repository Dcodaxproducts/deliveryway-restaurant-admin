import { describe, expect, it } from "vitest";

import {
  canAssignTableReservation,
  canTransitionTableReservation,
  getAllowedTableReservationTransitions,
  isActiveTableReservationStatus,
  isTerminalTableReservationStatus,
  TABLE_RESERVATION_TRANSITIONS,
} from "@/lib/table-reservation-transitions";
import { TABLE_RESERVATION_STATUS_VALUES } from "@/types/table-reservations";

describe("table reservation transitions", () => {
  it("matches the platform API transition graph exactly", () => {
    // `CustomerAppService.assertTableReservationTransition` (API commit b9b00bc).
    expect(TABLE_RESERVATION_TRANSITIONS).toEqual({
      REQUESTED: ["CONFIRMED", "CANCELLED", "NO_SHOW"],
      CONFIRMED: ["SEATED", "CANCELLED", "NO_SHOW"],
      SEATED: ["COMPLETED"],
      COMPLETED: [],
      CANCELLED: [],
      NO_SHOW: [],
    });
  });

  it("covers every status exactly once and never allows a self transition", () => {
    expect(Object.keys(TABLE_RESERVATION_TRANSITIONS).sort()).toEqual(
      [...TABLE_RESERVATION_STATUS_VALUES].sort()
    );

    for (const status of TABLE_RESERVATION_STATUS_VALUES) {
      expect(canTransitionTableReservation(status, status)).toBe(false);
    }
  });

  it("rejects the two shortcuts the API forbids", () => {
    expect(canTransitionTableReservation("REQUESTED", "SEATED")).toBe(false);
    expect(canTransitionTableReservation("SEATED", "CANCELLED")).toBe(false);
  });

  it("only allows NO_SHOW while the guest is still expected", () => {
    expect(canTransitionTableReservation("REQUESTED", "NO_SHOW")).toBe(true);
    expect(canTransitionTableReservation("CONFIRMED", "NO_SHOW")).toBe(true);
    expect(canTransitionTableReservation("SEATED", "NO_SHOW")).toBe(false);
    expect(canTransitionTableReservation("COMPLETED", "NO_SHOW")).toBe(false);
    expect(canTransitionTableReservation("CANCELLED", "NO_SHOW")).toBe(false);
    expect(canTransitionTableReservation("NO_SHOW", "NO_SHOW")).toBe(false);
  });

  it("treats NO_SHOW, COMPLETED, and CANCELLED as terminal for every target", () => {
    for (const status of ["NO_SHOW", "COMPLETED", "CANCELLED"]) {
      expect(getAllowedTableReservationTransitions(status)).toEqual([]);
      expect(isTerminalTableReservationStatus(status)).toBe(true);
      expect(isActiveTableReservationStatus(status)).toBe(false);
      expect(canAssignTableReservation(status)).toBe(false);
      for (const target of TABLE_RESERVATION_STATUS_VALUES) {
        expect(canTransitionTableReservation(status, target)).toBe(false);
      }
    }
  });

  it("requires confirmation before seating and seating before completion", () => {
    expect(canTransitionTableReservation("REQUESTED", "COMPLETED")).toBe(false);
    expect(canTransitionTableReservation("CONFIRMED", "COMPLETED")).toBe(false);
    expect(canTransitionTableReservation("CONFIRMED", "SEATED")).toBe(true);
    expect(canTransitionTableReservation("SEATED", "COMPLETED")).toBe(true);
  });

  it("never reopens a reservation to REQUESTED", () => {
    for (const status of TABLE_RESERVATION_STATUS_VALUES) {
      expect(canTransitionTableReservation(status, "REQUESTED")).toBe(false);
    }
  });

  it("allows table assignment only for active reservations", () => {
    for (const status of ["REQUESTED", "CONFIRMED", "SEATED"]) {
      expect(canAssignTableReservation(status)).toBe(true);
    }
    expect(canAssignTableReservation("UNKNOWN")).toBe(false);
  });

  it("normalizes casing and rejects unknown statuses", () => {
    expect(canTransitionTableReservation("requested", "confirmed")).toBe(true);
    expect(getAllowedTableReservationTransitions("PENDING")).toEqual([]);
    expect(getAllowedTableReservationTransitions(undefined)).toEqual([]);
    expect(canTransitionTableReservation("CONFIRMED", "UNKNOWN")).toBe(false);
    expect(isActiveTableReservationStatus("seated")).toBe(true);
  });
});
