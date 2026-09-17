"use client";

import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import BorderedSearchBar from "@/components/common/BorderedSearchBar";
import FilterModal from "@/components/common/FilterModal";
import { FilterBar } from "@/components/common/FilterBar";
import { useTranslations } from "next-intl";

export default function PosSearchFilter() {
  const t = useTranslations("pos");
  const commonT = useTranslations("common");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  return (
    <>
      <FilterBar
        search={
          <BorderedSearchBar
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onSearch={() => undefined}
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
