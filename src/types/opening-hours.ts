export type HolidayOpeningHoursEntry = {
  date?: string;
  fromDate?: string;
  toDate?: string;
  isClosed: boolean;
  openTime?: string;
  closeTime?: string;
  note?: string;
};

export type HolidayOpeningHoursPayload = {
  holidayOpeningHours: HolidayOpeningHoursEntry[];
};

export type HolidayDateSelectionMode = "single" | "range";

export type HolidayOpeningHoursFormEntry = {
  id: string;
  mode: HolidayDateSelectionMode;
  date?: string;
  fromDate?: string;
  toDate?: string;
  isClosed: boolean;
  openTime?: string;
  closeTime?: string;
  note?: string;
};
