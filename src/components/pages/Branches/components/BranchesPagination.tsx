"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { shouldShowPageSizeSelector } from "@/components/common/PaginationSection";

const limitOptions = [10, 20, 50] as const;

interface Props {
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  onLimitChange?: (limit: number) => void;
}

export default function BranchesPagination({ meta, onLimitChange }: Props) {
  const commonT = useTranslations("common");
  const page = meta?.page || 1;
  const limit = meta?.limit || 10;
  const total = meta?.total || 0;

  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  if (total <= 0) return null;

  return (
    <div className="flex items-center justify-start gap-4 mt-6 text-sm text-gray-400">
      {/* Page Size */}
      {shouldShowPageSizeSelector(total, limitOptions) ? (
        <Select
          defaultValue={String(limit)}
          onValueChange={(val) => onLimitChange?.(Number(val))}
        >
          <SelectTrigger className="h-[36px] w-[72px] rounded-[10px] border-[#E5E7EB]">
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            {limitOptions.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      {/* Info */}
      <span>
        {commonT("paginationSummary", { from: start, to: end, total })}
      </span>
    </div>
  );
}
