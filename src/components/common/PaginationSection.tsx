"use client";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useTranslations } from "next-intl";
import {
  getPaginationModel,
  type PaginationMeta,
} from "@/components/common/pagination-model";

type PaginationSectionProps = {
  meta?: PaginationMeta | null;
  onPageChange?: (page: number) => void;
};


const PaginationSection = ({
  meta,
  onPageChange = () => undefined,
}: PaginationSectionProps) => {
  const t = useTranslations("common");

  if (!meta) return null;

  const { page, totalPages, total, from, to, pages } =
    getPaginationModel(meta);

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
      <div>
        <p className="text-sm">
          {t("paginationSummary", {
            from,
            to,
            total,
          })}
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
