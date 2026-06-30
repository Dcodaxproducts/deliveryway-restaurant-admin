"use client";

import { useEffect, useState } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import { CalendarDays, ChevronDown, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  OrdersScheduleDateRange,
  OrdersScheduleFilter,
} from "@/components/pages/Orders/utils/orders-schedule-filters";
import { useTranslations } from "next-intl";

interface Props {
  onSearch: (value: string) => void;
  onSortChange: (value: "ASC" | "DESC") => void;
  onStatusChange: (value: string) => void;
  scheduleFilter: OrdersScheduleFilter;
  scheduleRange: OrdersScheduleDateRange;
  onScheduleFilterChange: (value: OrdersScheduleFilter) => void;
  onScheduleRangeChange: (value: OrdersScheduleDateRange) => void;
}

const SEARCH_DEBOUNCE_MS = 350;

const formatRangeDate = (date?: Date) => {
  if (!date) return "";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export function OrdersFilters({
  onSearch,
  onSortChange,
  onStatusChange,
  scheduleFilter,
  scheduleRange,
  onScheduleFilterChange,
  onScheduleRangeChange,
}: Props) {
  const [searchValue, setSearchValue] = useState("");
  const [sort, setSort] = useState<"ASC" | "DESC">("DESC");
  const [status, setStatus] = useState("ALL");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const common = useTranslations("common");
  const t = useTranslations("orders");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      onSearch(searchValue.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [onSearch, searchValue]);

  const handleSearch = () => {
    onSearch(searchValue.trim());
  };

  const statuses = [
    { label: t("allStatus"), value: "ALL" },
    { label: t("status.PLACED"), value: "PLACED" },
    { label: t("status.CONFIRMED"), value: "CONFIRMED" },
    { label: t("status.PREPARING"), value: "PREPARING" },
    { label: t("status.READY"), value: "READY_FOR_PICKUP" },
    { label: t("status.PICKED_UP"), value: "PICKED_UP" },
    { label: t("status.READY_TO_SERVE"), value: "READY_TO_SERVE" },
    { label: t("status.SERVED"), value: "SERVED" },
    { label: t("status.OUT_FOR_DELIVERY"), value: "OUT_FOR_DELIVERY" },
    { label: t("status.DELIVERED"), value: "DELIVERED" },
    { label: t("status.CANCELLED"), value: "CANCELLED" },
    { label: t("status.REJECTED"), value: "REJECTED" },
  ];
  const scheduleFilters: Array<{ label: string; value: OrdersScheduleFilter }> = [
    { label: t("scheduleFilterAll"), value: "ALL" },
    { label: t("scheduleFilterPreorders"), value: "PREORDERS" },
    { label: t("scheduleFilterToday"), value: "TODAY_SCHEDULED" },
    { label: t("scheduleFilterPast"), value: "PAST_SCHEDULED" },
    { label: t("scheduleFilterCustom"), value: "CUSTOM_RANGE" },
  ];
  const selectedScheduleLabel =
    scheduleFilters.find(({ value }) => value === scheduleFilter)?.label ??
    t("scheduleFilterAll");
  const rangeLabel =
    scheduleRange.from || scheduleRange.to
      ? `${formatRangeDate(scheduleRange.from) || t("scheduleRangeStart")} - ${
          formatRangeDate(scheduleRange.to) || t("scheduleRangeEnd")
        }`
      : t("scheduleRangePlaceholder");
  const selectedRange: DateRange | undefined = scheduleRange.from
    ? { from: scheduleRange.from, to: scheduleRange.to }
    : undefined;
  const handleRangeSelect = (range: DateRange | undefined) => {
    onScheduleRangeChange({ from: range?.from, to: range?.to });
    if (range?.from && range?.to) {
      setCalendarOpen(false);
    }
  };
  const handleScheduleFilterChange = (value: OrdersScheduleFilter) => {
    onScheduleFilterChange(value);
    if (value !== "CUSTOM_RANGE") {
      setCalendarOpen(false);
    }
  };
  const clearScheduleFilters = () => {
    onScheduleFilterChange("ALL");
    onScheduleRangeChange({});
    setCalendarOpen(false);
  };

  return (
    <div className="w-full rounded-lg border border-gray-100 bg-white p-4 shadow-sm lg:p-[20px]">
      <div className="grid gap-4 xl:grid-cols-[minmax(280px,1fr)_auto_auto] xl:items-center">

        <div className="relative flex-1">
          <Search
            size={22}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            type="text"
            placeholder={t("searchPlaceholder")}
            className="h-[49px] w-full rounded-[16px] border border-gray-200 pl-12 pr-[112px] text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10 sm:pr-[150px]"
          />

          <Button
            onClick={handleSearch}
            className="absolute right-0 h-full rounded-[14px] bg-primary px-5 text-white sm:px-8"
          >
            {common("search")}
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:flex">
          {/* STATUS */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-[48px] justify-between gap-2 rounded-[14px] border border-red-100 bg-red-50 px-5 text-red-600 hover:text-white">
                <span className="truncate">
                  {statuses.find(({ value }) => value === status)?.label}
                </span>
                <ChevronDown size={18} />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              {statuses.map(({ label, value }) => (
                <DropdownMenuItem
                  key={value}
                  onClick={() => {
                    setStatus(value);
                    onStatusChange(value);
                  }}
                >
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* SORT */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-[48px] justify-between gap-2 rounded-[14px] border border-red-100 bg-red-50 px-5 text-red-600 hover:text-white">
                {sort === "DESC" ? common("newest") : common("oldest")}
                <ChevronDown size={18} />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setSort("DESC");
                  onSortChange("DESC");
                }}
              >
                {common("newest")}
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => {
                  setSort("ASC");
                  onSortChange("ASC");
                }}
              >
                {common("oldest")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-[18px] border border-gray-100 bg-gray-50 p-3 lg:grid-cols-[minmax(220px,280px)_minmax(260px,1fr)_auto] lg:items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-[48px] justify-between gap-2 rounded-[14px] border-gray-200 bg-white px-5 text-gray-700"
            >
              <span className="truncate">{selectedScheduleLabel}</span>
              <ChevronDown size={18} />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-64">
            {scheduleFilters.map(({ label, value }) => (
              <DropdownMenuItem
                key={value}
                onClick={() => handleScheduleFilterChange(value)}
              >
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className={`relative ${calendarOpen ? "z-30" : ""}`}>
          <Button
            type="button"
            variant="outline"
            disabled={scheduleFilter !== "CUSTOM_RANGE"}
            onClick={() => setCalendarOpen((current) => !current)}
            className="h-[48px] w-full justify-start gap-3 rounded-[14px] border-gray-200 bg-white px-5 text-left text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CalendarDays size={18} className="text-primary" />
            <span className="truncate">{rangeLabel}</span>
          </Button>

          {calendarOpen && scheduleFilter === "CUSTOM_RANGE" ? (
            <div className="absolute left-0 top-[56px] z-50 w-max max-w-[calc(100vw-48px)] overflow-x-auto rounded-[20px] border border-gray-200 bg-white p-3 shadow-xl">
              <DayPicker
                mode="range"
                selected={selectedRange}
                onSelect={handleRangeSelect}
                numberOfMonths={1}
                className="text-sm"
                classNames={{
                  months: "flex",
                  month: "space-y-3",
                  month_caption:
                    "flex justify-center pb-2 text-sm font-semibold text-gray-900",
                  nav: "absolute left-3 right-3 top-3 flex items-center justify-between",
                  button_previous:
                    "rounded-full p-1 text-gray-500 hover:bg-gray-100",
                  button_next:
                    "rounded-full p-1 text-gray-500 hover:bg-gray-100",
                  weekdays: "grid grid-cols-7 gap-1 text-xs text-gray-400",
                  week: "grid grid-cols-7 gap-1",
                  day: "h-8 w-8 text-center text-sm",
                  day_button: "h-8 w-8 rounded-full text-sm hover:bg-primary/10",
                  range_start:
                    "[&>button]:bg-primary [&>button]:text-white [&>button]:hover:bg-primary",
                  range_end:
                    "[&>button]:bg-primary [&>button]:text-white [&>button]:hover:bg-primary",
                  range_middle: "[&>button]:bg-primary/10",
                  selected:
                    "[&>button]:bg-primary [&>button]:text-white [&>button]:hover:bg-primary",
                  today: "[&>button]:ring-1 [&>button]:ring-primary",
                  outside: "text-gray-400",
                }}
              />
            </div>
          ) : null}
        </div>

        <Button
          type="button"
          variant="ghost"
          onClick={clearScheduleFilters}
          className="h-[48px] justify-center gap-2 rounded-[14px] px-5 text-gray-500 hover:text-gray-900"
        >
          <X size={16} />
          {common("clear")}
        </Button>
      </div>
    </div>
  );
}
