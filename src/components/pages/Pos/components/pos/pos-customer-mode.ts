import type { PosCustomer } from "@/components/pages/Pos/components/pos/pos-checkout-payload";

export type PosCustomerMode = "walk-in" | "existing";

export type PosWalkInDraft = {
  name: string;
  phone: string;
  email: string;
};

export const POS_CUSTOMER_MODE_STORAGE_KEY = "feastflow:pos-customer-mode";
export const POS_WALK_IN_DRAFT_STORAGE_KEY = "feastflow:pos-walk-in-draft";

export const emptyPosWalkInDraft = (): PosWalkInDraft => ({
  name: "",
  phone: "",
  email: "",
});

export const normalizePosWalkInDraft = (
  value?: Partial<PosWalkInDraft> | null,
): PosWalkInDraft => ({
  name: String(value?.name ?? "").trimStart(),
  phone: String(value?.phone ?? "").trimStart(),
  email: String(value?.email ?? "").trimStart(),
});

export const splitPosWalkInName = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "Walk-in",
    lastName: parts.slice(1).join(" "),
  };
};

export const mergePosWalkInDraft = (
  customer: PosCustomer,
  draft: PosWalkInDraft,
): PosCustomer => {
  const name = splitPosWalkInName(draft.name);
  return {
    ...customer,
    firstName: draft.name.trim() ? name.firstName : customer.firstName,
    lastName: draft.name.trim() ? name.lastName : customer.lastName,
    phone: draft.phone.trim() || customer.phone,
    email: draft.email.trim() || customer.email,
    isGuest: true,
  };
};

export const isValidPosGuestPhone = (phone: string) => {
  const normalized = phone.trim();
  return (
    !normalized ||
    (/^[+()\d\s./-]+$/.test(normalized) &&
      (normalized.match(/\d/g)?.length ?? 0) >= 7 &&
      (normalized.match(/\d/g)?.length ?? 0) <= 15)
  );
};

export const serializePosCustomerMode = (
  restaurantId: string,
  mode: PosCustomerMode,
) => JSON.stringify({ restaurantId, mode });

export const parsePosCustomerMode = (
  raw: string | null,
  restaurantId?: string | null,
): PosCustomerMode => {
  if (!raw || !restaurantId) return "walk-in";
  try {
    const parsed = JSON.parse(raw) as {
      restaurantId?: unknown;
      mode?: unknown;
    };
    if (parsed.restaurantId !== restaurantId) return "walk-in";
    return parsed.mode === "existing" ? "existing" : "walk-in";
  } catch {
    return "walk-in";
  }
};

export const serializePosWalkInDraft = (
  restaurantId: string,
  draft: PosWalkInDraft,
) => JSON.stringify({ restaurantId, draft: normalizePosWalkInDraft(draft) });

export const parsePosWalkInDraft = (
  raw: string | null,
  restaurantId?: string | null,
): PosWalkInDraft => {
  if (!raw || !restaurantId) return emptyPosWalkInDraft();
  try {
    const parsed = JSON.parse(raw) as {
      restaurantId?: unknown;
      draft?: Partial<PosWalkInDraft>;
    };
    if (parsed.restaurantId !== restaurantId) return emptyPosWalkInDraft();
    return normalizePosWalkInDraft(parsed.draft);
  } catch {
    return emptyPosWalkInDraft();
  }
};
