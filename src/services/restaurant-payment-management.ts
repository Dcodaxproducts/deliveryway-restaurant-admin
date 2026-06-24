import { httpClient } from "@/lib/axios";
import {
  PAYMENT_METHOD_CODES,
  type PaymentMethodCode,
} from "@/types/payment-methods";

const paymentMethodCodeSet = new Set<string>(PAYMENT_METHOD_CODES);

type RecordValue = Record<string, unknown>;

export type RestaurantPaymentLedgerEntry = {
  id: string;
  type: string | null;
  status: string | null;
  paymentMethod: string | null;
  amount: number | null;
  currency: string | null;
  createdAt: string | null;
};

export type RestaurantPaymentManagement = {
  restaurantId: string | null;
  activePlatformPaymentMethods: PaymentMethodCode[];
  allowedPaymentMethods: PaymentMethodCode[];
  walletEnabled: boolean;
  estimatedAvailableBalance: number | null;
  currency: string | null;
  paymentSummary: RecordValue;
  walletExposure: RecordValue;
  stripeAccount: RecordValue;
  lastTransfer: RecordValue | null;
  recentLedger: RestaurantPaymentLedgerEntry[];
};

export type UpdateRestaurantPaymentMethodsPayload = {
  allowedPaymentMethods: PaymentMethodCode[];
  walletEnabled: boolean;
  note?: string;
};

const isRecord = (value: unknown): value is RecordValue =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const getRecord = (value: unknown): RecordValue => (isRecord(value) ? value : {});

const getString = (value: unknown, fallback: string | null = null) => {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
};

const getNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getBoolean = (value: unknown, fallback = false) =>
  typeof value === "boolean" ? value : fallback;

const unwrapData = (response: unknown) => {
  const record = getRecord(response);
  return record.data ?? response;
};

const normalizePaymentMethod = (value: unknown): PaymentMethodCode | null => {
  const normalized = getString(value, "")?.trim().toUpperCase();
  return normalized && paymentMethodCodeSet.has(normalized)
    ? (normalized as PaymentMethodCode)
    : null;
};

const normalizePaymentMethods = (value: unknown): PaymentMethodCode[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map(normalizePaymentMethod)
    .filter((method): method is PaymentMethodCode => Boolean(method));
};

const firstRecord = (...values: unknown[]) => {
  for (const value of values) {
    if (isRecord(value)) return value;
  }

  return {};
};

const firstArray = (...values: unknown[]) => {
  for (const value of values) {
    if (Array.isArray(value)) return value;
  }

  return [];
};

const normalizeLedgerEntry = (value: unknown): RestaurantPaymentLedgerEntry | null => {
  if (!isRecord(value)) return null;

  return {
    id: getString(value.id, "payment-ledger-entry") ?? "payment-ledger-entry",
    type: getString(value.type),
    status: getString(value.status ?? value.paymentStatus),
    paymentMethod: getString(value.paymentMethod),
    amount: getNumber(value.amount ?? value.totalAmount ?? value.netAmount),
    currency: getString(value.currency),
    createdAt: getString(value.createdAt),
  };
};

export const normalizeRestaurantPaymentManagement = (
  response: unknown
): RestaurantPaymentManagement => {
  const data = getRecord(unwrapData(response));
  const restaurant = getRecord(data.restaurant);
  const settings = getRecord(restaurant.settings);
  const payments = getRecord(settings.payments);
  const methodSettings = firstRecord(
    data.restaurantPaymentMethods,
    data.configuredPaymentMethods,
    data.paymentMethods,
    data.methods,
    payments.methods
  );
  const stripeAccount = firstRecord(
    data.stripeAccount,
    data.stripe,
    data.restaurantStripeAccount,
    getRecord(data.payout).stripeAccount
  );
  const walletExposure = firstRecord(
    data.customerWalletExposure,
    data.walletExposure,
    data.wallet
  );
  const paymentSummary = firstRecord(
    data.paymentTransactionSummary,
    data.transactionSummary,
    data.paymentSummary,
    data.summary
  );
  const recentLedger = firstArray(
    data.recentLedger,
    data.ledger,
    data.recentTransactions,
    data.transactions
  )
    .map(normalizeLedgerEntry)
    .filter((entry): entry is RestaurantPaymentLedgerEntry => Boolean(entry));
  const activePlatformPaymentMethods = normalizePaymentMethods(
    firstArray(
      data.activePlatformPaymentMethods,
      data.platformPaymentMethods,
      data.activePaymentMethods
    )
  );
  const allowedPaymentMethods = normalizePaymentMethods(
    methodSettings.allowedPaymentMethods ??
      methodSettings.allowedMethods ??
      methodSettings.methods
  );
  const walletEnabled =
    getBoolean(methodSettings.walletEnabled) || allowedPaymentMethods.includes("WALLET");

  return {
    restaurantId: getString(data.restaurantId ?? restaurant.id),
    activePlatformPaymentMethods,
    allowedPaymentMethods,
    walletEnabled,
    estimatedAvailableBalance: getNumber(
      data.estimatedAvailableBalance ??
        data.availableBalance ??
        getRecord(data.balance).estimatedAvailableBalance
    ),
    currency: getString(data.currency ?? getRecord(data.balance).currency),
    paymentSummary,
    walletExposure,
    stripeAccount,
    lastTransfer: firstRecord(data.lastTransfer, stripeAccount.lastTransfer),
    recentLedger,
  };
};

export const getRestaurantPaymentManagement = async (restaurantId: string) => {
  const response = await httpClient.get<unknown>(
    `/payments/restaurants/${restaurantId}/management`
  );

  return normalizeRestaurantPaymentManagement(response);
};

export const updateRestaurantPaymentMethods = (
  restaurantId: string,
  payload: UpdateRestaurantPaymentMethodsPayload
) =>
  httpClient.patch<unknown, UpdateRestaurantPaymentMethodsPayload>(
    `/payments/restaurants/${restaurantId}/methods`,
    payload
  );
