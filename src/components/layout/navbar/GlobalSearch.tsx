"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { GlobalSearchDropdown } from "@/components/layout/navbar/GlobalSearchDropdown";
import { buildUnifiedSearchHref } from "@/components/layout/navbar/global-search-config";
import { useCurrentScope } from "@/hooks/useCurrentScope";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import type { GlobalSearchResult } from "@/types/global-search";

const useDebouncedValue = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);

  return debouncedValue;
};

export function GlobalSearch() {
  const router = useRouter();
  const scope = useCurrentScope();
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchValue, setSearchValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debouncedQuery = useDebouncedValue(searchValue, 400);
  const trimmedQuery = searchValue.trim();
  const shouldSearch = debouncedQuery.trim().length >= 2;

  const { data, isFetching, error } = useGlobalSearch({
    query: debouncedQuery,
    restaurantId: scope.restaurantId,
    branchId: scope.isBranchAdmin ? scope.branchId : undefined,
    enabled: shouldSearch,
  });

  const results = useMemo(() => {
    return data?.groups.flatMap((group) => group.results.slice(0, 5)) ?? [];
  }, [data?.groups]);

  const selectedResult = selectedIndex >= 0 ? results[selectedIndex] : undefined;

  useEffect(() => {
    if (trimmedQuery.length < 2) {
      setIsOpen(false);
      setSelectedIndex(-1);
      return;
    }

    setIsOpen(true);
  }, [trimmedQuery]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const navigate = (href: string) => {
    setIsOpen(false);
    setSelectedIndex(-1);
    router.push(href);
  };

  const handleResultClick = (result: GlobalSearchResult) => {
    navigate(result.href);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      setSelectedIndex(-1);
      return;
    }

    if (!isOpen || results.length === 0) {
      if (event.key === "Enter" && trimmedQuery.length >= 2) {
        navigate(buildUnifiedSearchHref(trimmedQuery));
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((current) => (current + 1) % results.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((current) => (current <= 0 ? results.length - 1 : current - 1));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      if (selectedResult) {
        navigate(selectedResult.href);
        return;
      }

      if (trimmedQuery.length >= 2) {
        navigate(buildUnifiedSearchHref(trimmedQuery));
      }
    }
  };

  return (
    <div ref={containerRef} className="hidden md:block flex-1 max-w-7xl ml-3 ">
      <div className="relative flex items-center bg-white border border-gray-300 rounded-lg px-3 h-[56px] focus-within:ring-2 focus-within:ring-ring transition-all">
        <Input
          type="text"
          placeholder="Search here"
          value={searchValue}
          onChange={(event) => {
            setSearchValue(event.target.value);
            setSelectedIndex(-1);
          }}
          onFocus={() => {
            if (trimmedQuery.length >= 2) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          aria-label="Global search"
          aria-expanded={isOpen}
          aria-controls="global-search-dropdown"
          aria-autocomplete="list"
          className="flex-1 border-none shadow-none focus-visible:ring-0 h-full px-0 text-base"
        />
        {isFetching && shouldSearch ? (
          <Loader2 className="w-[22px] h-[22px] animate-spin text-gray-400 stroke-1" />
        ) : (
          <Search className="w-[24px] h-[24px] text-gray-400 stroke-1" />
        )}

        {isOpen && shouldSearch ? (
          <div id="global-search-dropdown">
            <GlobalSearchDropdown
              groups={data?.groups ?? []}
              loading={isFetching && !data}
              error={error ? "Search is temporarily unavailable" : undefined}
              selectedHref={selectedResult?.href}
              onResultClick={handleResultClick}
              onViewAllClick={navigate}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
