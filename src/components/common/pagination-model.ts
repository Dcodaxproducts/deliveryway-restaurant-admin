export type PaginationMeta = {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
};

export const getPaginationModel = (meta: PaginationMeta) => {
  const total = Math.max(0, meta.total);
  const totalPages = Math.max(1, meta.totalPages);
  const page = Math.min(Math.max(1, meta.page), totalPages);
  const limit = Math.max(1, meta.limit);
  const firstPage = Math.max(1, Math.min(page - 3, totalPages - 6));
  const lastPage = Math.min(totalPages, firstPage + 6);

  return {
    page,
    total,
    totalPages,
    from: total === 0 ? 0 : (page - 1) * limit + 1,
    to: total === 0 ? 0 : Math.min(page * limit, total),
    pages: Array.from(
      { length: Math.max(0, lastPage - firstPage + 1) },
      (_, index) => firstPage + index,
    ),
  };
};
