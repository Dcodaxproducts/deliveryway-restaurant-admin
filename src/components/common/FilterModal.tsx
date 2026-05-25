"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Radio } from "@/components/ui/radioBtn";
import FormInput from "../register/form/FormInput";

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
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [withDeleted, setWithDeleted] = useState(false);

  const [creationDate, setCreationDate] = useState("");
  const [modifiedDate, setModifiedDate] = useState("");

  /* ================= PREFILL FILTERS IF PROVIDED ================= */

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

  /* ================= RESET ================= */

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

  /* ================= APPLY ================= */

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

        {/* HEADER */}

        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Filter
          </DialogTitle>

          <p className="text-sm text-gray-500">
            Filter by Status and sorting
          </p>
        </DialogHeader>

        {/* BODY */}

        <div className="mt-4 rounded-[14px] bg-white p-4 space-y-6">

          {/* STATUS */}

          <div className="space-y-3">
            <p className="text-sm font-medium">Status</p>

            <div className="flex gap-6">
              <div onClick={() => setStatus("all")}>
                <Radio label="All" active={status === "all"} />
              </div>

              <div onClick={() => setStatus("active")}>
                <Radio label="Active" active={status === "active"} />
              </div>

              <div onClick={() => setStatus("inactive")}>
                <Radio label="Inactive" active={status === "inactive"} />
              </div>
            </div>
          </div>

          {/* CREATION DATE */}

         <FormInput
  label="Creation Date"
  type="date"
  value={creationDate}
  onChange={setCreationDate}
/>

          {/* MODIFIED DATE */}

       <FormInput
  label="Modified Date"
  type="date"
  value={modifiedDate}
  onChange={setModifiedDate}
/>

          {/* OPTIONS */}

          <div className="space-y-2">
            <p className="text-sm font-medium">Options</p>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={withDeleted}
                onCheckedChange={(v) => setWithDeleted(!!v)}
              />
              <span className="text-sm">Include Deleted</span>
            </div>
          </div>

          {/* SORT */}

          <div className="space-y-3">
            <p className="text-sm font-medium">Sort By</p>

            <div className="space-y-3">
              <div onClick={() => setSortBy("default")}>
                <Radio
                  label="Newest to Oldest"
                  active={sortBy === "default"}
                />
              </div>

              <div onClick={() => setSortBy("oldest")}>
                <Radio
                  label="Oldest to Newest"
                  active={sortBy === "oldest"}
                />
              </div>
            </div>
          </div>

        </div>

        {/* FOOTER */}

        <div className="mt-6 flex items-center justify-center gap-6">
          <button
            onClick={handleReset}
            className="text-sm font-medium text-gray-600 hover:text-black"
          >
            Reset
          </button>

          <Button
            onClick={handleApply}
            className="px-8 py-2 rounded-[10px] bg-primary hover:bg-primary/90"
          >
            Apply
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}