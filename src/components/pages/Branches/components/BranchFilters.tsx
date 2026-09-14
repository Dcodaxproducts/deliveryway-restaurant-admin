"use client";

import { useState } from "react";
import { Download, Search, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";

import { FilterBar } from "@/components/common/FilterBar";
import FilterModal, { type CommonFilterValues } from "@/components/common/FilterModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBranchAddress, type BranchListItem } from "./list";

type ExportRow = Pick<
  BranchListItem,
  "name" | "city" | "address" | "phone" | "isActive"
> & {
  createdAt?: string;
  _count?: { items?: number };
};

export type BranchFilterState = Partial<CommonFilterValues> & {
  search?: string;
  page?: number;
};

interface Props {
  branches?: readonly ExportRow[];
  filters: BranchFilterState;
  onFilterChange: (filters: BranchFilterState) => void;
  showCustomerType?: boolean;
}

const escapeCsvCell = (value: string | number | boolean | undefined) =>
  `"${String(value ?? "").replaceAll('"', '""')}"`;

export default function BranchFilters({
  branches,
  filters,
  onFilterChange,
  showCustomerType = false,
}: Props) {
  const t = useTranslations("branches");
  const commonT = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(filters.search ?? "");

  const handleSearch = () => onFilterChange({ search, page: 1 });

  const exportCSV = () => {
    if (!branches?.length) return;

    const headers = [
      commonT("name"),
      t("city"),
      commonT("address"),
      commonT("phone"),
      commonT("status"),
      commonT("createdAt"),
      t("items"),
    ];
    const rows = branches.map(({ name, city, address, phone, isActive, createdAt, _count }) => [
      name,
      city,
      formatBranchAddress(address),
      phone,
      isActive ? commonT("active") : commonT("inactive"),
      createdAt,
      _count?.items,
    ]);
    const csvContent = [headers, ...rows]
      .map((cells) => cells.map(escapeCsvCell).join(","))
      .join("\n");
    const link = document.createElement("a");
    link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;
    link.download = "data.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const visibleCount =
    branches?.filter(({ name }) => name?.toLowerCase().includes(search.toLowerCase())).length ?? 0;

  return (
    <>
      <FilterBar
        search={
          <form
            className="flex min-w-0 gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              handleSearch();
            }}
          >
            <div className="relative min-w-0 flex-1">
              <Search
                aria-hidden="true"
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ui-text-subtle)]"
              />
              <Input
                type="search"
                placeholder={commonT("searchByName")}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-11 pl-10"
              />
            </div>
            <Button type="submit" className="h-11 px-5">
              {commonT("search")}
            </Button>
          </form>
        }
        resultCount={
          branches
            ? t("filtersShowing", { visible: visibleCount, total: branches.length })
            : undefined
        }
        actions={
          <>
            <Button type="button" onClick={exportCSV} variant="outline" className="h-11 gap-2">
              <Download aria-hidden="true" size={17} />
              {commonT("export")}
            </Button>
            <Button
              type="button"
              onClick={() => setOpen(true)}
              variant="outline"
              className="h-11 gap-2"
            >
              <SlidersHorizontal aria-hidden="true" size={17} />
              {commonT("filter")}
            </Button>
          </>
        }
      />

      <FilterModal
        open={open}
        onOpenChange={setOpen}
        filters={filters}
        onApply={(values) => onFilterChange({ ...values, page: 1 })}
        showCustomerType={showCustomerType}
      />
    </>
  );
}
