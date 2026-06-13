"use client";

import { useEffect, useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslations } from "next-intl";

interface Props {
  onSearch: (value: string) => void;
  onSortChange: (value: "ASC" | "DESC") => void;
  onStatusChange: (value: string) => void;
}

const SEARCH_DEBOUNCE_MS = 350;

export function OrdersFilters({
  onSearch,
  onSortChange,
  onStatusChange,
}: Props) {
  const [searchValue, setSearchValue] = useState("");
  const [sort, setSort] = useState<"ASC" | "DESC">("DESC");
  const [status, setStatus] = useState("ALL");
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

  return (
    <div className="w-full bg-white p-4 lg:p-[20px] rounded-lg">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-4">

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
            className="w-full h-[49px] pl-12 pr-[150px] border border-gray-200 rounded-[16px]"
          />

          <Button
            onClick={handleSearch}
            className="absolute right-0 h-full px-8 rounded-[14px] bg-primary text-white"
          >
            {common("search")}
          </Button>
        </div>

        {/* STATUS */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="h-[48px] px-6 rounded-[14px] text-red-600 border-red-200 bg-red-50 flex items-center gap-2 hover:text-white">
            {statuses.find(({ value }) => value === status)?.label}
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
            <Button className="h-[48px] px-6 rounded-[14px] text-red-600 border-red-200 bg-red-50 flex items-center gap-2 hover:text-white">
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
  );
}
