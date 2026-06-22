import { httpClient } from "@/lib/axios";

export type StripeAccountSettings = {
  accountId: string | null;
  payoutsEnabled: boolean;
  chargesEnabled: boolean;
  onboardingComplete: boolean;
  dashboardUrl: string | null;
  note: string | null;
  updatedAt?: string | null;
  updatedBy?: string | null;
  lastTransfer?: Record<string, unknown> | null;
};

export type StripeRestaurantAccountResponse = {
  data: {
    restaurantId: string;
    stripe: StripeAccountSettings;
    publishableKey?: string | null;
    configured?: boolean;
  };
  message?: string;
};

export type UpdateStripeAccountPayload = Partial<
  Pick<
    StripeAccountSettings,
    | "accountId"
    | "payoutsEnabled"
    | "chargesEnabled"
    | "onboardingComplete"
    | "dashboardUrl"
    | "note"
  >
>;

export const getRestaurantStripeAccount = (restaurantId: string) =>
  httpClient.get<StripeRestaurantAccountResponse>(
    `/payments/stripe/restaurants/${restaurantId}/account`
  );

export const updateRestaurantStripeAccount = (
  restaurantId: string,
  payload: UpdateStripeAccountPayload
) =>
  httpClient.patch<StripeRestaurantAccountResponse, UpdateStripeAccountPayload>(
    `/payments/stripe/restaurants/${restaurantId}/account`,
    payload
  );
