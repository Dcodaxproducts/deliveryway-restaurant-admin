import type { DeliveryAddress } from "@/types/orders";

type PaymentOptions = {
  selected?: string | null;
};

type OrderPaymentSource = {
  paymentMethod?: string | null;
  paymentOptions?: PaymentOptions | null;
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

  const streetLine = cleanParts([address.street, shopNumber]).join(" ");
  const cityLine = cleanParts([address.postalCode, address.city]).join(" ");
  const pairedValues = new Set(
    cleanParts([address.street, shopNumber, address.postalCode, address.city]).map(
      (part) => part.toLowerCase()
    )
  );
  const orderedParts = getUniqueParts(
    cleanParts([
      streetLine,
      cityLine,
      ...(cleanParts([address.area, address.state]).filter(
        (part) => !pairedValues.has(part.toLowerCase())
      )),
      address.country,
      address.address,
    ])
  );
  const lineOne = orderedParts.slice(0, 2).join(", ");
  const lineTwo = orderedParts.slice(2).join(", ");

  return cleanParts([lineOne, lineTwo]).join("\n") || null;
};

export const getMapsUrl = (address?: DeliveryAddress | null) => {
  if (typeof address?.lat !== "number" || typeof address.lng !== "number") {
    return null;
  }

  return `https://www.google.com/maps?q=${address.lat},${address.lng}`;
};
