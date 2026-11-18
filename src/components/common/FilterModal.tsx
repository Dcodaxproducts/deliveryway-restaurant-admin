"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Radio } from "@/components/ui/radioBtn";
import FormInput from "@/components/forms/common/FormInput";
import { getLocalTodayInputValue } from "@/lib/date-input";
import { useTranslations } from "next-intl";

export type FilterValues = {
  includeInactive?: boolean;
  withDeleted?: boolean;
  sortOrder?: "ASC" | "DESC";
  isGuest?: boolean;
  isVerified?: boolean;
  isActive?: boolean;
  fromDate?: string;
  toDate?: string;
};

type FilterModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters?: FilterValues;
  onApply?: (filters: FilterValues) => void;
  showCustomerFilters?: boolean;
};

export const customerTypeToIsGuest = (customerType: string) =>
  customerType === "guest"
    ? true
    : customerType === "registered"
      ? false
      : undefined;

export const selectionToBoolean = (selection: string) =>
  selection === "yes" ? true : selection === "no" ? false : undefined;

export default function FilterModal({
  open,
  onOpenChange,
  filters,
  onApply,
  showCustomerFilters = false,
}: FilterModalProps) {
  const t = useTranslations("common");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [withDeleted, setWithDeleted] = useState(false);
  const [customerType, setCustomerType] = useState("all");
  const [verification, setVerification] = useState("all");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const todayDate = useMemo(() => getLocalTodayInputValue(), []);

  useEffect(() => {
    if (!filters) return;

    setStatus(filters.isActive === true ? "active" : filters.isActive === false ? "inactive" : "all");

    if (filters.sortOrder === "DESC") setSortBy("default");
    else if (filters.sortOrder === "ASC") setSortBy("oldest");

    if (filters.withDeleted !== undefined) {
      setWithDeleted(filters.withDeleted);
    }
    setCustomerType(
      filters.isGuest === true
        ? "guest"
        : filters.isGuest === false
          ? "registered"
          : "all",
    );
    setVerification(
      filters.isVerified === true ? "yes" : filters.isVerified === false ? "no" : "all",
    );
    setFromDate(filters.fromDate ?? "");
    setToDate(filters.toDate ?? "");
  }, [filters]);

  const handleReset = () => {
    setStatus("all");
    setSortBy("default");
    setWithDeleted(false);
    setCustomerType("all");
    setVerification("all");
    setFromDate("");
    setToDate("");

    if (onApply) {
      onApply({
        includeInactive: true,
        withDeleted: false,
        sortOrder: "DESC",
        isGuest: undefined,
        isVerified: undefined,
        isActive: undefined,
        fromDate: undefined,
        toDate: undefined,
      });
    }

    onOpenChange(false);
  };

  const handleApply = () => {
    let includeInactive = false;

    if (status === "all" || status === "inactive") {
      includeInactive = true;
    }

    let sortOrder: "ASC" | "DESC" = "ASC";

    if (sortBy === "default") sortOrder = "DESC";
    if (sortBy === "oldest") sortOrder = "ASC";

    const payload: FilterValues = {
      includeInactive,
      withDeleted,
      sortOrder,
      isActive: status === "active" ? true : status === "inactive" ? false : undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      isGuest: customerTypeToIsGuest(customerType),
      isVerified: selectionToBoolean(verification),
    };

    if (onApply) {
      onApply(payload);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] rounded-[20px] p-6 bg-[#F5F5F5] max-h-[95vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {t("filter")}
          </DialogTitle>

          <p className="text-sm text-gray-500">{t("filterDescription")}</p>
        </DialogHeader>

        {/* BODY */}

        <div className="mt-4 rounded-[14px] bg-white p-4 space-y-6">
          {/* STATUS */}

          <div className="space-y-3">
            <p className="text-sm font-medium">{t("status")}</p>

            <div
              className="flex flex-wrap gap-3"
              role="radiogroup"
              aria-label={t("status")}
            >
              {["all", "active", "inactive"].map((option) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={status === option}
                  onClick={() => setStatus(option)}
                  className="rounded-md px-1 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <Radio label={t(option)} active={status === option} />
                </button>
              ))}
            </div>
          </div>

          {showCustomerFilters ? (
            <div className="space-y-3">
              <p className="text-sm font-medium">{t("customerType")}</p>
              <div
                className="flex flex-wrap gap-3"
                role="radiogroup"
                aria-label={t("customerType")}
              >
                {["all", "registered", "guest"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={customerType === option}
                    onClick={() => setCustomerType(option)}
                    className="rounded-md px-1 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <Radio
                      label={t(option)}
                      active={customerType === option}
                    />
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {showCustomerFilters ? (
            <div className="space-y-3">
              <p className="text-sm font-medium">{t("verification")}</p>
              <div className="flex flex-wrap gap-3" role="radiogroup" aria-label={t("verification")}>
                {[{ value: "all", label: t("all") }, { value: "yes", label: t("verified") }, { value: "no", label: t("unverified") }].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={verification === option.value}
                    onClick={() => setVerification(option.value)}
                    className="rounded-md px-1 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <Radio label={option.label} active={verification === option.value} />
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* CREATION DATE */}

          {showCustomerFilters ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormInput label={t("fromDate")} type="date" max={toDate || todayDate} value={fromDate} onChange={setFromDate} />
              <FormInput label={t("toDate")} type="date" min={fromDate || undefined} max={todayDate} value={toDate} onChange={setToDate} />
            </div>
          ) : null}

          {/* MODIFIED DATE */}


          {/* OPTIONS */}

          <div className="space-y-2">
            <p className="text-sm font-medium">{t("options")}</p>

            <label className="flex items-center gap-2">
              <Checkbox
                checked={withDeleted}
                onCheckedChange={(v) => setWithDeleted(!!v)}
              />
              <span className="text-sm">{t("includeDeleted")}</span>
            </label>
          </div>

          {/* SORT */}

          <div className="space-y-3">
            <p className="text-sm font-medium">{t("sortBy")}</p>

            <div
              className="space-y-3"
              role="radiogroup"
              aria-label={t("sortBy")}
            >
              {[
                { value: "default", label: t("newestToOldest") },
                { value: "oldest", label: t("oldestToNewest") },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={sortBy === option.value}
                  onClick={() => setSortBy(option.value)}
                  className="block rounded-md px-1 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <Radio
                    label={option.label}
                    active={sortBy === option.value}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          <button
            onClick={handleReset}
            className="text-sm font-medium text-gray-600 hover:text-black"
          >
            {t("reset")}
          </button>

          <Button
            onClick={handleApply}
            className="px-8 py-2 rounded-[10px] bg-primary hover:bg-primary/90"
          >
            {t("apply")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
