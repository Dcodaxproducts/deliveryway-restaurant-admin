"use client";

import { useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  onSearch: (value: string) => void;
  onSortChange: (value: "ASC" | "DESC") => void;
  onStatusChange: (value: string) => void;
}

export default function OrdersFilters({
  onSearch,
  onSortChange,
  onStatusChange,
}: Props) {
  const [searchValue, setSearchValue] = useState("");
  const [sort, setSort] = useState<"ASC" | "DESC">("DESC");
  const [status, setStatus] = useState("ALL");

  const handleSearch = () => {
    onSearch(searchValue);
  };

  const statuses = [
    { label: "All Status", value: "ALL" },
    { label: "Placed", value: "PLACED" },
    { label: "Confirmed", value: "CONFIRMED" },
    { label: "Preparing", value: "PREPARING" },
    { label: "Ready for Pickup", value: "READY_FOR_PICKUP" },
    { label: "Picked Up", value: "PICKED_UP" },
    { label: "Out for Delivery", value: "OUT_FOR_DELIVERY" },
    { label: "Delivered", value: "DELIVERED" },
    { label: "Cancelled", value: "CANCELLED" },
    { label: "Rejected", value: "REJECTED" },
  ];

  return (
    <div className="w-full bg-white p-4 lg:p-[20px] rounded-lg">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-4">

        {/* SEARCH */}
        <div className="relative flex-1">
          <Search
            size={22}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            type="text"
            placeholder="Search by order id"
            className="w-full h-[49px] pl-12 pr-[150px] border border-gray-200 rounded-[16px]"
          />

          <Button
            onClick={handleSearch}
            className="absolute right-0 h-full px-8 rounded-[14px] bg-primary text-white"
          >
            Search
          </Button>
        </div>

        {/* STATUS */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="h-[48px] px-6 rounded-[14px] text-red-600 border-red-200 bg-red-50 flex items-center gap-2 hover:text-white">
              {statuses.find((s) => s.value === status)?.label}
              <ChevronDown size={18} />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            {statuses.map((item) => (
              <DropdownMenuItem
              
                key={item.value}
                onClick={() => {
                  setStatus(item.value);
                  onStatusChange(item.value);
                }}
              >
                {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* SORT */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="h-[48px] px-6 rounded-[14px] text-red-600 border-red-200 bg-red-50 flex items-center gap-2 hover:text-white">
              {sort === "DESC" ? "Newest" : "Oldest"}
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
              Newest
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => {
                setSort("ASC");
                onSortChange("ASC");
              }}
            >
              Oldest
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}