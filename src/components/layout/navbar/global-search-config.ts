import type { GlobalSearchEntity } from "@/types/global-search";

export type GlobalSearchModuleConfig = {
  entity: GlobalSearchEntity;
  label: string;
  listPath: string;
};

export const GLOBAL_SEARCH_MODULES: GlobalSearchModuleConfig[] = [
  { entity: "orders", label: "Orders", listPath: "/orders" },
  { entity: "menuItems", label: "Menu Items", listPath: "/menu/items" },
  { entity: "customers", label: "Customers", listPath: "/customer-settings" },
  { entity: "branches", label: "Branches", listPath: "/branches" },
  { entity: "deliverymen", label: "Deliverymen", listPath: "/deliveryman" },
  { entity: "employees", label: "Employees", listPath: "/employees-settings" },
  { entity: "promotions", label: "Promotions", listPath: "/promotion-management" },
  { entity: "deals", label: "Deals", listPath: "/menu/deals" },
  { entity: "tableReservations", label: "Table Reservations", listPath: "/table-reservations" },
  { entity: "restaurants", label: "Restaurants", listPath: "/restaurants" },
  { entity: "faqs", label: "FAQs", listPath: "/faqs" },
];

export const getGlobalSearchModule = (entity: GlobalSearchEntity) => {
  return GLOBAL_SEARCH_MODULES.find((module) => module.entity === entity);
};

export const buildSearchHref = (path: string, query: string) => {
  const searchParams = new URLSearchParams({ search: query });
  return `${path}?${searchParams.toString()}`;
};

export const buildUnifiedSearchHref = (query: string) => {
  const searchParams = new URLSearchParams({ query });
  return `/search?${searchParams.toString()}`;
};
