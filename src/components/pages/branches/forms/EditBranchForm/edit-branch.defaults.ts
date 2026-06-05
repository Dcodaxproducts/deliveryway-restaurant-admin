import type { DeliveryConfig } from "./types";

export const DEFAULT_DELIVERY_CONFIG: DeliveryConfig = {
  mode: "RADIUS",
  radiusKm: 0,
  minOrderAmount: 0,
  deliveryFee: 0,
  isFreeDelivery: false,
  freeDeliveryThreshold: 0,
  zones: [],
  zoneBands: [],
  postalCodeRules: [],
};

export const DEFAULT_ALLOWED_ORDER_TYPES = ["DELIVERY"];
export type DefaultAllowedPaymentMethod =
  | "COD"
  | "STRIPE"
  | "EASYPAISA"
  | "JAZZCASH"
  | "BANK_TRANSFER";

export const DEFAULT_ALLOWED_PAYMENT_METHODS: DefaultAllowedPaymentMethod[] = [
  "COD",
  "STRIPE",
  "EASYPAISA",
  "JAZZCASH",
  "BANK_TRANSFER",
];
