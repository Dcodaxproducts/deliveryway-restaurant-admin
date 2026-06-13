import type { DeliveryConfig } from "./types";
import type { PaymentMethodCode } from "@/types/payment-methods";

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
export type DefaultAllowedPaymentMethod = PaymentMethodCode;

export const DEFAULT_ALLOWED_PAYMENT_METHODS: DefaultAllowedPaymentMethod[] = [
  "COD",
  "CARD_ON_DELIVERY",
  "STRIPE",
  "PAYPAL",
  "EASYPAISA",
  "JAZZCASH",
  "BANK_TRANSFER",
  "WALLET",
];
