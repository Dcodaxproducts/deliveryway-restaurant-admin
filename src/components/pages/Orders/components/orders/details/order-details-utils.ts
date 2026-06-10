type DeliveryAddress = {
  address?: string | null;
  street?: string | null;
  area?: string | null;
  postalCode?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  lat?: number | null;
  lng?: number | null;
};

type PaymentOptions = {
  selected?: string | null;
};

type OrderPaymentSource = {
  paymentMethod?: string | null;
  paymentOptions?: PaymentOptions | null;
};

const paymentMethodLabels: Record<string, string> = {
  COD: "Cash on delivery",
  PAYPAL: "PayPal",
  STRIPE: "Online card",
};

const cleanParts = (parts: Array<string | null | undefined>) =>
  parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));

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

  if (address.address?.trim()) {
    return address.address.trim();
  }

  const lineOne = address.street?.trim() ?? "";
  const lineOneSearch = lineOne.toLowerCase();
  const secondaryParts = cleanParts([
    address.area,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ]).filter((part) => !lineOneSearch.includes(part.toLowerCase()));
  const lineTwo = secondaryParts.join(", ");

  return cleanParts([lineOne, lineTwo]).join("\n") || null;
};

export const getMapsUrl = (address?: DeliveryAddress | null) => {
  if (typeof address?.lat !== "number" || typeof address.lng !== "number") {
    return null;
  }

  return `https://www.google.com/maps?q=${address.lat},${address.lng}`;
};
