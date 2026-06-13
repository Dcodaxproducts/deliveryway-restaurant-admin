export const PAYMENT_METHOD_CODES = [
  "COD",
  "CARD_ON_DELIVERY",
  "STRIPE",
  "PAYPAL",
  "EASYPAISA",
  "JAZZCASH",
  "BANK_TRANSFER",
  "WALLET",
] as const;

export type PaymentMethodCode = (typeof PAYMENT_METHOD_CODES)[number];

export type PaymentMethod = {
  code: PaymentMethodCode;
  label: string;
  isActive: boolean;
};

export type PaymentMethodsResponse = {
  paymentMethods: PaymentMethod[];
  message?: string;
};

const paymentMethodCodeSet = new Set<string>(PAYMENT_METHOD_CODES);

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodCode, string> = {
  COD: "Cash on delivery",
  CARD_ON_DELIVERY: "Card on delivery",
  PAYPAL: "PayPal",
  STRIPE: "Stripe online payment",
  EASYPAISA: "Easypaisa",
  JAZZCASH: "JazzCash",
  BANK_TRANSFER: "Bank transfer",
  WALLET: "Customer wallet",
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isPaymentMethodCode = (value: unknown): value is PaymentMethodCode =>
  typeof value === "string" && paymentMethodCodeSet.has(value);

const getResponseData = (response: unknown): unknown[] => {
  if (!isRecord(response)) return [];

  const data = response.data;
  return Array.isArray(data) ? data : [];
};

const normalizePaymentMethod = (value: unknown): PaymentMethod | null => {
  if (!isRecord(value)) return null;

  const code = value.code;
  const label = value.label;
  const isActive = value.isActive;

  if (!isPaymentMethodCode(code) || typeof label !== "string") return null;

  return {
    code,
    label: PAYMENT_METHOD_LABELS[code] ?? label,
    isActive: typeof isActive === "boolean" ? isActive : false,
  };
};

export const normalizePaymentMethodsResponse = (
  response: unknown
): PaymentMethodsResponse => {
  const record = isRecord(response) ? response : {};
  const paymentMethods = getResponseData(response)
    .map(normalizePaymentMethod)
    .filter((method): method is PaymentMethod => Boolean(method));

  return {
    paymentMethods,
    message: typeof record.message === "string" ? record.message : undefined,
  };
};
