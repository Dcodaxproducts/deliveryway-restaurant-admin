"use client";

import { useEffect, useMemo, useState } from "react";
import Container from "@/components/container";
import Header from "@/components/menu/header";
import Table from "@/components/menu/list";
import BranchFilters from "@/components/branches/BranchFilters";
import PaginationSection from "@/components/common/pagination";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useGetRestaurantMenus } from "@/hooks/useMenus";

interface Menu {
  id: string;
  name: string;
  isDefault?: boolean;
  _count?: {
    items: number;
  };
}

const PAGE_LIMIT = 10;

const extractMenuItems = (response: any): Menu[] => {
  if (!response) return [];

  const candidates = [
    response?.data?.items,
    response?.data?.menus,
    response?.data?.data?.items,
    response?.data?.data?.menus,
    response?.data?.data,
    response?.items,
    response?.menus,
    response?.data,
    response,
  ];

  const list = candidates.find((candidate) => Array.isArray(candidate));

  return Array.isArray(list) ? list : [];
};

const extractMeta = (response: any) => {
  return (
    response?.data?.pagination ||
    response?.data?.meta ||
    response?.data?.data?.pagination ||
    response?.data?.data?.meta ||
    response?.pagination ||
    response?.meta ||
    {}
  );
};

export default function MenusPage() {
  const { user, restaurantId: authRestaurantId, branchId, isBranchAdmin, loading: authLoading } =
    useAuth();

  const restaurantId =
    authRestaurantId || user?.restaurantId || (user as any)?.tenantId || "";

  const [filters, setFilters] = useState({ search: "" });
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(PAGE_LIMIT);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
      setPage(1);
    }, 450);

    return () => window.clearTimeout(timer);
  }, [filters.search]);

  const queryParams = useMemo(
    () => ({
      page,
      limit,
      restaurantId: restaurantId || undefined,
      search: debouncedSearch || undefined,
    }),
    [page, limit, restaurantId, debouncedSearch]
  );

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    error,
  } = useGetRestaurantMenus(queryParams);

  const menus = useMemo(() => extractMenuItems(response), [response]);
  const meta = useMemo(() => extractMeta(response), [response]);

  const pagination = useMemo(() => {
    const total = Number(meta?.total ?? menus.length ?? 0);
    const currentPage = Number(meta?.page ?? page);
    const pageSize = Number(meta?.limit ?? limit);
    const totalPages = Number(
      meta?.totalPages ??
        meta?.pages ??
        (total > 0 && pageSize > 0 ? Math.ceil(total / pageSize) : 1)
    );

    return {
      page: currentPage || 1,
      totalPages: totalPages || 1,
      total,
      limit: pageSize || limit,
      hasNext:
        typeof meta?.hasNext === "boolean"
          ? meta.hasNext
          : typeof meta?.hasNextPage === "boolean"
          ? meta.hasNextPage
          : currentPage < (totalPages || 1),
      hasPrevious:
        typeof meta?.hasPrevious === "boolean"
          ? meta.hasPrevious
          : typeof meta?.hasPrev === "boolean"
          ? meta.hasPrev
          : typeof meta?.hasPrevPage === "boolean"
          ? meta.hasPrevPage
          : currentPage > 1,
    };
  }, [meta, menus.length, page, limit]);

  useEffect(() => {
    if (!isError) return;

    const message =
      (error as any)?.response?.data?.message ||
      (error as any)?.message ||
      "Failed to load menus";

    toast.error(message);
  }, [isError, error]);

  const handleFilterChange = (newFilters: any) => {
    setFilters({
      search: String(newFilters?.search || ""),
    });
  };

  const loading = authLoading || isLoading || isFetching;

  return (
    <Container>
      <Header
        title={isBranchAdmin ? "Branch Menu Catalog" : "Menu List"}
        description={
          isBranchAdmin
            ? "View menus and manage branch-specific category/item overrides."
            : "View and manage all menus from here"
        }
      />

      <div className="space-y-[32px] rounded-[14px] bg-white shadow-sm lg:p-[30px]">
        {!isBranchAdmin ? (
          <BranchFilters
            branches={menus}
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        ) : null}

        {!restaurantId && !authLoading ? (
          <div className="mx-2 rounded-[14px] border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700 lg:mx-0">
            Restaurant context is missing. Please select or assign a restaurant
            before loading menus.
          </div>
        ) : null}

        <div className="px-2 lg:px-0">
          <Table menus={menus} loading={loading} />

          <div className="mt-5">
            <PaginationSection {...pagination} onPageChange={setPage} />
          </div>
        </div>
      </div>
    </Container>
  );
}
