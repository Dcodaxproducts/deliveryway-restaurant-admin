type DateTimeInput = Date | string | number | null | undefined;

const DEFAULT_DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  dateStyle: "medium",
  timeStyle: "short",
};

const DEFAULT_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
};

const parseDateTimeInput = (value: DateTimeInput) => {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return value;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parseTimeInput = (value: DateTimeInput) => {
  if (typeof value === "string" && /^\d{1,2}:\d{2}(:\d{2})?$/.test(value)) {
    return parseDateTimeInput(`1970-01-01T${value}`);
  }

  return parseDateTimeInput(value);
};

const withTwentyFourHourTime = (
  options: Intl.DateTimeFormatOptions
): Intl.DateTimeFormatOptions => ({
  ...options,
  hour12: false,
  hourCycle: "h23",
});

export const formatDateTime24 = ({
  value,
  options = DEFAULT_DATE_TIME_OPTIONS,
  fallback = "-",
  locale,
}: {
  value: DateTimeInput;
  options?: Intl.DateTimeFormatOptions;
  fallback?: string;
  locale?: string | string[];
}) => {
  const date = parseDateTimeInput(value);
  if (!date) return fallback;

  return new Intl.DateTimeFormat(
    locale,
    withTwentyFourHourTime(options)
  ).format(date);
};

export const formatTime24 = ({
  value,
  options = DEFAULT_TIME_OPTIONS,
  fallback = "-",
  locale,
}: {
  value: DateTimeInput;
  options?: Intl.DateTimeFormatOptions;
  fallback?: string;
  locale?: string | string[];
}) => {
  const date = parseTimeInput(value);
  if (!date) return fallback;

  return new Intl.DateTimeFormat(
    locale,
    withTwentyFourHourTime(options)
  ).format(date);
};
