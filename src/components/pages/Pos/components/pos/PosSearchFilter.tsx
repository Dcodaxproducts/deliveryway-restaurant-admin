"use client";

import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import BorderedSearchBar from "@/components/common/BorderedSearchBar";
import FilterModal from "@/components/common/FilterModal";
import { FilterBar } from "@/components/common/FilterBar";
import { useTranslations } from "next-intl";

type PosSearchFilterProps = {
  query: string;
  onQueryChange: (query: string) => void;
};

export default function PosSearchFilter({
  query,
  onQueryChange,
}: PosSearchFilterProps) {
  const t = useTranslations("pos");
  const commonT = useTranslations("common");
  const [open, setOpen] = useState(false);

  return (
    <>
      <FilterBar
        search={
          <BorderedSearchBar
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full"
          />
        }
        actions={
          <Button
            onClick={() => setOpen(true)}
            variant="outline"
            className="w-full px-4 text-[var(--ui-text-muted)] sm:w-auto"
          >
            <SlidersHorizontal size={18} />
            {commonT("filter")}
          </Button>
        }
      />
      <FilterModal open={open} onOpenChange={setOpen} />
    </>
  );
}
