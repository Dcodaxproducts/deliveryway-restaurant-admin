import { httpClient } from "@/lib/axios";

export type WinOrderConnection = {
  id: string;
  branchId: string;
  username: string;
  credentialVersion: number;
  storeId: number | null;
  storeName: string | null;
  isEnabled: boolean;
  endpointPath: string;
  storeSpecificEndpointPath?: string | null;
  lastPollAt: string | null;
  lastSuccessfulCallbackAt: string | null;
  lastErrorAt: string | null;
  lastError: string | null;
  password?: string;
  passwordVisibleOnce?: boolean;
};

export type WinOrderCatalogOption = {
  key: string;
  menuItemId?: string;
  menuItemName?: string;
  variationId?: string | null;
  variationName?: string | null;
  modifierId?: string;
  name?: string;
  price?: number;
  priceDelta?: number;
};

export type WinOrderCatalogMapping = {
  mappingType: "ITEM" | "MODIFIER" | "SERVICE_CHARGE";
  localKey: string;
  localName?: string | null;
  externalArticleNo: string;
  externalArticleName: string;
};

export type WinOrderPaymentMethod =
  | "COD"
  | "CARD_ON_DELIVERY"
  | "STRIPE"
  | "PAYPAL"
  | "EASYPAISA"
  | "JAZZCASH"
  | "BANK_TRANSFER"
  | "WALLET";

export type WinOrderPaymentMapping = {
  paymentMethod: WinOrderPaymentMethod;
  externalLabel: string;
};

type ApiResponse<T> = { data: T; message: string };

export type WinOrderMappingsData = {
  catalog: {
    items: WinOrderCatalogOption[];
    modifiers: WinOrderCatalogOption[];
  };
  catalogMappings: WinOrderCatalogMapping[];
  paymentMappings: WinOrderPaymentMapping[];
  missingCatalogKeys: string[];
};

export type WinOrderHealthData = {
  connection: WinOrderConnection;
  exportCounts: Record<string, number>;
  recentEvents: Array<{
    id: string;
    orderId: string;
    trackingStatus: string;
    result: "PROCESSED" | "DUPLICATE" | "FAILED" | "IGNORED";
    errorMessage: string | null;
    processedAt: string;
  }>;
};

const base = "/admin/integrations/winorder";

export const getWinOrderConnection = (branchId: string) =>
  httpClient.get<ApiResponse<WinOrderConnection | null>>(
    `${base}/connections/${branchId}`,
  );

export const createWinOrderConnection = (payload: {
  branchId: string;
  storeId?: number;
  storeName?: string;
}) =>
  httpClient.post<ApiResponse<WinOrderConnection>, typeof payload>(
    `${base}/connections`,
    payload,
  );

export const updateWinOrderConnection = (
  branchId: string,
  payload: {
    storeId?: number | null;
    storeName?: string;
    isEnabled?: boolean;
  },
) =>
  httpClient.patch<ApiResponse<WinOrderConnection>, typeof payload>(
    `${base}/connections/${branchId}`,
    payload,
  );

export const rotateWinOrderCredentials = (branchId: string) =>
  httpClient.post<ApiResponse<WinOrderConnection>>(
    `${base}/connections/${branchId}/rotate`,
  );

export const getWinOrderMappings = (branchId: string) =>
  httpClient.get<ApiResponse<WinOrderMappingsData>>(
    `${base}/mappings/${branchId}`,
  );

export const replaceWinOrderCatalogMappings = (
  branchId: string,
  mappings: WinOrderCatalogMapping[],
) =>
  httpClient.patch<
    ApiResponse<WinOrderMappingsData>,
    { mappings: WinOrderCatalogMapping[] }
  >(`${base}/mappings/${branchId}/catalog`, { mappings });

export const replaceWinOrderPaymentMappings = (
  branchId: string,
  mappings: WinOrderPaymentMapping[],
) =>
  httpClient.patch<
    ApiResponse<WinOrderMappingsData>,
    { mappings: WinOrderPaymentMapping[] }
  >(`${base}/mappings/${branchId}/payments`, { mappings });

export const getWinOrderHealth = (branchId: string) =>
  httpClient.get<ApiResponse<WinOrderHealthData>>(`${base}/health/${branchId}`);

export const retryFailedWinOrderExports = (branchId: string) =>
  httpClient.post<ApiResponse<{ retried: number }>>(
    `${base}/health/${branchId}/retry-failed`,
  );
