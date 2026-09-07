import type { TrendRange } from "@/components/pages/Reports/components/graphs/orders-graph";

export type CustomReportPeriod = {
  from: string;
  to: string;
};

const parseLocalDate = (value: string, endOfDay: boolean) => {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(
    year,
    month - 1,
    day,
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0,
  );

  return date;
};

export const isValidCustomReportPeriod = (period: CustomReportPeriod) =>
  Boolean(period.from && period.to && period.from <= period.to);

const formatDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getPreviousCalendarMonthPeriod = (
  now = new Date(),
): CustomReportPeriod => {
  const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const to = new Date(now.getFullYear(), now.getMonth(), 0);

  return {
    from: formatDateInputValue(from),
    to: formatDateInputValue(to),
  };
};

export const resolveReportDateRange = (
  range: TrendRange,
  customPeriod?: CustomReportPeriod | null,
  now = new Date(),
) => {
  if (customPeriod && isValidCustomReportPeriod(customPeriod)) {
    return {
      fromDate: parseLocalDate(customPeriod.from, false).toISOString(),
      toDate: parseLocalDate(customPeriod.to, true).toISOString(),
    };
  }

  const from = new Date(now);
  from.setHours(0, 0, 0, 0);
  if (range === "weekly") from.setDate(from.getDate() - 6);
  if (range === "monthly") from.setDate(1);

  return {
    fromDate: from.toISOString(),
    toDate: now.toISOString(),
  };
};
