import { FormSelect } from "@/components/ui/form-select";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { shouldShowPageSizeSelector } from "@/components/common/PaginationSection";
import type { GiftCardsMeta } from "@/types/gift-cards";

type GiftCardsPaginationProps = {
  meta: GiftCardsMeta;
  limit: number;
  onLimitChange: (limit: number) => void;
  onPageChange: (page: number) => void;
};

const limitOptions = [10, 20, 50];

export default function GiftCardsPagination({
  meta,
  limit,
  onLimitChange,
  onPageChange,
}: GiftCardsPaginationProps) {
  const t = useTranslations("promotions.giftCards.pagination");
  const commonT = useTranslations("common");
  const showPageSize = shouldShowPageSizeSelector(meta.total, limitOptions);

  if (meta.total <= 0) return null;

  return (
    <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        {showPageSize ? (
          <>
            <span>{commonT("rowsPerPage")}</span>
            <FormSelect
              value={limit}
              onChange={(event) => onLimitChange(Number(event.target.value))}
              className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-sm text-gray-700 outline-none focus:border-primary"
            >
              {limitOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </FormSelect>
          </>
        ) : null}
        <span>
          {t("pageOf", { page: meta.page, totalPages: meta.totalPages })}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {meta.hasPrevious ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => onPageChange(Math.max(1, meta.page - 1))}
            className="h-9 rounded-lg"
          >
            {commonT("previous")}
          </Button>
        ) : null}
        {meta.hasNext ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => onPageChange(meta.page + 1)}
            className="h-9 rounded-lg"
          >
            {commonT("next")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
