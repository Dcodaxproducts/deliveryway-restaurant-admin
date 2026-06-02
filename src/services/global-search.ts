import { buildSearchHref, GLOBAL_SEARCH_MODULES } from "@/components/layout/navbar/global-search-config";
import { getAdminDeals } from "@/services/admin-deals";
import { getBranches } from "@/services/branches";
import { getCustomersList } from "@/services/customers";
import { getDeliverymenList } from "@/services/deliverymen";
import { getStaffList } from "@/services/employees";
import { getFaqList } from "@/services/faqs";
import { getMenuItems } from "@/services/menus";
import { getOrders } from "@/services/orders";
import { getAdminPromotionCampaigns } from "@/services/promotions";
import { getRestaurants } from "@/services/restaurants";
import { getTableReservations } from "@/services/table-reservations";
import type {
  GlobalSearchEntity,
  GlobalSearchGroup,
  GlobalSearchParams,
  GlobalSearchResponse,
  GlobalSearchResult,
} from "@/types/global-search";

type SearchRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is SearchRecord => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const getString = (source: SearchRecord | undefined, key: string) => {
  if (!source) return undefined;
  const value = source[key];
  return typeof value === "string" && value.trim() ? value : undefined;
};

const getNumber = (source: SearchRecord | undefined, key: string) => {
  if (!source) return undefined;
  const value = source[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
};

const getRecord = (source: SearchRecord | undefined, key: string) => {
  const value = source?.[key];
  return isRecord(value) ? value : undefined;
};

const getArray = (payload: unknown) => {
  if (Array.isArray(payload)) return payload.filter(isRecord);
  if (!isRecord(payload)) return [];

  const candidates = [
    payload.data,
    payload.items,
    payload.results,
    payload.restaurants,
    payload.faqs,
    payload.customers,
    payload.branches,
    payload.deliverymen,
    payload.staff,
    payload.employees,
    payload.promotions,
  ];

  const match = candidates.find(Array.isArray);
  return Array.isArray(match) ? match.filter(isRecord) : [];
};

const getTotal = (payload: unknown, fallback: number) => {
  if (!isRecord(payload)) return fallback;
  const meta = getRecord(payload, "meta");
  return getNumber(meta, "total") ?? getNumber(payload, "total") ?? fallback;
};

const getConfig = (entity: GlobalSearchEntity) => {
  const config = GLOBAL_SEARCH_MODULES.find((module) => module.entity === entity);

  if (!config) {
    throw new Error(`Missing global search module config for ${entity}`);
  }

  return config;
};

const createGroup = (
  entity: GlobalSearchEntity,
  query: string,
  results: GlobalSearchResult[],
  total?: number
): GlobalSearchGroup => {
  const config = getConfig(entity);

  return {
    entity,
    label: config.label,
    href: buildSearchHref(config.listPath, query),
    results,
    total,
  };
};

const emptyGroup = (entity: GlobalSearchEntity, query: string) => {
  return createGroup(entity, query, [], 0);
};

const shortId = (id: string) => id.slice(0, 8);

const joinText = (...values: Array<string | number | undefined | null>) => {
  return values
    .filter((value): value is string | number => value !== undefined && value !== null && value !== "")
    .map(String)
    .join(" • ");
};

const fullName = (record: SearchRecord | undefined) => {
  const firstName = getString(record, "firstName");
  const lastName = getString(record, "lastName");
  const name = joinText(firstName, lastName).replace(" • ", " ");
  return name || getString(record, "fullName") || getString(record, "name");
};

const mapOrders = async (params: GlobalSearchParams) => {
  if (!params.restaurantId) return emptyGroup("orders", params.query);

  const response = await getOrders({
    restaurantId: params.restaurantId,
    branchId: params.branchId,
    page: 1,
    limit: params.limit,
    search: params.query,
  });

  const results = response.data.map((order): GlobalSearchResult => {
    const customer = order.customer;
    const title = order.orderNumber ? `Order #${order.orderNumber}` : `Order ${shortId(order.id)}`;

    return {
      id: order.id,
      entity: "orders",
      title,
      subtitle: customer?.fullName || customer?.name,
      status: order.status,
      href: `/orders/details/${order.id}`,
      meta: {
        orderType: order.orderType,
        totalAmount: order.totalAmount,
      },
    };
  });

  return createGroup("orders", params.query, results, response.meta?.total ?? results.length);
};

const mapMenuItems = async (params: GlobalSearchParams) => {
  const response = await getMenuItems({
    restaurantId: params.restaurantId,
    branchId: params.branchId,
    page: 1,
    limit: params.limit,
    search: params.query,
  });
  const records = getArray(response);

  const results = records.map((item): GlobalSearchResult => {
    const id = getString(item, "id") || getString(item, "_id") || "";
    const category = getRecord(item, "category");
    const price = getString(item, "basePrice") ?? getString(item, "price") ?? getNumber(item, "basePrice") ?? getNumber(item, "price");

    return {
      id,
      entity: "menuItems",
      title: getString(item, "name") || "Untitled menu item",
      subtitle: getString(category, "name") || (price ? String(price) : undefined),
      description: getString(item, "description"),
      href: buildSearchHref("/menu/items", params.query),
      avatarUrl: getString(item, "imageUrl") ?? getString(item, "image"),
    };
  });

  return createGroup("menuItems", params.query, results, getTotal(response, results.length));
};

const mapCustomers = async (params: GlobalSearchParams) => {
  const response = await getCustomersList({
    restaurantId: params.restaurantId,
    branchId: params.branchId,
    page: 1,
    limit: params.limit,
    search: params.query,
  });
  const records = getArray(response);

  const results = records.map((customer): GlobalSearchResult => {
    const profile = getRecord(customer, "profile");
    const id = getString(customer, "id") || getString(customer, "_id") || "";

    return {
      id,
      entity: "customers",
      title: fullName(profile) || getString(customer, "name") || getString(customer, "email") || "Customer",
      subtitle: joinText(getString(customer, "email"), getString(profile, "phone")),
      href: buildSearchHref("/customer-settings", params.query),
      avatarUrl: getString(profile, "avatarUrl") ?? null,
    };
  });

  return createGroup("customers", params.query, results, getTotal(response, results.length));
};

const mapBranches = async (params: GlobalSearchParams) => {
  const response = await getBranches({
    restaurantId: params.restaurantId,
    page: 1,
    limit: params.limit,
    search: params.query,
  });
  const records = getArray(response);

  const results = records.map((branch): GlobalSearchResult => {
    const id = getString(branch, "id") || getString(branch, "_id") || "";

    return {
      id,
      entity: "branches",
      title: getString(branch, "name") || "Branch",
      subtitle: joinText(getString(branch, "address"), getString(branch, "city")),
      status: getString(branch, "status"),
      href: buildSearchHref("/branches", params.query),
      avatarUrl: getString(branch, "logoUrl") ?? null,
    };
  });

  return createGroup("branches", params.query, results, getTotal(response, results.length));
};

const mapDeliverymen = async (params: GlobalSearchParams) => {
  const response = await getDeliverymenList({
    restaurantId: params.restaurantId,
    branchId: params.branchId,
    page: 1,
    limit: params.limit,
    search: params.query,
  });
  const records = getArray(response);

  const results = records.map((deliveryman): GlobalSearchResult => {
    const profile = getRecord(deliveryman, "profile");
    const id = getString(deliveryman, "id") || getString(deliveryman, "_id") || "";

    return {
      id,
      entity: "deliverymen",
      title: fullName(profile) || fullName(deliveryman) || getString(deliveryman, "email") || "Deliveryman",
      subtitle: joinText(getString(deliveryman, "email"), getString(profile, "phone") ?? getString(deliveryman, "phone")),
      status: getString(deliveryman, "status"),
      href: buildSearchHref("/deliveryman", params.query),
      avatarUrl: getString(profile, "avatarUrl") ?? null,
    };
  });

  return createGroup("deliverymen", params.query, results, getTotal(response, results.length));
};

const mapEmployees = async (params: GlobalSearchParams) => {
  const response = await getStaffList({
    restaurantId: params.restaurantId,
    branchId: params.branchId,
    page: 1,
    search: params.query,
  });
  const records = getArray(response).slice(0, params.limit);

  const results = records.map((employee): GlobalSearchResult => {
    const profile = getRecord(employee, "profile");
    const role = getRecord(employee, "staffRole") ?? getRecord(employee, "role");
    const id = getString(employee, "id") || getString(employee, "_id") || "";

    return {
      id,
      entity: "employees",
      title: fullName(profile) || fullName(employee) || getString(employee, "email") || "Employee",
      subtitle: joinText(getString(role, "name"), getString(employee, "email")),
      status: getString(employee, "status"),
      href: buildSearchHref("/employees-settings", params.query),
      avatarUrl: getString(profile, "avatarUrl") ?? null,
    };
  });

  return createGroup("employees", params.query, results, getTotal(response, results.length));
};

const mapPromotions = async (params: GlobalSearchParams) => {
  const response = await getAdminPromotionCampaigns({
    restaurantId: params.restaurantId,
    branchId: params.branchId,
    page: 1,
    limit: params.limit,
    search: params.query,
  });
  const records = getArray(response);

  const results = records.map((promotion): GlobalSearchResult => {
    const id = getString(promotion, "id") || getString(promotion, "_id") || "";

    return {
      id,
      entity: "promotions",
      title: getString(promotion, "title") || getString(promotion, "code") || "Promotion",
      subtitle: joinText(getString(promotion, "discountType"), getString(promotion, "applyMode")),
      status: getString(promotion, "status") || getString(promotion, "lifecycle"),
      href: buildSearchHref("/promotion-management", params.query),
    };
  });

  return createGroup("promotions", params.query, results, getTotal(response, results.length));
};

const mapDeals = async (params: GlobalSearchParams) => {
  const response = await getAdminDeals({
    restaurantId: params.restaurantId,
    branchId: params.branchId,
    page: 1,
    limit: params.limit,
    search: params.query,
  });

  const results = response.deals.map((deal): GlobalSearchResult => ({
    id: deal.id,
    entity: "deals",
    title: deal.title,
    subtitle: joinText(deal.discountValue, `${deal.scopeMenuItemIds.length} items`),
    status: deal.lifecycle,
    href: buildSearchHref("/menu/deals", params.query),
    meta: {
      kind: deal.kind,
      discountType: deal.discountType,
    },
  }));

  return createGroup("deals", params.query, results, response.meta.total);
};

const mapTableReservations = async (params: GlobalSearchParams) => {
  const response = await getTableReservations({
    restaurantId: params.restaurantId,
    branchId: params.branchId,
    page: 1,
    limit: params.limit,
    search: params.query,
  });

  const results = response.reservations.map((reservation): GlobalSearchResult => {
    const customerName = reservation.customer
      ? joinText(reservation.customer.firstName, reservation.customer.lastName).replace(" • ", " ")
      : undefined;

    return {
      id: reservation.id,
      entity: "tableReservations",
      title: customerName || `Reservation ${shortId(reservation.id)}`,
      subtitle: joinText(reservation.reservationDate, `${reservation.guestCount} guests`),
      status: reservation.status,
      href: buildSearchHref("/table-reservations", params.query),
      meta: {
        branchId: reservation.branchId,
      },
    };
  });

  return createGroup("tableReservations", params.query, results, response.meta.total);
};

const mapRestaurants = async (params: GlobalSearchParams) => {
  const response = await getRestaurants({
    page: 1,
    limit: params.limit,
    search: params.query,
  });
  const records = getArray(response);

  const results = records.map((restaurant): GlobalSearchResult => {
    const id = getString(restaurant, "id") || getString(restaurant, "_id") || "";

    return {
      id,
      entity: "restaurants",
      title: getString(restaurant, "name") || "Restaurant",
      subtitle: joinText(getString(restaurant, "slug"), getString(restaurant, "domain")),
      href: buildSearchHref("/restaurants", params.query),
      avatarUrl: getString(restaurant, "logoUrl") ?? null,
    };
  });

  return createGroup("restaurants", params.query, results, getTotal(response, results.length));
};

const mapFaqs = async (params: GlobalSearchParams) => {
  if (!params.restaurantId) return emptyGroup("faqs", params.query);

  const response = await getFaqList(params.restaurantId, {
    page: 1,
    search: params.query,
  });
  const records = getArray(response).slice(0, params.limit);

  const results = records.map((faq): GlobalSearchResult => {
    const id = getString(faq, "id") || getString(faq, "_id") || "";

    return {
      id,
      entity: "faqs",
      title: getString(faq, "question") || "FAQ",
      subtitle: joinText(getString(faq, "category"), getString(faq, "status")),
      status: getString(faq, "status"),
      href: buildSearchHref("/faqs", params.query),
    };
  });

  return createGroup("faqs", params.query, results, getTotal(response, results.length));
};

const searchTasks = [
  mapOrders,
  mapMenuItems,
  mapCustomers,
  mapBranches,
  mapDeliverymen,
  mapEmployees,
  mapPromotions,
  mapDeals,
  mapTableReservations,
  mapRestaurants,
  mapFaqs,
];

export const globalSearch = async (
  params: GlobalSearchParams
): Promise<GlobalSearchResponse> => {
  const normalizedParams = {
    ...params,
    query: params.query.trim(),
    limit: params.limit ?? 5,
  };

  const settledGroups = await Promise.allSettled(
    searchTasks.map((searchTask) => searchTask(normalizedParams))
  );

  const groups = settledGroups.map((settledGroup, index) => {
    if (settledGroup.status === "fulfilled") {
      return settledGroup.value;
    }

    return emptyGroup(GLOBAL_SEARCH_MODULES[index].entity, normalizedParams.query);
  });

  return {
    groups,
    total: groups.reduce((count, group) => count + group.results.length, 0),
  };
};
