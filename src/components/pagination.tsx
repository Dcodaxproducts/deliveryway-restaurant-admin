
"use client";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Props {
  meta?: any;
  onPageChange?: (page: number) => void;
}

const PaginationSection = ({ meta, onPageChange = () => undefined }: Props) => {
  if (!meta) return null;

  const { page, totalPages, total, limit } = meta;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
      <div>
        <p className="text-sm">
          Showing {(page - 1) * limit + 1} to{" "}
          {Math.min(page * limit, total)} of {total} data
        </p>
      </div>

      <Pagination>
        <PaginationContent>
          {/* Previous */}
          <PaginationItem>
            <PaginationPrevious
              onClick={() => page > 1 && onPageChange(page - 1)}
            />
          </PaginationItem>

          {/* Pages */}
          <div className="border border-[#E3E4EB] flex rounded-full px-2">
            {pages.map((p) => (
              <PaginationItem key={p}>
                <PaginationLink
                  isActive={p === page}
                  onClick={() => onPageChange(p)}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}
          </div>

          {/* Next */}
          <PaginationItem>
            <PaginationNext
              onClick={() =>
                page < totalPages && onPageChange(page + 1)
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default PaginationSection;
