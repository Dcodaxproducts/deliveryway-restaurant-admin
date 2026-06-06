import type {
  HolidayOpeningHoursEntry,
  HolidayOpeningHoursFormEntry,
  HolidayOpeningHoursPayload,
} from "@/types/opening-hours";

const YMD_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export const formatDateToYmd = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const parseYmdDate = (value: string): Date | undefined => {
  if (!YMD_PATTERN.test(value)) return undefined;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined;
  }

  return date;
};

const formatReadableDate = (value?: string) => {
  const date = value ? parseYmdDate(value) : undefined;

  if (!date) return "";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

export const isRangeEntry = (
  entry: Pick<HolidayOpeningHoursFormEntry, "mode" | "fromDate" | "toDate">
) => entry.mode === "range" && Boolean(entry.fromDate && entry.toDate);

export const formatHolidayDateLabel = (
  entry: Pick<
    HolidayOpeningHoursFormEntry,
    "mode" | "date" | "fromDate" | "toDate"
  >
) => {
  if (isRangeEntry(entry) && entry.fromDate !== entry.toDate) {
    return `${formatReadableDate(entry.fromDate)} - ${formatReadableDate(
      entry.toDate
    )}`;
  }

  return formatReadableDate(entry.date || entry.fromDate) || "";
};

const normalizeDateRange = (entry: HolidayOpeningHoursFormEntry) => {
  if (entry.mode === "single") {
    return entry.date ? { start: entry.date, end: entry.date } : null;
  }

  if (!entry.fromDate || !entry.toDate) return null;

  return { start: entry.fromDate, end: entry.toDate };
};

export const hasOverlappingHolidayEntries = (
  entries: HolidayOpeningHoursFormEntry[]
) => {
  const ranges = entries
    .map(normalizeDateRange)
    .filter((range): range is { start: string; end: string } => Boolean(range))
    .sort((left, right) => left.start.localeCompare(right.start));

  for (let index = 1; index < ranges.length; index += 1) {
    if (ranges[index].start <= ranges[index - 1].end) return true;
  }

  return false;
};

export const getHolidayOpeningHoursValidationError = (
  entries: HolidayOpeningHoursFormEntry[]
) => {
  const singleDates = new Set<string>();
  const exactRanges = new Set<string>();

  for (const entry of entries) {
    if (entry.mode !== "single" && entry.mode !== "range") {
      return "Holiday date selection mode is invalid";
    }

    if (entry.mode === "single") {
      if (!entry.date || !parseYmdDate(entry.date)) {
        return "Holiday date is required";
      }

      if (singleDates.has(entry.date)) {
        return "Duplicate holiday dates are not allowed";
      }

      singleDates.add(entry.date);
    }

    if (entry.mode === "range") {
      if (!entry.fromDate || !parseYmdDate(entry.fromDate)) {
        return "Holiday range start date is required";
      }

      if (!entry.toDate || !parseYmdDate(entry.toDate)) {
        return "Holiday range end date is required";
      }

      if (entry.toDate < entry.fromDate) {
        return "Holiday range end date must be same as or after start date";
      }

      const exactRange = `${entry.fromDate}:${entry.toDate}`;

      if (exactRanges.has(exactRange)) {
        return "Duplicate holiday date ranges are not allowed";
      }

      exactRanges.add(exactRange);
    }

    if (!entry.isClosed) {
      if (!entry.openTime || !entry.closeTime) {
        return "Open time and close time are required for open holidays";
      }

      if (!TIME_PATTERN.test(entry.openTime) || !TIME_PATTERN.test(entry.closeTime)) {
        return "Open time and close time must use HH:mm format";
      }

      if (entry.closeTime <= entry.openTime) {
        return "Close time must be after open time";
      }
    }
  }

  if (hasOverlappingHolidayEntries(entries)) {
    return "Holiday dates or ranges cannot overlap";
  }

  return null;
};

const buildScheduleFields = (entry: HolidayOpeningHoursFormEntry) => {
  if (entry.isClosed) return {};

  return {
    openTime: entry.openTime,
    closeTime: entry.closeTime,
  };
};

const buildNoteField = (note?: string) => {
  const trimmedNote = note?.trim();

  return trimmedNote ? { note: trimmedNote } : {};
};

export const buildHolidayOpeningHoursPayload = (
  entries: HolidayOpeningHoursFormEntry[]
): HolidayOpeningHoursPayload => {
  const validationError = getHolidayOpeningHoursValidationError(entries);

  if (validationError) {
    throw new Error(validationError);
  }

  return {
    holidayOpeningHours: entries.map((entry): HolidayOpeningHoursEntry => {
      const baseFields = {
        isClosed: entry.isClosed,
        ...buildScheduleFields(entry),
        ...buildNoteField(entry.note),
      };

      if (entry.mode === "range" && entry.fromDate && entry.toDate) {
        return {
          fromDate: entry.fromDate,
          toDate: entry.toDate,
          ...baseFields,
        };
      }

      return {
        date: entry.date,
        ...baseFields,
      };
    }),
  };
};

export const hydrateHolidayOpeningHoursEntry = (
  entry: HolidayOpeningHoursEntry & { id?: string },
  id: string
): HolidayOpeningHoursFormEntry => {
  const hasRange = Boolean(entry.fromDate && entry.toDate);

  return {
    id: entry.id || id,
    mode: hasRange ? "range" : "single",
    date: hasRange ? undefined : entry.date,
    fromDate: hasRange ? entry.fromDate : undefined,
    toDate: hasRange ? entry.toDate : undefined,
    isClosed: entry.isClosed,
    openTime: entry.openTime || "",
    closeTime: entry.closeTime || "",
    note: entry.note || "",
  };
};
