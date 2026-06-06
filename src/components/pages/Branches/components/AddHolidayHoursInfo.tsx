"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import {
  AlertCircle,
  CalendarDays,
  Clock3,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslations } from "next-intl";

import {
  useGetBranchHolidayOpeningHours,
  useUpdateBranchHolidayOpeningHours,
} from "@/hooks/useBranches";
import {
  buildHolidayOpeningHoursPayload,
  formatDateToYmd,
  formatHolidayDateLabel,
  hydrateHolidayOpeningHoursEntry,
  parseYmdDate,
} from "@/components/pages/Branches/components/opening-hours/holiday-opening-hours-utils";
import type {
  HolidayOpeningHoursEntry,
  HolidayOpeningHoursFormEntry,
  HolidayOpeningHoursPayload,
} from "@/types/opening-hours";
import { getLocalTodayInputValue } from "@/lib/date-input";

type AddHolidayHoursInfoProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  branchName?: string;
};

type HolidayHourRow = HolidayOpeningHoursFormEntry;

type RawHolidayOpeningHoursEntry = HolidayOpeningHoursEntry & { id?: string };

const createRowId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const createEmptyHolidayRow = (): HolidayHourRow => ({
  id: createRowId(),
  mode: "single",
  isClosed: false,
  openTime: "10:00",
  closeTime: "18:00",
  note: "",
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const toOptionalString = (value: unknown) =>
  typeof value === "string" ? value : undefined;

const normalizeApiHolidayEntry = (
  value: unknown
): RawHolidayOpeningHoursEntry | null => {
  if (!isRecord(value)) return null;

  return {
    id: toOptionalString(value.id),
    date: toOptionalString(value.date),
    fromDate: toOptionalString(value.fromDate),
    toDate: toOptionalString(value.toDate),
    isClosed: Boolean(value.isClosed),
    openTime: toOptionalString(value.openTime),
    closeTime: toOptionalString(value.closeTime),
    note: toOptionalString(value.note),
  };
};

const extractHolidayOpeningHours = (
  response: unknown
): RawHolidayOpeningHoursEntry[] => {
  const responseRecord = isRecord(response) ? response : {};
  const dataRecord = isRecord(responseRecord.data) ? responseRecord.data : {};
  const nestedDataRecord = isRecord(dataRecord.data) ? dataRecord.data : {};
  const candidates = [
    dataRecord.holidayOpeningHours,
    nestedDataRecord.holidayOpeningHours,
    responseRecord.holidayOpeningHours,
    responseRecord.data,
    response,
  ];

  const raw = candidates.find((candidate) => Array.isArray(candidate));

  return Array.isArray(raw)
    ? raw
        .map((item) => normalizeApiHolidayEntry(item))
        .filter((item): item is RawHolidayOpeningHoursEntry => Boolean(item))
    : [];
};

export function AddHolidayHoursInfo({
  open,
  onOpenChange,
  branchId,
  branchName,
}: AddHolidayHoursInfoProps) {
  const t = useTranslations("branches");
  const commonT = useTranslations("common");
  const [rows, setRows] = useState<HolidayHourRow[]>([]);

  const {
    data: holidayHoursResponse,
    isLoading,
    isFetching,
  } = useGetBranchHolidayOpeningHours(open ? branchId : undefined);

  const { mutate: updateHolidayHours, isPending: isSaving } =
    useUpdateBranchHolidayOpeningHours();

  const fetching = isLoading || isFetching;
  const todayDate = useMemo(() => getLocalTodayInputValue(), []);

  const closedCount = useMemo(() => {
    return rows.filter((row) => row.isClosed).length;
  }, [rows]);

  const openCount = useMemo(() => {
    return rows.filter((row) => !row.isClosed).length;
  }, [rows]);

  useEffect(() => {
    if (!open) return;

    const apiRows = extractHolidayOpeningHours(holidayHoursResponse);

    if (apiRows.length > 0) {
      setRows(
        apiRows.map((row) => hydrateHolidayOpeningHoursEntry(row, createRowId()))
      );
      return;
    }

    if (!fetching) {
      setRows([]);
    }
  }, [open, holidayHoursResponse, fetching]);

  const handleAddRow = () => {
    setRows((prev) => [...prev, createEmptyHolidayRow()]);
  };

  const handleRemoveRow = (rowId: string) => {
    setRows((prev) => prev.filter((row) => row.id !== rowId));
  };

  const handleChange = (
    rowId: string,
    field: keyof HolidayHourRow,
    value: string | boolean
  ) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;

        return {
          ...row,
          [field]: value,
        };
      })
    );
  };

  const handleSubmit = () => {
    if (!branchId || isSaving) return;

    let payload: HolidayOpeningHoursPayload;

    try {
      payload = buildHolidayOpeningHoursPayload(rows);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("somethingWentWrong"));
      return;
    }

    updateHolidayHours(
      {
        branchId,
        payload,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  const handleClose = (value: boolean) => {
    if (isSaving) return;
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose} modal>
      <DialogContent
        className="
          flex max-h-[92vh] w-[calc(100vw-24px)] max-w-[960px] flex-col
          overflow-hidden rounded-[24px] border-0 bg-white p-0 shadow-2xl
          sm:w-[calc(100vw-48px)]
        "
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <DialogHeader className="shrink-0 border-b border-gray-100 bg-gradient-to-br from-primary/10 via-white to-orange-50 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-5">
            <div className="flex items-start gap-4 pr-8">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-primary text-white shadow-lg shadow-primary/25">
                <CalendarDays size={23} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-primary shadow-sm ring-1 ring-primary/10">
                  <Sparkles size={13} />
                  {t("specialSchedule")}
                </div>

                <DialogTitle className="text-[22px] font-semibold leading-tight tracking-tight text-gray-950 sm:text-[26px]">
                  {t("holidayOpeningHours")}
                </DialogTitle>

                <p className="mt-2 max-w-[560px] text-sm leading-6 text-gray-600">
                  {t("holidayOpeningHoursDescription")}
                </p>

                <div className="mt-3 inline-flex max-w-full rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-100">
                  <span className="truncate">{branchName || t("selectedBranch")}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <SummaryCard label={t("entries")} value={rows.length} />
              <SummaryCard label={t("open")} value={openCount} />
              <SummaryCard label={t("closed")} value={closedCount} />
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#F8FAFC] px-5 py-5 sm:px-6">
          <div className="mb-4 rounded-[18px] border border-blue-100 bg-blue-50/80 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-white text-blue-600 shadow-sm">
                <AlertCircle size={18} />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold leading-5 text-gray-900">
                  {t("holidayOverrideTitle")}
                </p>

                <p className="mt-1 text-sm leading-6 text-gray-600">
                  {t("holidayOverrideDescription")}
                </p>
              </div>
            </div>
          </div>

          {fetching ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <HolidayRowSkeleton key={index} />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[22px] border border-dashed border-gray-200 bg-white p-6 text-center sm:p-8">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[18px] bg-primary/10 text-primary">
                <CalendarDays size={26} />
              </div>

              <h3 className="text-base font-semibold text-gray-900">
                {t("noHolidayHours")}
              </h3>

              <p className="mt-2 max-w-[420px] text-sm leading-6 text-gray-500">
                {t("noHolidayHoursDescription")}
              </p>

              <Button
                type="button"
                onClick={handleAddRow}
                className="mt-5 h-[44px] rounded-[14px] bg-primary px-5 text-white hover:bg-primary/90"
              >
                <Plus size={16} className="mr-2" />
                {t("addHolidayHours")}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {rows.map((row, index) => (
                <HolidayHourItem
                  key={row.id}
                  row={row}
                  index={index}
                  minDate={todayDate}
                  isSaving={isSaving}
                  onChange={handleChange}
                  onRemove={handleRemoveRow}
                  labels={{
                    holidaySchedule: t("holidaySchedule"),
                    selectHolidayDate: t("selectHolidayDate"),
                    holidayDateOrRange: t("holidayDateOrRange"),
                    closed: t("closed"),
                    removeHolidayRow: t("removeHolidayRow"),
                    closedForHoliday: t("closedForHoliday"),
                    closedForHolidayDescription: t("closedForHolidayDescription"),
                    openTime: t("openTime"),
                    closeTime: t("closeTime"),
                    note: commonT("note"),
                    notePlaceholder: t("holidayNotePlaceholder"),
                  }}
                />
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={handleAddRow}
                disabled={isSaving}
                className="h-[46px] w-full rounded-[16px] border-dashed border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              >
                <Plus size={16} className="mr-2" />
                {t("addAnotherHoliday")}
              </Button>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-gray-100 bg-white px-5 py-4 sm:px-6">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-400">
              {t("branchId")}:{" "}
              <span className="font-medium text-gray-600">{branchId}</span>
            </p>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                disabled={isSaving}
                onClick={() => onOpenChange(false)}
                className="h-[44px] rounded-[14px] border-gray-200 px-5 text-gray-700"
              >
                {commonT("cancel")}
              </Button>

              <Button
                type="button"
                disabled={isSaving || fetching}
                onClick={handleSubmit}
                className="h-[44px] rounded-[14px] bg-primary px-6 text-white shadow-sm hover:bg-primary/90 disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={17} className="mr-2 animate-spin" />
                    {commonT("saving")}
                  </>
                ) : (
                  <>
                    <Save size={17} className="mr-2" />
                    {t("saveHolidayHours")}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function HolidayHourItem({
  row,
  index,
  minDate,
  isSaving,
  onChange,
  onRemove,
  labels,
}: {
  row: HolidayHourRow;
  index: number;
  minDate: string;
  isSaving: boolean;
  onChange: (
    rowId: string,
    field: keyof HolidayHourRow,
    value: string | boolean
  ) => void;
  onRemove: (rowId: string) => void;
  labels: {
    holidaySchedule: string;
    selectHolidayDate: string;
    holidayDateOrRange: string;
    closed: string;
    removeHolidayRow: string;
    closedForHoliday: string;
    closedForHolidayDescription: string;
    openTime: string;
    closeTime: string;
    note: string;
    notePlaceholder: string;
  };
}) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const selectedRange = getSelectedRange(row);
  const selectedLabel = formatHolidayDateLabel(row);
  const calendarStartDate = parseYmdDate(minDate);

  const handleDateSelect = (range: DateRange | undefined) => {
    if (!range?.from) {
      onChange(row.id, "mode", "single");
      onChange(row.id, "date", "");
      onChange(row.id, "fromDate", "");
      onChange(row.id, "toDate", "");
      return;
    }

    const fromDate = formatDateToYmd(range.from);
    const toDate = range.to ? formatDateToYmd(range.to) : undefined;

    if (!toDate) {
      onChange(row.id, "mode", "single");
      onChange(row.id, "date", fromDate);
      onChange(row.id, "fromDate", "");
      onChange(row.id, "toDate", "");
      return;
    }

    if (toDate === fromDate) {
      onChange(row.id, "mode", "single");
      onChange(row.id, "date", fromDate);
      onChange(row.id, "fromDate", "");
      onChange(row.id, "toDate", "");
      setCalendarOpen(false);
      return;
    }

    onChange(row.id, "mode", "range");
    onChange(row.id, "date", "");
    onChange(row.id, "fromDate", fromDate);
    onChange(row.id, "toDate", toDate);
    setCalendarOpen(false);
  };

  return (
    <div className="overflow-visible rounded-[22px] border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-primary/10 text-sm font-semibold text-primary">
            {index + 1}
          </div>

          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-gray-900">
              {labels.holidaySchedule}
            </h4>

            <p className="truncate text-xs text-gray-500">
              {selectedLabel || labels.selectHolidayDate}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <label className="flex cursor-pointer items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-100">
            <Checkbox
              checked={row.isClosed}
              disabled={isSaving}
              onCheckedChange={(checked) =>
                onChange(row.id, "isClosed", Boolean(checked))
              }
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            {labels.closed}
          </label>

          <button
            type="button"
            disabled={isSaving}
            onClick={() => onRemove(row.id)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label={labels.removeHolidayRow}
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-2">
        <FieldGroup label={labels.holidayDateOrRange} required>
          <div className={`relative ${calendarOpen ? "z-30" : ""}`}>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => setCalendarOpen((current) => !current)}
              className="flex h-[44px] w-full items-center rounded-[14px] border border-gray-200 bg-[#FAFAFA] pl-10 pr-3 text-left text-sm text-gray-800 outline-none transition focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CalendarDays
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <span className={selectedLabel ? "truncate" : "truncate text-gray-400"}>
                {selectedLabel || labels.selectHolidayDate}
              </span>
            </button>

            {calendarOpen ? (
              <div className="absolute left-0 top-[50px] z-50 w-max max-w-[calc(100vw-48px)] overflow-x-auto rounded-[16px] border border-gray-200 bg-white p-3 shadow-xl">
                <DayPicker
                  mode="range"
                  selected={selectedRange}
                  onSelect={handleDateSelect}
                  disabled={calendarStartDate ? { before: calendarStartDate } : undefined}
                  className="text-sm"
                  classNames={{
                    months: "flex",
                    month: "space-y-3",
                    month_caption: "flex justify-center pb-2 text-sm font-semibold text-gray-900",
                    nav: "absolute left-3 right-3 top-3 flex items-center justify-between",
                    button_previous:
                      "rounded-full p-1 text-gray-500 hover:bg-gray-100",
                    button_next: "rounded-full p-1 text-gray-500 hover:bg-gray-100",
                    weekdays: "grid grid-cols-7 gap-1 text-xs text-gray-400",
                    week: "grid grid-cols-7 gap-1",
                    day: "h-8 w-8 text-center text-sm",
                    day_button:
                      "h-8 w-8 rounded-full text-sm hover:bg-primary/10",
                    selected:
                      "[&>button]:bg-primary [&>button]:text-white [&>button]:hover:bg-primary",
                    range_middle:
                      "[&>button]:rounded-none [&>button]:bg-primary/10 [&>button]:text-primary",
                    today: "[&>button]:ring-1 [&>button]:ring-primary",
                    disabled:
                      "pointer-events-none text-gray-300 opacity-50",
                    outside: "text-gray-300",
                  }}
                />
              </div>
            ) : null}
          </div>
        </FieldGroup>

        <div
          className={`grid gap-4 ${
            row.isClosed ? "sm:grid-cols-1" : "sm:grid-cols-2"
          }`}
        >
          {row.isClosed ? (
            <div className="flex min-h-[76px] items-center rounded-[16px] border border-red-100 bg-red-50 px-4">
              <div>
                <p className="text-sm font-semibold text-red-700">
                  {labels.closedForHoliday}
                </p>

                <p className="mt-1 text-xs leading-5 text-red-500">
                  {labels.closedForHolidayDescription}
                </p>
              </div>
            </div>
          ) : (
            <>
              <FieldGroup label={labels.openTime} required>
                <div className="relative">
                  <Clock3
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="time"
                    value={row.openTime}
                    disabled={isSaving}
                    onChange={(event) =>
                      onChange(row.id, "openTime", event.target.value)
                    }
                    className="h-[44px] w-full rounded-[14px] border border-gray-200 bg-[#FAFAFA] pl-10 pr-3 text-sm text-gray-800 outline-none transition focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </FieldGroup>

              <FieldGroup label={labels.closeTime} required>
                <div className="relative">
                  <Clock3
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="time"
                    value={row.closeTime}
                    disabled={isSaving}
                    onChange={(event) =>
                      onChange(row.id, "closeTime", event.target.value)
                    }
                    className="h-[44px] w-full rounded-[14px] border border-gray-200 bg-[#FAFAFA] pl-10 pr-3 text-sm text-gray-800 outline-none transition focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </FieldGroup>
            </>
          )}
        </div>

        <div className="lg:col-span-2">
          <FieldGroup label={labels.note}>
            <input
              type="text"
              value={row.note}
              disabled={isSaving}
              placeholder={labels.notePlaceholder}
              onChange={(event) =>
                onChange(row.id, "note", event.target.value)
              }
              className="h-[44px] w-full rounded-[14px] border border-gray-200 bg-[#FAFAFA] px-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </FieldGroup>
        </div>
      </div>
    </div>
  );
}

const getSelectedRange = (row: HolidayHourRow): DateRange | undefined => {
  if (row.mode === "range") {
    if (!row.fromDate) return undefined;

    return {
      from: parseYmdDate(row.fromDate),
      to: row.toDate ? parseYmdDate(row.toDate) : undefined,
    };
  }

  if (!row.date) return undefined;

  return {
    from: parseYmdDate(row.date),
    to: undefined,
  };
};

function FieldGroup({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="block">
      <span className="mb-1.5 block text-xs font-semibold text-gray-600">
        {label}
        {required ? <span className="ml-1 text-primary">*</span> : null}
      </span>
      {children}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[16px] bg-white/90 px-3 py-3 text-center shadow-sm ring-1 ring-gray-100 backdrop-blur">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 sm:text-[11px]">
        {label}
      </p>

      <p className="mt-1 text-lg font-semibold leading-none text-gray-900">
        {value}
      </p>
    </div>
  );
}

function HolidayRowSkeleton() {
  return (
    <div className="animate-pulse rounded-[22px] border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-[12px] bg-gray-200" />

          <div>
            <div className="h-4 w-[140px] rounded bg-gray-200" />
            <div className="mt-2 h-3 w-[90px] rounded bg-gray-100" />
          </div>
        </div>

        <div className="h-8 w-[90px] rounded-full bg-gray-100" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-[44px] rounded-[14px] bg-gray-100" />
        <div className="h-[44px] rounded-[14px] bg-gray-100" />
        <div className="h-[44px] rounded-[14px] bg-gray-100" />
      </div>
    </div>
  );
}
