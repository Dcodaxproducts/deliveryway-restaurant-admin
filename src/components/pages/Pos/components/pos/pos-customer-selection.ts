import {
  normalizePosCustomer,
  type PosCustomer,
} from "@/components/pages/Pos/components/pos/pos-checkout-payload";

type CustomerListEnvelope = {
  data?: unknown;
};

const getList = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const data = (payload as CustomerListEnvelope).data;
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const nested = (data as CustomerListEnvelope).data;
    if (Array.isArray(nested)) return nested;
  }
  return [];
};

export const getEligiblePosCustomers = (
  payload: unknown,
  restaurantId: string,
): PosCustomer[] =>
  getList(payload)
    .filter((value) => {
      if (!value || typeof value !== "object") return false;
      const record = value as {
        restaurantId?: unknown;
        isActive?: unknown;
        isGuest?: unknown;
      };
      return (
        record.isGuest !== true &&
        record.isActive !== false &&
        (typeof record.restaurantId !== "string" ||
          record.restaurantId === restaurantId)
      );
    })
    .map((value) =>
      normalizePosCustomer(
        value as Parameters<typeof normalizePosCustomer>[0],
      ),
    )
    .filter((customer): customer is PosCustomer => Boolean(customer));

export const serializePosCustomerSelection = ({
  customer,
  restaurantId,
  branchId,
}: {
  customer: PosCustomer;
  restaurantId: string;
  branchId?: string | null;
}) =>
  JSON.stringify({
    restaurantId,
    branchId: branchId ?? null,
    branch: branchId ? { id: branchId } : null,
    customer,
  });

export const parsePosCustomerSelection = ({
  raw,
  restaurantId,
}: {
  raw: string | null;
  restaurantId?: string | null;
}) => {
  if (!raw || !restaurantId) return null;

  try {
    const parsed = JSON.parse(raw) as {
      restaurantId?: unknown;
      customer?: unknown;
    };
    if (parsed.restaurantId !== restaurantId) return null;
    return normalizePosCustomer(
      parsed.customer as Parameters<typeof normalizePosCustomer>[0],
    );
  } catch {
    return null;
  }
};
