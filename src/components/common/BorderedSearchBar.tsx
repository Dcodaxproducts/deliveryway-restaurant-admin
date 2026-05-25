"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChangeEvent } from "react";

interface SearchBarProps {
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onSearch?: () => void;
  placeholder?: string;
  className?: string;
}

export default function BorderedSearchBar({
  value,
  onChange,
  onSearch,
  placeholder = "Search...",
  className = "",
}: SearchBarProps) {
  return (
    <div className={`relative bg-white rounded-[14px] ${className}`}>
      {/* Search Icon */}
      <Search
        size={22}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
      />

      {/* Input */}
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="
          w-full h-[52px]
          pl-12 pr-[140px]
          border border-gray-200
          rounded-[16px]
          text-base text-dark
          placeholder:text-gray-400
          focus:outline-none
          focus:border-primary
        "
      />

      {/* Search Button */}
      <Button
        onClick={onSearch}
        className="
          absolute right-0 top-1/2 -translate-y-1/2
          h-full
          px-10
          rounded-[14px]
          bg-primary
          text-white
          text-base
          font-medium
          hover:bg-primary/90
        "
      >
        Search
      </Button>
    </div>
  );
}
