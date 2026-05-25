"use client";

import { useEffect, useRef, useState } from "react";
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
}

export default function AsyncSelect({
  value,
  onChange,
  placeholder = "Select",
  fetchOptions,
  labelKey = "name",
  valueKey = "id",
}: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);

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

  const loadOptions = async (reset = false, nextSearch?: string) => {
    try {
      setLoading(true);

      const res = await fetchOptions({
        search: nextSearch ?? search,
        page: reset ? 1 : page,
      });

      const data = normalize(res);

      setOptions((prev) => (reset ? data : [...prev, ...data]));
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

  return (
    <div ref={wrapperRef} className="relative w-full">
      {/* TRIGGER */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex h-[44px] w-full items-center justify-between rounded-lg border border-[#BBBBBB] bg-white px-3 text-sm"
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {value ? value[labelKey] : placeholder}
        </span>

        <ChevronDown size={16} />
      </button>

      {/* DROPDOWN */}
      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border bg-white shadow-lg">
          
          {/* SEARCH */}
          <div className="p-2 border-b">
            <div className="flex items-center gap-2 border rounded px-2 h-[36px]">
              <Search size={14} />
              <input
                className="w-full outline-none text-sm"
                placeholder="Search..."
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
                  {opt[labelKey]}
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
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}