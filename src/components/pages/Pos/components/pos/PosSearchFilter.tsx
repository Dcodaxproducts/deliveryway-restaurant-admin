"use client";

import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import BorderedSearchBar from "@/components/common/BorderedSearchBar";
import FilterModal from "@/components/common/FilterModal";
import { useTranslations } from "next-intl";

export default function PosSearchFilter() {
  const t = useTranslations("pos");
  const commonT = useTranslations("common");
  const [query, setQuery] = useState("");
const [open, setOpen] = useState(false);
  return (
    <div className="w-full py-4 lg:py-[20px]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search Area */}
        <BorderedSearchBar
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onSearch={() => undefined}
          placeholder={t("searchPlaceholder")}
          className="flex-1"
        />

        {/* Filter Button */}
        <Button
        onClick={() => setOpen(true)}
          variant="outline"
          className="
            h-[44px]
            px-6
            rounded-[14px]
            flex items-center gap-2
            text-gray-600
            border-gray-200
            hover:bg-gray-50
          "
        >
          <SlidersHorizontal size={18} />
          {commonT("filter")}
        </Button>
      </div>
      <FilterModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
