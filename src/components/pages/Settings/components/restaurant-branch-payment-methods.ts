import {
  PAYMENT_METHOD_CODES,
  type PaymentMethodCode,
} from "@/types/payment-methods";

export type BranchPaymentOption = {
  id: string;
  name: string;
  isActive: boolean;
  allowedPaymentMethods: PaymentMethodCode[] | null;
};

const paymentMethodCodes = new Set<string>(PAYMENT_METHOD_CODES);
const defaultBranchPaymentMethods: PaymentMethodCode[] = [
  "COD",
  "CARD_ON_DELIVERY",
  "PAYPAL",
  "WALLET",
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const normalizeMethods = (value: unknown): PaymentMethodCode[] | null => {
  if (!Array.isArray(value)) return null;

  return value.filter(
    (method): method is PaymentMethodCode =>
      typeof method === "string" && paymentMethodCodes.has(method),
  );
};

export const readBranchPaymentOptions = (
  response: unknown,
): BranchPaymentOption[] => {
  if (!isRecord(response) || !Array.isArray(response.data)) return [];

  return response.data.flatMap((value) => {
    if (!isRecord(value) || typeof value.id !== "string") return [];

    const settings = isRecord(value.settings) ? value.settings : {};

    return [
      {
        id: value.id,
        name:
          typeof value.name === "string" && value.name.trim()
            ? value.name.trim()
            : "Unnamed branch",
        isActive: value.isActive !== false,
        allowedPaymentMethods: normalizeMethods(settings.allowedPaymentMethods),
      },
    ];
  });
};

export const resolveSelectedBranchMethods = (
  branch: BranchPaymentOption | undefined,
  restaurantMethods: PaymentMethodCode[],
) => {
  const restaurantMethodSet = new Set(restaurantMethods);
  const configuredMethods =
    branch?.allowedPaymentMethods ?? defaultBranchPaymentMethods;

  return configuredMethods.filter((method) => restaurantMethodSet.has(method));
};
