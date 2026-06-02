"use client";

import { Loader2 } from "lucide-react";
import type { GlobalSearchGroup, GlobalSearchResult } from "@/types/global-search";

type GlobalSearchDropdownProps = {
  groups: GlobalSearchGroup[];
  loading: boolean;
  error?: string;
  selectedHref?: string;
  onResultClick: (result: GlobalSearchResult) => void;
  onViewAllClick: (href: string) => void;
};

export function GlobalSearchDropdown({
  groups,
  loading,
  error,
  selectedHref,
  onResultClick,
  onViewAllClick,
}: GlobalSearchDropdownProps) {
  const hasResults = groups.some((group) => group.results.length > 0);

  return (
    <div className="absolute left-0 right-0 top-[64px] z-50 max-h-[70vh] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
      {loading ? (
        <div className="flex items-center gap-2 px-4 py-4 text-sm text-gray-500">
          <Loader2 className="size-4 animate-spin" />
          Searching...
        </div>
      ) : null}

      {!loading && error ? (
        <div className="px-4 py-3 text-sm text-red-500">{error}</div>
      ) : null}

      {!loading && !error && !hasResults ? (
        <div className="px-4 py-4 text-sm text-gray-500">No results found</div>
      ) : null}

      {!loading && !error && hasResults ? (
        <div className="py-2">
          {groups
            .filter((group) => group.results.length > 0)
            .map((group) => (
              <section key={group.entity} className="border-b border-gray-100 last:border-b-0">
                <div className="flex items-center justify-between px-4 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {group.label}
                  </p>
                  <button
                    type="button"
                    className="text-xs font-medium text-primary hover:underline"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => onViewAllClick(group.href)}
                  >
                    View all
                  </button>
                </div>

                <div className="pb-2">
                  {group.results.slice(0, 5).map((result) => {
                    const isSelected = selectedHref === result.href;

                    return (
                      <button
                        key={`${result.entity}-${result.id}`}
                        type="button"
                        className={`flex w-full items-start gap-3 px-4 py-2 text-left transition-colors ${
                          isSelected ? "bg-primary/10" : "hover:bg-gray-50"
                        }`}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => onResultClick(result)}
                      >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {result.title.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {result.title}
                            </p>
                            {result.status ? (
                              <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
                                {result.status}
                              </span>
                            ) : null}
                          </div>
                          {result.subtitle ? (
                            <p className="truncate text-xs text-gray-500">{result.subtitle}</p>
                          ) : null}
                          {result.description ? (
                            <p className="truncate text-xs text-gray-400">{result.description}</p>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
        </div>
      ) : null}
    </div>
  );
}
