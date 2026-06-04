export type PaymentMethodCode =
  | "COD"
  | "STRIPE"
  | "EASYPAISA"
  | "JAZZCASH"
  | "BANK_TRANSFER"
  | "WALLET";

export type PaymentMethod = {
  code: PaymentMethodCode;
  label: string;
  isActive: boolean;
};

export type PaymentMethodsResponse = {
  paymentMethods: PaymentMethod[];
  message?: string;
};

const paymentMethodCodes: readonly PaymentMethodCode[] = [
  "COD",
  "STRIPE",
  "EASYPAISA",
  "JAZZCASH",
  "BANK_TRANSFER",
  "WALLET",
];

const paymentMethodCodeSet = new Set<string>(paymentMethodCodes);

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
    label,
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
