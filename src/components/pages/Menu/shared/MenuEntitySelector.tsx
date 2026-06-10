"use client";

import { Check, Loader2, Search, X } from "lucide-react";
import type { ReactNode, UIEvent } from "react";

import { Button } from "@/components/ui/button";

type MenuEntitySelectorProps<TOption extends { id: string; name: string }> = {
  value: string[];
  options: TOption[];
  search: string;
  selectedOptions: TOption[];
  loading: boolean;
  hasNext?: boolean;
  searchPlaceholder: string;
  imageFallback: string;
  emptyTitle: string;
  selectedCountLabel: string;
  clearLabel: string;
  helpText: string;
  loadMoreHint?: string;
  showingCountLabel?: string;
  error?: string;
  getImageUrl?: (option: TOption) => string | null | undefined;
  renderMeta?: (option: TOption) => ReactNode;
  onSearchChange: (value: string) => void;
  onToggle: (option: TOption) => void;
  onClear: () => void;
  onOptionsScroll?: (event: UIEvent<HTMLDivElement>) => void;
};

export default function MenuEntitySelector<
  TOption extends { id: string; name: string },
>({
  value,
  options,
  search,
  selectedOptions,
  loading,
  hasNext = false,
  searchPlaceholder,
  imageFallback,
  emptyTitle,
  selectedCountLabel,
  clearLabel,
  helpText,
  loadMoreHint,
  showingCountLabel,
  error,
  getImageUrl,
  renderMeta,
  onSearchChange,
  onToggle,
  onClear,
  onOptionsScroll,
}: MenuEntitySelectorProps<TOption>) {
  return (
    <div className="space-y-3">
      <div className="rounded-[14px] border border-gray-200 bg-white">
        <div className="border-b border-gray-100 p-3">
          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-[42px] w-full rounded-[12px] border border-gray-200 bg-[#FAFAFA] pl-10 pr-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
            />
          </div>
        </div>

        <div
          className="max-h-[360px] overflow-y-auto p-2"
          onScroll={onOptionsScroll}
        >
          {options.map((option) => {
            const selected = value.includes(option.id);
            const imageUrl = getImageUrl?.(option);

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onToggle(option)}
                className={`mb-2 flex w-full items-center gap-3 rounded-[12px] border p-3 text-left transition ${
                  selected
                    ? "border-primary/30 bg-primary/5"
                    : "border-gray-100 hover:bg-gray-50"
                }`}
              >
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt={option.name}
                    className="h-12 w-12 shrink-0 rounded-[10px] object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-gray-100 text-xs font-semibold text-gray-400">
                    {imageFallback}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {option.name}
                  </p>
                  {renderMeta ? renderMeta(option) : null}
                </div>

                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                    selected
                      ? "border-primary bg-primary text-white"
                      : "border-gray-200 text-transparent"
                  }`}
                >
                  <Check size={14} />
                </span>
              </button>
            );
          })}

          {loading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : null}

          {!loading && options.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">
              {emptyTitle}
            </div>
          ) : null}

          {!loading &&
          options.length > 0 &&
          (loadMoreHint || showingCountLabel) ? (
            <div className="border-t border-gray-100 px-2 py-3 text-center text-xs text-gray-400">
              {hasNext ? loadMoreHint : showingCountLabel}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
          {selectedCountLabel}
        </span>
        {value.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onClear}
            className="h-8 rounded-full px-3 text-xs text-gray-500"
          >
            <X size={13} className="mr-1" />
            {clearLabel}
          </Button>
        ) : null}
      </div>

      {selectedOptions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedOptions.map((option) => (
            <span
              key={option.id}
              className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
            >
              {option.name}
            </span>
          ))}
        </div>
      ) : null}

      <p className={error ? "text-xs text-primary" : "text-xs text-gray-500"}>
        {error || helpText}
      </p>
    </div>
  );
}
