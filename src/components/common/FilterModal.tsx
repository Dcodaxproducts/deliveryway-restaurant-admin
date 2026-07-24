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

type FilterModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters?: any;
  onApply?: (filters: any) => void;
};

export default function FilterModal({
  open,
  onOpenChange,
  filters,
  onApply,
}: FilterModalProps) {
  const t = useTranslations("common");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [withDeleted, setWithDeleted] = useState(false);

  const [creationDate, setCreationDate] = useState("");
  const [modifiedDate, setModifiedDate] = useState("");
  const todayDate = useMemo(() => getLocalTodayInputValue(), []);

  useEffect(() => {
    if (!filters) return;

    if (filters.includeInactive === false) setStatus("active");
    else setStatus("all");

    if (filters.sortOrder === "DESC") setSortBy("default");
    else if (filters.sortOrder === "ASC") setSortBy("oldest");

    if (filters.withDeleted !== undefined) {
      setWithDeleted(filters.withDeleted);
    }
  }, [filters]);

  const handleReset = () => {
    setStatus("all");
    setSortBy("default");
    setWithDeleted(false);
    setCreationDate("");
    setModifiedDate("");

    if (onApply) {
      onApply({
        includeInactive: false,
        withDeleted: false,
        sortOrder: "ASC",
      });
    }

    onOpenChange(false);
  };

  const handleApply = () => {
    let includeInactive = false;

    if (status === "all" || status === "inactive") {
      includeInactive = true;
    }

    let sortOrder = "ASC";

    if (sortBy === "default") sortOrder = "DESC";
    if (sortBy === "oldest") sortOrder = "ASC";

    const payload = {
      includeInactive,
      withDeleted,
      sortOrder,
      creationDate,
      modifiedDate,
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

            <div className="flex gap-6">
              <div onClick={() => setStatus("all")}>
                <Radio label={t("all")} active={status === "all"} />
              </div>

              <div onClick={() => setStatus("active")}>
                <Radio label={t("active")} active={status === "active"} />
              </div>

              <div onClick={() => setStatus("inactive")}>
                <Radio label={t("inactive")} active={status === "inactive"} />
              </div>
            </div>
          </div>

          {/* CREATION DATE */}

          <FormInput
            label={t("creationDate")}
            type="date"
            min={todayDate}
            value={creationDate}
            onChange={setCreationDate}
          />

          {/* MODIFIED DATE */}

          <FormInput
            label={t("modifiedDate")}
            type="date"
            min={todayDate}
            value={modifiedDate}
            onChange={setModifiedDate}
          />

          {/* OPTIONS */}

          <div className="space-y-2">
            <p className="text-sm font-medium">{t("options")}</p>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={withDeleted}
                onCheckedChange={(v) => setWithDeleted(!!v)}
              />
              <span className="text-sm">{t("includeDeleted")}</span>
            </div>
          </div>

          {/* SORT */}

          <div className="space-y-3">
            <p className="text-sm font-medium">{t("sortBy")}</p>

            <div className="space-y-3">
              <div onClick={() => setSortBy("default")}>
                <Radio
                  label={t("newestToOldest")}
                  active={sortBy === "default"}
                />
              </div>

              <div onClick={() => setSortBy("oldest")}>
                <Radio
                  label={t("oldestToNewest")}
                  active={sortBy === "oldest"}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-6">
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
