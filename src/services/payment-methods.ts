import { httpClient } from "@/lib/axios";
import {
  normalizePaymentMethodsResponse,
  type PaymentMethodsResponse,
} from "@/types/payment-methods";

export const PAYMENT_METHODS_ENDPOINT =
  "/admin/global-settings/payment-methods";

export const getPaymentMethods =
  async (): Promise<PaymentMethodsResponse> => {
    const response = await httpClient.get<unknown>(PAYMENT_METHODS_ENDPOINT);

    return normalizePaymentMethodsResponse(response);
  };
