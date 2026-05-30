"use client";

import { Search, Download, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import FilterModal from "@/components/common/FilterModal";
import { Input } from "@/components/ui/input";

interface Props {
  branches?: any[];
  filters: any;
  onFilterChange: (filters: any) => void;
}

export default function BranchFilters({
  branches,
  filters,
  onFilterChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(filters?.search ?? "");

  const handleSearch = () => {
    onFilterChange({ search, page: 1 });
  };


  const exportCSV = () => {
    if (!branches || branches.length === 0) return;

    const headers = [
      "Name",
      "City",
      "Address",
      "Phone",
      "Status",
      "CreatedAt",
      "Items"
    ];

    const rows = branches.map(({ name, city, address, phone, isActive, createdAt, _count }) => [
      name ?? "",
      city ?? "",
      address ?? "",
      phone ?? "",
      isActive ? "Active" : "Inactive",
      createdAt ?? "",
      _count?.items ?? "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows]
        .map((cells) => cells.map((cell) => `"${cell}"`).join(","))
        .join("\n");

    const encodedUri = encodeURI(csvContent);

    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
link.setAttribute("download", "data.csv");

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredBranches =
    branches?.filter(({ name }) =>
      name?.toLowerCase().includes(search.toLowerCase())
    ) ?? [];

  return (
    <div className="w-full bg-white rounded-lg">
      <div className="w-full flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-3">

        <div className="relative flex-1 min-w-[300px]">
          <Search
            size={22}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <Input
            type="text"
            placeholder="Search by name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="
              w-full h-[44px]
              pl-10 pr-[160px]
              bg-transparent
              border-0 border-b border-gray-200
              text-lg text-dark
              placeholder:text-gray-400
              focus:outline-none
              focus:border-primary
              focus:ring-0
              rounded-br-[14px]
            "
          />

          <Button
            onClick={handleSearch}
            className="
              absolute right-0 top-1/1 -translate-y-1/1
              h-[44px]
              px-10
              rounded-[14px]
              bg-primary
              text-white
              text-[16px]
              font-[600]
              hover:bg-primary/90
            "
          >
            Search
          </Button>
        </div>

        {/* EXPORT */}
        <Button
          onClick={exportCSV}
          variant="outline"
          className="h-[44px] px-5 rounded-[14px] border-[#E5E7EB] flex items-center gap-2 shrink-0 text-[#767676] text-[15px] font-[600]"
        >
          <Download size={18} color="#767676" />
          Export
        </Button>

        {/* FILTER MODAL */}
        <Button
          onClick={() => setOpen(true)}
          variant="outline"
          className="h-[44px] px-5 rounded-[14px] border-[#E5E7EB] text-[#767676] flex items-center gap-2 text-[15px] font-[600]"
        >
          <SlidersHorizontal size={18} color="#767676" />
          Filter
        </Button>
      </div>

      <FilterModal
        open={open}
        onOpenChange={setOpen}
        filters={filters}
        onApply={(f: any) => onFilterChange({ ...f, page: 1 })}
      />

      {branches && (
        <p className="text-sm text-gray-400 mt-3">
          Showing {filteredBranches.length} of {branches.length} results
        </p>
      )}
    </div>
  );
}
