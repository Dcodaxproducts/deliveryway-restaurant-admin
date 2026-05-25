import api from "@/lib/axios";

/**
 * ==============================
 * TYPES
 * ==============================
 */

export type LoyaltyCustomerSummaryParams = {
  customerId: string;
};

export type AdjustCustomerLoyaltyPayload = {
  points: number;
  isCredit: boolean;
  note?: string;
};

export type AdjustCustomerLoyaltyParams = {
  customerId: string;
  payload: AdjustCustomerLoyaltyPayload;
};

export type GetLoyaltyProgramParams = {
  restaurantId?: string;
};

export type UpdateLoyaltyProgramPayload = {
  restaurantId?: string;
  pointsPerCurrencyUnit: number;
  currencyAmountPerPoint: number;
  redemptionValuePerPoint: number;
  minimumRedeemPoints: number;
  pointsExpiryDays: number;
  isActive: boolean;
  allowWalletConversion: boolean;
  allowOrderDiscount: boolean;
};

export type LoyaltyProgramResponse = {
  success: boolean;
  data: {
    restaurantId?: string;
    pointsPerCurrencyUnit: number;
    currencyAmountPerPoint: number;
    redemptionValuePerPoint: number;
    minimumRedeemPoints: number;
    pointsExpiryDays: number;
    isActive: boolean;
    allowWalletConversion: boolean;
    allowOrderDiscount: boolean;
    [key: string]: any;
  };
  message?: string;
};

export type LoyaltyCustomerSummaryResponse = {
  success: boolean;
  data: {
    customerId?: string;
    totalPoints?: number;
    availablePoints?: number;
    redeemedPoints?: number;
    expiredPoints?: number;
    history?: any[];
    [key: string]: any;
  };
  message?: string;
};

/**
 * ==============================
 * ROUTES
 * ==============================
 */

export const LOYALTY_ROUTES = {
  customerSummary: (customerId: string) =>
    `/admin/loyalty/customers/${encodeURIComponent(customerId)}`,

  adjustCustomer: (customerId: string) =>
    `/admin/loyalty/customers/${encodeURIComponent(customerId)}/adjust`,

  program: "/admin/loyalty/program",
};

/**
 * ==============================
 * HELPERS
 * ==============================
 */

const cleanParams = <T extends Record<string, any>>(params?: T) => {
  if (!params) return undefined;

  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      return value !== undefined && value !== null && value !== "";
    })
  );

  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
};

/**
 * ==============================
 * CUSTOMER LOYALTY APIS
 * ==============================
 */

export const getCustomerLoyaltySummary = async ({
  customerId,
}: LoyaltyCustomerSummaryParams): Promise<LoyaltyCustomerSummaryResponse> => {
  const { data } = await api.get(LOYALTY_ROUTES.customerSummary(customerId));

  return data;
};

export const adjustCustomerLoyaltyPoints = async ({
  customerId,
  payload,
}: AdjustCustomerLoyaltyParams) => {
  const { data } = await api.post(
    LOYALTY_ROUTES.adjustCustomer(customerId),
    payload
  );

  return data;
};

/**
 * ==============================
 * LOYALTY PROGRAM APIS
 * ==============================
 */

export const getLoyaltyProgram = async (
  params?: GetLoyaltyProgramParams
): Promise<LoyaltyProgramResponse> => {
  const { data } = await api.get(LOYALTY_ROUTES.program, {
    params: cleanParams(params),
  });

  return data;
};

export const updateLoyaltyProgram = async (
  payload: UpdateLoyaltyProgramPayload
): Promise<LoyaltyProgramResponse> => {
  const { data } = await api.patch(LOYALTY_ROUTES.program, payload);

  return data;
};