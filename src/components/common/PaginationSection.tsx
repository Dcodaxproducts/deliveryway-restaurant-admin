"use client";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type PaginationMeta = {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
};

type PaginationSectionProps = {
  meta?: PaginationMeta | null;
  onPageChange?: (page: number) => void;
};

const PaginationSection = ({
  meta,
  onPageChange = () => undefined,
}: PaginationSectionProps) => {
  if (!meta) return null;

  const { page, totalPages, total, limit } = meta;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
      <div>
        <p className="text-sm">
          Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of{" "}
          {total} data
        </p>
      </div>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious onClick={() => page > 1 && onPageChange(page - 1)} />
          </PaginationItem>

          <div className="flex rounded-full border border-[#E3E4EB] px-2">
            {pages.map((p) => (
              <PaginationItem key={p}>
                <PaginationLink isActive={p === page} onClick={() => onPageChange(p)}>
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}
          </div>

          <PaginationItem>
            <PaginationNext
              onClick={() => page < totalPages && onPageChange(page + 1)}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default PaginationSection;
