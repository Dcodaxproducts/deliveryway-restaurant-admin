"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type TableReservationsFilterState = {
  search: string;
  status: string;
  sortBy: string;
  sortOrder: "ASC" | "DESC";
  branchId: string;
};

export type TableReservationBranchOption = {
  id: string;
  name: string;
};

type TableReservationsFiltersProps = {
  filters: TableReservationsFilterState;
  branchOptions: TableReservationBranchOption[];
  isBranchAdmin: boolean;
  branchName?: string;
  onFiltersChange: (filters: Partial<TableReservationsFilterState>) => void;
};

const statusOptions = [
  { label: "All", value: "ALL" },
  { label: "REQUESTED", value: "REQUESTED" },
  { label: "CONFIRMED", value: "CONFIRMED" },
  { label: "CANCELLED", value: "CANCELLED" },
  { label: "COMPLETED", value: "COMPLETED" },
  { label: "NO_SHOW", value: "NO_SHOW" },
  { label: "SEATED", value: "SEATED" },
];

const sortByOptions = [
  { label: "Reservation date", value: "reservationDate" },
  { label: "Created at", value: "createdAt" },
  { label: "Guest count", value: "guestCount" },
  { label: "Status", value: "status" },
];

export default function TableReservationsFilters({
  filters,
  branchOptions,
  isBranchAdmin,
  branchName,
  onFiltersChange,
}: TableReservationsFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      onFiltersChange({ search: searchValue });
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [onFiltersChange, searchValue]);

  return (
    <div className="w-full rounded-lg bg-white">
      <div className="grid gap-4 lg:grid-cols-[minmax(260px,1fr)_180px_180px_140px_200px] lg:items-center">
        <div className="relative">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <Input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search by name, email, or identifier"
            className="h-[48px] rounded-[14px] pl-11"
          />
        </div>

        <Select
          value={filters.status || "ALL"}
          onValueChange={(value) => onFiltersChange({ status: value })}
        >
          <SelectTrigger className="h-[48px] rounded-[14px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.sortBy}
          onValueChange={(value) => onFiltersChange({ sortBy: value })}
        >
          <SelectTrigger className="h-[48px] rounded-[14px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortByOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.sortOrder}
          onValueChange={(value) =>
            onFiltersChange({ sortOrder: value === "ASC" ? "ASC" : "DESC" })
          }
        >
          <SelectTrigger className="h-[48px] rounded-[14px]">
            <SelectValue placeholder="Order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DESC">DESC</SelectItem>
            <SelectItem value="ASC">ASC</SelectItem>
          </SelectContent>
        </Select>

        {isBranchAdmin ? (
          <Button
            type="button"
            variant="outline"
            disabled
            className="h-[48px] justify-start rounded-[14px] text-gray-500"
          >
            {branchName || "Current branch"}
          </Button>
        ) : (
          <Select
            value={filters.branchId || "ALL"}
            onValueChange={(value) =>
              onFiltersChange({ branchId: value === "ALL" ? "" : value })
            }
          >
            <SelectTrigger className="h-[48px] rounded-[14px]">
              <SelectValue placeholder="Branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All branches</SelectItem>
              {branchOptions.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}

