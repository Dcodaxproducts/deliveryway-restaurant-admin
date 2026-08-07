"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Check, ChevronDown, Loader2, Search } from "lucide-react";

interface Props {
  value: any;
  onChange: (val: any) => void;
  placeholder?: string;
  fetchOptions: (params: {
    search: string;
    page: number;
  }) => Promise<{ data: any[]; meta?: any }>;
  labelKey?: string;
  valueKey?: string;
  searchPlaceholder?: string;
  noResultsText?: string;
  renderOption?: (option: any) => ReactNode;
  renderValue?: (option: any) => ReactNode;
}

export default function AsyncSelect({
  value,
  onChange,
  placeholder = "Select",
  fetchOptions,
  labelKey = "name",
  valueKey = "id",
  searchPlaceholder = "Search...",
  noResultsText = "No results found",
  renderOption,
  renderValue,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const requestSequenceRef = useRef(0);

  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  //  normalize API
  const normalize = (res: any) => {
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    return [];
  };

  const loadOptions = async (
    requestedPage: number,
    requestedSearch: string,
    reset: boolean,
  ) => {
    const requestSequence = ++requestSequenceRef.current;

    try {
      setLoading(true);

      const res = await fetchOptions({
        search: requestedSearch,
        page: requestedPage,
      });

      const data = normalize(res);

      if (requestSequence !== requestSequenceRef.current) return;

      setOptions((prev) => (reset ? data : [...prev, ...data]));
      setHasMore(data.length > 0);

      setPage(requestedPage);
    } catch {
      if (requestSequence !== requestSequenceRef.current) return;
      setHasMore(false);
    } finally {
      if (requestSequence === requestSequenceRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!open) {
      requestSequenceRef.current += 1;
      setPage(1);
      return;
    }

    const t = setTimeout(
      () => {
        void loadOptions(1, search, true);
      },
      search ? 300 : 0,
    );

    return () => clearTimeout(t);
  }, [open, search]);

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
      if (hasMore && !loading) {
        void loadOptions(page + 1, search, false);
      }
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      {/* TRIGGER */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex h-[44px] w-full items-center justify-between rounded-lg border border-[#BBBBBB] bg-white px-3 text-sm"
      >
        <div
          className={`min-w-0 flex-1 text-left ${value ? "text-gray-900" : "text-gray-400"}`}
        >
          {value ? (renderValue?.(value) ?? value[labelKey]) : placeholder}
        </div>

        <ChevronDown size={16} />
      </button>

      {/* DROPDOWN */}
      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border bg-white shadow-lg">
          <div className="p-2 border-b">
            <div className="flex items-center gap-2 border rounded px-2 h-[36px]">
              <Search size={14} />
              <input
                className="w-full outline-none text-sm"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
              />
            </div>
          </div>

          {/* OPTIONS */}
          <div
            className="max-h-[240px] overflow-y-auto"
            onScroll={handleScroll}
          >
            {options.map((opt) => {
              const selected = value?.[valueKey] === opt?.[valueKey];

              return (
                <div
                  key={opt[valueKey]}
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className={`px-3 py-2 cursor-pointer text-sm flex justify-between ${
                    selected
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    {renderOption?.(opt) ?? opt[labelKey]}
                  </div>
                  {selected && <Check size={14} />}
                </div>
              );
            })}

            {loading && (
              <div className="p-3 text-center">
                <Loader2 className="animate-spin mx-auto" />
              </div>
            )}

            {!loading && options.length === 0 && (
              <div className="p-3 text-center text-gray-400 text-sm">
                {noResultsText}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
