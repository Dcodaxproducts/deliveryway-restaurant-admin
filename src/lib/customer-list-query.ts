import { cleanParams } from "@/lib/params";
import type { CustomerListParams } from "@/validations/customers";

export const buildCustomerListParams = (params?: CustomerListParams) =>
  cleanParams(params);

export const customerListQueryKey = (params?: CustomerListParams) =>
  ["customers", buildCustomerListParams(params)] as const;

export const mergeCustomerListFilters = <T extends { page: number }>(
  current: T,
  updates: Partial<T>,
): T => ({
  ...current,
  ...updates,
  page:
    updates.page ??
    (Object.keys(updates).some((key) => key !== "page")
      ? 1
      : current.page),
});
