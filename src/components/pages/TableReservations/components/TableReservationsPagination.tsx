"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PaginationSection from "@/components/common/pagination";
import type { TableReservationsMeta } from "@/types/table-reservations";
import { useTranslations } from "next-intl";

type TableReservationsPaginationProps = {
  meta: TableReservationsMeta;
  limit: number;
  onLimitChange: (limit: number) => void;
  onPageChange: (page: number) => void;
};

const limitOptions = [10, 20, 50];

export default function TableReservationsPagination({
  meta,
  limit,
  onLimitChange,
  onPageChange,
}: TableReservationsPaginationProps) {
  const common = useTranslations("common");

  return (
    <div className="flex flex-col gap-4">
      <PaginationSection
        page={meta.page}
        totalPages={meta.totalPages}
        total={meta.total}
        limit={meta.limit}
        hasNext={meta.hasNext}
        hasPrevious={meta.hasPrevious}
        onPageChange={onPageChange}
      />

      <div className="flex items-center gap-2 self-start text-sm text-gray-500 sm:self-end">
        <span>{common("rowsPerPage")}</span>
        <Select value={String(limit)} onValueChange={(value) => onLimitChange(Number(value))}>
          <SelectTrigger className="h-10 w-[90px] rounded-[14px]">
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
      </div>
    </div>
  );
}
