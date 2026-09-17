import { ChangeEvent } from "react";

import { SearchField } from "@/components/common/SearchField";

interface SearchBarProps {
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
}

export default function BorderedSearchBar({
  value,
  onChange,
  placeholder = "Search…",
  className = "",
}: SearchBarProps) {
  return (
    <SearchField
        className={className}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
  );
}
