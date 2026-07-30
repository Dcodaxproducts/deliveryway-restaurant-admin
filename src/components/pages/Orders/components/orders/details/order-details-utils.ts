import type { DeliveryAddress } from "@/types/orders";

type PaymentOptions = {
  selected?: string | null;
};

type OrderPaymentSource = {
  paymentMethod?: string | null;
  paymentOptions?: PaymentOptions | null;
};

type OrderAddressSource = {
  orderType?: string | null;
  deliveryAddress?: DeliveryAddress | null;
  branch?: { name?: string | null } | null;
};

type OrderAddressLabels = {
  addressPending: string;
  dineIn: string;
  noBranch: string;
  takeawayOrder: string;
};

const paymentMethodLabels: Record<string, string> = {
  COD: "Cash on delivery",
  CARD_ON_DELIVERY: "Card on delivery",
  PAYPAL: "PayPal",
  STRIPE: "Stripe online payment",
  EASYPAISA: "Easypaisa",
  JAZZCASH: "JazzCash",
  BANK_TRANSFER: "Bank transfer",
  WALLET: "Customer wallet",
};

const cleanParts = (parts: Array<string | null | undefined>) =>
  parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));

const getUniqueParts = (parts: string[]) => {
  const seen = new Set<string>();

  return parts.filter((part) => {
    const normalizedPart = part.toLowerCase();

    if (seen.has(normalizedPart)) {
      return false;
    }

    seen.add(normalizedPart);
    return true;
  });
};

export const formatPaymentMethod = (method?: string | null) => {
  if (!method) return null;

  return (
    paymentMethodLabels[method] ??
    method
      .toLowerCase()
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
};

export const getSelectedPaymentMethod = (order?: OrderPaymentSource | null) =>
  order?.paymentOptions?.selected || order?.paymentMethod || null;

export const formatDeliveryAddress = (address?: DeliveryAddress | null) => {
  if (!address) return null;

  const shopNumber = address.shopNumber || address.shopNo || address.houseNumber;
  const hasStructuredAddress = Boolean(
    cleanParts([
      address.street,
      shopNumber,
      address.postalCode,
      address.city,
      address.area,
      address.state,
      address.country,
    ]).length
  );

  if (!hasStructuredAddress && address.address?.trim()) {
    return address.address.trim();
  }

  const orderedParts = getUniqueParts(
    cleanParts([
      address.street,
      shopNumber,
      address.postalCode,
      address.city,
      address.area,
      address.state,
      address.country,
      address.address,
    ])
  );
  const street = orderedParts[0] ?? "";
  const streetSearch = street.toLowerCase();
  const remainingParts = orderedParts.slice(1).filter(
    (part) => !streetSearch.includes(part.toLowerCase())
  );
  const lineOne = cleanParts([street, ...remainingParts.slice(0, 3)]).join(", ");
  const lineTwo = remainingParts.slice(3).join(", ");

  return cleanParts([lineOne, lineTwo]).join("\n") || null;
};

export const getOrderAddressPreview = (
  order: OrderAddressSource,
  labels: OrderAddressLabels,
) => {
  const orderType = order.orderType?.toUpperCase();
  const branchName = order.branch?.name || labels.noBranch;

  if (orderType === "DINE_IN") {
    return {
      primary: labels.dineIn,
      secondary: branchName,
      full: branchName,
    };
  }

  if (orderType !== "DELIVERY") {
    return {
      primary: labels.takeawayOrder,
      secondary: branchName,
      full: branchName,
    };
  }

  const formattedAddress = formatDeliveryAddress(order.deliveryAddress);
  const [primaryAddress, ...secondaryAddress] =
    formattedAddress?.split("\n") ?? [];

  return {
    primary: primaryAddress || labels.addressPending,
    secondary: secondaryAddress.join(", ") || branchName,
    full: formattedAddress || labels.addressPending,
  };
};

export const getMapsUrl = (address?: DeliveryAddress | null) => {
  if (typeof address?.lat !== "number" || typeof address.lng !== "number") {
    return null;
  }

  return `https://www.google.com/maps?q=${address.lat},${address.lng}`;
};
