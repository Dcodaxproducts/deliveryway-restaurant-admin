import { describe, expect, it } from "vitest";

import {
  buildHolidayOpeningHoursPayload,
  getHolidayOpeningHoursValidationError,
  hydrateHolidayOpeningHoursEntry,
} from "@/components/pages/Branches/components/opening-hours/holiday-opening-hours-utils";
import type { HolidayOpeningHoursFormEntry } from "@/types/opening-hours";

const baseEntry: HolidayOpeningHoursFormEntry = {
  id: "row-1",
  mode: "single",
  date: "2026-06-17",
  isClosed: true,
  openTime: "10:00",
  closeTime: "18:00",
  note: "",
};

describe("holiday opening hours utils", () => {
  it("builds a closed single-date payload", () => {
    expect(buildHolidayOpeningHoursPayload([baseEntry])).toEqual({
      holidayOpeningHours: [{ date: "2026-06-17", isClosed: true }],
    });
  });

  it("builds a closed range payload", () => {
    expect(
      buildHolidayOpeningHoursPayload([
        {
          ...baseEntry,
          mode: "range",
          date: undefined,
          fromDate: "2026-06-17",
          toDate: "2026-06-19",
          note: " Eid holidays ",
        },
      ])
    ).toEqual({
      holidayOpeningHours: [
        {
          fromDate: "2026-06-17",
          toDate: "2026-06-19",
          isClosed: true,
          note: "Eid holidays",
        },
      ],
    });
  });

  it("includes times for an open single holiday", () => {
    expect(
      buildHolidayOpeningHoursPayload([
        {
          ...baseEntry,
          isClosed: false,
          openTime: "10:00",
          closeTime: "18:00",
        },
      ])
    ).toEqual({
      holidayOpeningHours: [
        {
          date: "2026-06-17",
          isClosed: false,
          openTime: "10:00",
          closeTime: "18:00",
        },
      ],
    });
  });

  it("omits times for closed holidays", () => {
    const payload = buildHolidayOpeningHoursPayload([
      {
        ...baseEntry,
        isClosed: true,
        openTime: "10:00",
        closeTime: "18:00",
      },
    ]);

    expect(payload.holidayOpeningHours[0]).not.toHaveProperty("openTime");
    expect(payload.holidayOpeningHours[0]).not.toHaveProperty("closeTime");
  });

  it("fails validation when range end is before range start", () => {
    expect(
      getHolidayOpeningHoursValidationError([
        {
          ...baseEntry,
          mode: "range",
          date: undefined,
          fromDate: "2026-06-19",
          toDate: "2026-06-17",
        },
      ])
    ).toBe("Holiday range end date must be same as or after start date");
  });

  it("fails validation for open holidays without times", () => {
    expect(
      getHolidayOpeningHoursValidationError([
        {
          ...baseEntry,
          isClosed: false,
          openTime: "",
          closeTime: "",
        },
      ])
    ).toBe("Open time and close time are required for open holidays");
  });

  it("never sends both date and range fields together", () => {
    const payload = buildHolidayOpeningHoursPayload([
      baseEntry,
      {
        ...baseEntry,
        id: "row-2",
        mode: "range",
        date: undefined,
        fromDate: "2026-06-18",
        toDate: "2026-06-19",
      },
    ]);

    expect(payload.holidayOpeningHours[0]).toHaveProperty("date");
    expect(payload.holidayOpeningHours[0]).not.toHaveProperty("fromDate");
    expect(payload.holidayOpeningHours[0]).not.toHaveProperty("toDate");
    expect(payload.holidayOpeningHours[1]).not.toHaveProperty("date");
    expect(payload.holidayOpeningHours[1]).toHaveProperty("fromDate");
    expect(payload.holidayOpeningHours[1]).toHaveProperty("toDate");
  });

  it("hydrates existing date entries as single", () => {
    expect(
      hydrateHolidayOpeningHoursEntry(
        {
          date: "2026-06-17",
          isClosed: true,
        },
        "row-1"
      )
    ).toMatchObject({
      id: "row-1",
      mode: "single",
      date: "2026-06-17",
    });
  });

  it("hydrates existing from/to entries as range", () => {
    expect(
      hydrateHolidayOpeningHoursEntry(
        {
          fromDate: "2026-06-17",
          toDate: "2026-06-19",
          isClosed: false,
          openTime: "10:00",
          closeTime: "18:00",
        },
        "row-1"
      )
    ).toMatchObject({
      id: "row-1",
      mode: "range",
      fromDate: "2026-06-17",
      toDate: "2026-06-19",
      openTime: "10:00",
      closeTime: "18:00",
    });
  });

  it("blocks duplicate single dates", () => {
    expect(
      getHolidayOpeningHoursValidationError([
        baseEntry,
        {
          ...baseEntry,
          id: "row-2",
        },
      ])
    ).toBe("Duplicate holiday dates are not allowed");
  });

  it("blocks exact duplicate ranges", () => {
    expect(
      getHolidayOpeningHoursValidationError([
        {
          ...baseEntry,
          mode: "range",
          date: undefined,
          fromDate: "2026-06-17",
          toDate: "2026-06-19",
        },
        {
          ...baseEntry,
          id: "row-2",
          mode: "range",
          date: undefined,
          fromDate: "2026-06-17",
          toDate: "2026-06-19",
        },
      ])
    ).toBe("Duplicate holiday date ranges are not allowed");
  });
});
