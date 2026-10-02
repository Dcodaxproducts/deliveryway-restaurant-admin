"use client";

import { Loader2, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { useGetCustomersList } from "@/hooks/useCustomers";
import {
  getPosCustomerName,
  type PosCustomer,
} from "@/components/pages/Pos/components/pos/pos-checkout-payload";
import { getEligiblePosCustomers } from "@/components/pages/Pos/components/pos/pos-customer-selection";

type PosCustomerSelectorProps = {
  restaurantId: string;
  selectedCustomer: PosCustomer | null;
  onSelect: (customer: PosCustomer) => void;
  onClear: () => void;
};

export function PosCustomerSelector({
  restaurantId,
  selectedCustomer,
  onSelect,
  onClear,
}: PosCustomerSelectorProps) {
  const t = useTranslations("pos");
  const commonT = useTranslations("common");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const query = useGetCustomersList({
    page: 1,
    search: debouncedSearch || undefined,
    sortOrder: "ASC",
    includeInactive: false,
    isGuest: false,
    restaurantId,
  });
  const customers = useMemo(
    () => getEligiblePosCustomers(query.data, restaurantId),
    [query.data, restaurantId],
  );

  return (
    <div className="space-y-2">
      <label htmlFor="pos-customer-search" className="text-xs font-medium text-gray-600">
        {t("customerSelectorLabel")}
      </label>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400"
        />
        <input
          id="pos-customer-search"
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-controls="pos-customer-options"
          aria-expanded={open}
          value={search}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setSearch(event.target.value);
            setOpen(true);
          }}
          placeholder={t("customerSearchPlaceholder")}
          className="h-10 w-full rounded-md border bg-white pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {open ? (
        <div
          id="pos-customer-options"
          role="listbox"
          aria-label={t("customerSelectorLabel")}
          className="max-h-48 overflow-y-auto rounded-md border bg-white shadow-sm"
        >
          {query.isLoading || query.isFetching ? (
            <div className="flex items-center justify-center gap-2 p-3 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("customerSearchLoading")}
            </div>
          ) : query.isError ? (
            <div className="space-y-2 p-3 text-center text-sm text-red-600">
              <p>{t("customerSearchError")}</p>
              <Button type="button" variant="outline" size="sm" onClick={() => void query.refetch()}>
                {commonT("retry")}
              </Button>
            </div>
          ) : customers.length === 0 ? (
            <p className="p-3 text-center text-sm text-gray-500">
              {t("customerSearchEmpty")}
            </p>
          ) : (
            customers.map((customer) => (
              <button
                key={customer.id}
                type="button"
                role="option"
                aria-selected={selectedCustomer?.id === customer.id}
                onClick={() => {
                  onSelect(customer);
                  setSearch("");
                  setOpen(false);
                }}
                className="block w-full border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
              >
                <span className="block font-medium text-gray-900">
                  {getPosCustomerName(customer)}
                </span>
                <span className="block truncate text-xs text-gray-500">
                  {[customer.phone, customer.email].filter(Boolean).join(" · ") ||
                    t("customerContactMissing")}
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}

      {selectedCustomer ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-8 px-2 text-xs text-gray-600"
        >
          <X className="mr-1 h-3.5 w-3.5" />
          {t("customerClear")}
        </Button>
      ) : null}
    </div>
  );
}
