import { getRecordValue, getStringValue, isRecord } from "@/lib/auth";
import { getCustomersList } from "@/services/customers";

/**
 * Customer option for the walk-in dialog. `POST …/table-reservations/walk-ins` requires
 * an existing `customerId`, so staff pick the guest from the admin customer list
 * (`GET /admin/users/customers`, admin roles only).
 */
export type WalkInCustomerOption = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
};

export const WALK_IN_CUSTOMER_SEARCH_LIMIT = 20;

export const normalizeWalkInCustomer = (value: unknown): WalkInCustomerOption | null => {
  if (!isRecord(value)) return null;
  const id = getStringValue(value, "id");
  if (!id) return null;

  const profile = getRecordValue(value, "profile");
  const firstName = (getStringValue(value, "firstName") ?? getStringValue(profile, "firstName") ?? "").trim();
  const lastName = (getStringValue(value, "lastName") ?? getStringValue(profile, "lastName") ?? "").trim();
  const email = (getStringValue(value, "email") ?? "").trim();
  const phone = (getStringValue(value, "phone") ?? getStringValue(profile, "phone") ?? "").trim();

  return {
    id,
    name: [firstName, lastName].filter(Boolean).join(" ") || email || id,
    email,
    phone: phone || null,
  };
};

export const normalizeWalkInCustomers = (response: unknown): WalkInCustomerOption[] => {
  const root = isRecord(response) ? response : {};
  const data = root.data;
  const rows = Array.isArray(data)
    ? data
    : isRecord(data) && Array.isArray(data.data)
      ? data.data
      : Array.isArray(response)
        ? response
        : [];

  return rows
    .map(normalizeWalkInCustomer)
    .filter((customer): customer is WalkInCustomerOption => customer !== null);
};

export async function searchWalkInCustomers(params: {
  restaurantId?: string;
  search?: string;
}): Promise<WalkInCustomerOption[]> {
  const search = params.search?.trim();
  const response: unknown = await getCustomersList({
    page: 1,
    limit: WALK_IN_CUSTOMER_SEARCH_LIMIT,
    includeInactive: false,
    ...(params.restaurantId ? { restaurantId: params.restaurantId } : {}),
    ...(search ? { search } : {}),
  });

  return normalizeWalkInCustomers(response);
}
