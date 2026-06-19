export type PosOrderType = "DELIVERY" | "TAKEAWAY" | "DINE_IN";

export type PosPaymentMethod =
  | "COD"
  | "CARD_ON_DELIVERY"
  | "STRIPE"
  | "PAYPAL"
  | "EASYPAISA"
  | "JAZZCASH"
  | "BANK_TRANSFER"
  | "WALLET"
  | string;

export type PosCustomer = {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  isGuest?: boolean;
  profile?: {
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
  } | null;
};

export type GuestDeliveryAddress = {
  street: string;
  area?: string;
  postalCode: string;
  city: string;
  state?: string;
  country: string;
  lat?: string;
  lng?: string;
};

export type PosCheckoutPayload = {
  orderTime?: string | null;
  scheduledDeliveryAt?: string | null;
  paymentMethod: PosPaymentMethod;
  walletAmount?: number;
  customerNote?: string;
  tipAmount?: number;
  loyaltyPoints?: number;
  branchId?: string;
  guestContact?: {
    email: string;
    phone: string;
    privacyPolicyAccepted: boolean;
  };
  guestDeliveryAddress?: GuestDeliveryAddress;
};

export type PosCartSettingsPayload = {
  orderType?: PosOrderType;
  paymentMethod?: PosPaymentMethod;
  orderTime?: string;
  scheduledDeliveryAt?: string;
  tipAmount?: number;
  customerNote?: string | null;
  note?: string | null;
};

type RawCustomerRecord = Record<string, unknown>;

const getRecord = (value: unknown): RawCustomerRecord | null => {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as RawCustomerRecord)
    : null;
};

const getString = (value: unknown) => {
  return typeof value === "string" ? value : "";
};

const trimAddress = (address?: GuestDeliveryAddress | null): GuestDeliveryAddress => ({
  street: String(address?.street ?? "").trim(),
  area: String(address?.area ?? "").trim(),
  postalCode: String(address?.postalCode ?? "").trim(),
  city: String(address?.city ?? "").trim(),
  state: String(address?.state ?? "").trim(),
  country: String(address?.country ?? "").trim(),
  lat: String(address?.lat ?? "").trim(),
  lng: String(address?.lng ?? "").trim(),
});

export const isValidLatitude = (value?: string | null) => {
  if (!value?.trim()) return false;
  const latitude = Number(value);
  return Number.isFinite(latitude) && latitude >= -90 && latitude <= 90;
};

export const isValidLongitude = (value?: string | null) => {
  if (!value?.trim()) return false;
  const longitude = Number(value);
  return Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
};

export const emptyGuestDeliveryAddress = (): GuestDeliveryAddress => ({
  street: "",
  area: "",
  postalCode: "",
  city: "",
  state: "",
  country: "",
  lat: "",
  lng: "",
});

export const normalizePosCustomer = (
  raw: PosCustomer | RawCustomerRecord | null | undefined,
): PosCustomer | null => {
  const record = getRecord(raw);
  if (!record) return null;

  const profile = getRecord(record.profile);
  const id = getString(record.id);

  if (!id) return null;

  return {
    id,
    firstName: getString(record.firstName) || getString(profile?.firstName),
    lastName: getString(record.lastName) || getString(profile?.lastName),
    name: getString(record.name) || getString(record.fullName),
    email: getString(record.email),
    phone: getString(record.phone) || getString(profile?.phone),
    isGuest: record.isGuest === true,
    profile: profile
      ? {
          firstName: getString(profile.firstName),
          lastName: getString(profile.lastName),
          phone: getString(profile.phone),
        }
      : null,
  };
};

export const getPosCustomerName = (customer?: PosCustomer | null) => {
  if (!customer) return "";

  const profileName = [customer.firstName, customer.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return profileName || customer.name || customer.email || customer.id;
};

export const hasGuestContact = (customer?: PosCustomer | null) => {
  return Boolean(customer?.email?.trim() && customer?.phone?.trim());
};

export const hasGuestDeliveryAddress = (
  address?: GuestDeliveryAddress | null,
) => {
  const trimmed = trimAddress(address);

  return Boolean(
    trimmed.street &&
      trimmed.postalCode &&
      trimmed.city &&
      trimmed.state &&
      trimmed.country &&
      isValidLatitude(trimmed.lat) &&
      isValidLongitude(trimmed.lng),
  );
};

export const getOptionalPositiveNumber = (value?: string | null) => {
  if (!value?.trim()) return undefined;

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

export const getOptionalNonNegativeNumber = (value?: string | null) => {
  if (!value?.trim()) return undefined;

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
};

export const buildPosCheckoutPayload = ({
  customer,
  orderType,
  paymentMethod,
  orderTime,
  walletAmount,
  loyaltyPoints,
  tipAmount,
  customerNote,
  branchId,
  guestDeliveryAddress,
}: {
  customer: PosCustomer;
  orderType: PosOrderType;
  paymentMethod: string;
  orderTime?: string | null;
  walletAmount?: number;
  loyaltyPoints?: number;
  tipAmount?: number;
  customerNote?: string;
  branchId?: string;
  guestDeliveryAddress?: GuestDeliveryAddress;
}): PosCheckoutPayload => {
  const payload: PosCheckoutPayload = {
    paymentMethod: paymentMethod.toUpperCase(),
  };

  if (orderTime !== undefined) {
    payload.orderTime = orderTime;
  }

  if (customerNote?.trim()) {
    payload.customerNote = customerNote.trim();
  }

  if (walletAmount !== undefined) {
    payload.walletAmount = walletAmount;
  }

  if (loyaltyPoints !== undefined) {
    payload.loyaltyPoints = loyaltyPoints;
  }

  if (tipAmount !== undefined) {
    payload.tipAmount = tipAmount;
  }

  if (branchId) {
    payload.branchId = branchId;
  }

  if (customer.isGuest) {
    payload.guestContact = {
      email: customer.email?.trim() || "",
      phone: customer.phone?.trim() || "",
      privacyPolicyAccepted: true,
    };

    if (orderType === "DELIVERY" && guestDeliveryAddress) {
      payload.guestDeliveryAddress = trimAddress(guestDeliveryAddress);
    }
  }

  return payload;
};
