"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const page = meta?.page || 1;
  const limit = meta?.limit || 10;
  const total = meta?.total || 0;

  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-start gap-4 mt-6 text-sm text-gray-400">
      
      {/* Page Size */}
      <Select
        defaultValue={String(limit)}
        onValueChange={(val) => onLimitChange?.(Number(val))}
      >
        <SelectTrigger className="h-[36px] w-[72px] rounded-[10px] border-[#E5E7EB]">
          <SelectValue />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="10">10</SelectItem>
          <SelectItem value="20">20</SelectItem>
          <SelectItem value="50">50</SelectItem>
        </SelectContent>
      </Select>

      {/* Info */}
      <span>
        Showing {start} To {end} Of {total}
      </span>
    </div>
  );
}