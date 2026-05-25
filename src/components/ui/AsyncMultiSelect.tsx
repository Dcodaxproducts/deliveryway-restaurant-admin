"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, Search, X } from "lucide-react";

interface Props {
  value: any[];
  onChange: (val: any[]) => void;
  placeholder?: string;
  fetchOptions: (params: {
    search: string;
    page: number;
  }) => Promise<{ data: any[]; meta?: any }>;
  labelKey?: string;
  valueKey?: string;
  maxSelectedLabelCount?: number;
  closeOnSelect?: boolean;
}

export default function AsyncMultiSelect({
  value = [],
  onChange,
  placeholder = "Select",
  fetchOptions,
  labelKey = "name",
  valueKey = "id",
  maxSelectedLabelCount = 2,
  closeOnSelect = false,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const selectedValues = Array.isArray(value) ? value : [];

  const normalize = (res: any) => {
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    return [];
  };

  const mergeUniqueOptions = (prev: any[], next: any[]) => {
    const map = new Map<string, any>();

    [...prev, ...next].forEach((item) => {
      const key = String(item?.[valueKey] ?? "");
      if (!key) return;
      map.set(key, item);
    });

    return Array.from(map.values());
  };

  const loadOptions = async (reset = false, nextSearch?: string) => {
    try {
      setLoading(true);

      const res = await fetchOptions({
        search: nextSearch ?? search,
        page: reset ? 1 : page,
      });

      const data = normalize(res);

      setOptions((prev) => {
        if (reset) return mergeUniqueOptions(selectedValues, data);
        return mergeUniqueOptions(prev, data);
      });

      setHasMore(data.length > 0);

      if (reset) setPage(1);
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    loadOptions(true);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const t = setTimeout(() => {
      loadOptions(true, search);
    }, 300);

    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (open && page > 1) loadOptions(false);
  }, [page]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleScroll = (e: any) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop <= el.clientHeight + 20) {
      if (hasMore && !loading) setPage((p) => p + 1);
    }
  };

  const isSelected = (opt: any) =>
    selectedValues.some(
      (item) => String(item?.[valueKey]) === String(opt?.[valueKey])
    );

  const handleToggle = (opt: any) => {
    const selected = isSelected(opt);

    if (selected) {
      onChange(
        selectedValues.filter(
          (item) => String(item?.[valueKey]) !== String(opt?.[valueKey])
        )
      );
    } else {
      onChange([...selectedValues, opt]);
    }

    if (closeOnSelect) {
      setOpen(false);
    }
  };

  const handleRemove = (opt: any, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(
      selectedValues.filter(
        (item) => String(item?.[valueKey]) !== String(opt?.[valueKey])
      )
    );
  };

  const triggerLabel = useMemo(() => {
    if (!selectedValues.length) return placeholder;

    const labels = selectedValues.map((item) => item?.[labelKey]).filter(Boolean);

    if (labels.length <= maxSelectedLabelCount) {
      return labels.join(", ");
    }

    const shown = labels.slice(0, maxSelectedLabelCount).join(", ");
    return `${shown} +${labels.length - maxSelectedLabelCount} more`;
  }, [selectedValues, labelKey, placeholder, maxSelectedLabelCount]);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex min-h-[44px] w-full items-center justify-between rounded-lg border border-[#BBBBBB] bg-white px-3 py-2 text-sm"
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {selectedValues.length > 0 ? (
            selectedValues.slice(0, maxSelectedLabelCount).map((item) => (
              <span
                key={String(item?.[valueKey])}
                className="flex max-w-full items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs text-primary"
              >
                <span className="truncate">{item?.[labelKey]}</span>
                <span
                  onClick={(e) => handleRemove(item, e)}
                  className="cursor-pointer"
                >
                  <X size={12} />
                </span>
              </span>
            ))
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}

          {selectedValues.length > maxSelectedLabelCount && (
            <span className="text-xs text-gray-500">
              +{selectedValues.length - maxSelectedLabelCount} more
            </span>
          )}

          {selectedValues.length === 0 && (
            <span className="hidden">{triggerLabel}</span>
          )}
        </div>

        <ChevronDown size={16} className="shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border bg-white shadow-lg">
          <div className="border-b p-2">
            <div className="flex h-[36px] items-center gap-2 rounded border px-2">
              <Search size={14} />
              <input
                className="w-full text-sm outline-none"
                placeholder="Search..."
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
              />
            </div>
          </div>

          <div className="max-h-[240px] overflow-y-auto" onScroll={handleScroll}>
            {options.map((opt) => {
              const selected = isSelected(opt);

              return (
                <div
                  key={String(opt?.[valueKey])}
                  onClick={() => handleToggle(opt)}
                  className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm ${
                    selected
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selected}
                      readOnly
                      className="accent-[var(--primary)]"
                    />
                    <span>{opt?.[labelKey]}</span>
                  </div>

                  {selected && <Check size={14} />}
                </div>
              );
            })}

            {loading && (
              <div className="p-3 text-center">
                <Loader2 className="mx-auto animate-spin" />
              </div>
            )}

            {!loading && options.length === 0 && (
              <div className="p-3 text-center text-sm text-gray-400">
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}