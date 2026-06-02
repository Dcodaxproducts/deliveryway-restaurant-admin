import { httpClient } from "@/lib/axios";
import { cleanParams } from "@/lib/params";
import {
  normalizeAdminDealsResponse,
  normalizeAdminDealStats,
  unwrapAdminDeal,
} from "@/components/pages/Menu/deals/utils/admin-deals-normalizers";
import type {
  AdminDeal,
  AdminDealCreatePayload,
  AdminDealsListParams,
  AdminDealsListResponse,
  AdminDealStats,
  AdminDealUpdatePayload,
} from "@/types/admin-deals";

export const ADMIN_DEALS_ENDPOINT = "/admin/deals";

type AdminDealScopeParams = {
  restaurantId?: string;
  branchId?: string;
};

export async function getAdminDeals(
  params: AdminDealsListParams
): Promise<AdminDealsListResponse> {
  const response = await httpClient.get<unknown>(ADMIN_DEALS_ENDPOINT, {
    params: cleanParams(params),
  });

  return normalizeAdminDealsResponse(response, params);
}

export async function createAdminDeal(
  payload: AdminDealCreatePayload
): Promise<AdminDeal> {
  const response = await httpClient.post<unknown, AdminDealCreatePayload>(
    ADMIN_DEALS_ENDPOINT,
    payload
  );

  return unwrapAdminDeal(response);
}

export async function getAdminDeal(
  id: string,
  params?: AdminDealScopeParams
): Promise<AdminDeal> {
  const response = await httpClient.get<unknown>(`${ADMIN_DEALS_ENDPOINT}/${id}`, {
    params: cleanParams(params),
  });

  return unwrapAdminDeal(response);
}

export async function updateAdminDeal(
  id: string,
  payload: AdminDealUpdatePayload,
  params?: AdminDealScopeParams
): Promise<AdminDeal> {
  const response = await httpClient.patch<unknown, AdminDealUpdatePayload>(
    `${ADMIN_DEALS_ENDPOINT}/${id}`,
    payload,
    {
      params: cleanParams(params),
    }
  );

  return unwrapAdminDeal(response);
}

export async function deleteAdminDeal(
  id: string,
  params?: AdminDealScopeParams
): Promise<void> {
  await httpClient.delete<unknown>(`${ADMIN_DEALS_ENDPOINT}/${id}`, {
    params: cleanParams(params),
  });
}

export async function getAdminDealStats(
  id: string,
  params?: AdminDealScopeParams
): Promise<AdminDealStats> {
  const response = await httpClient.get<unknown>(
    `${ADMIN_DEALS_ENDPOINT}/${id}/stats`,
    {
      params: cleanParams(params),
    }
  );

  return normalizeAdminDealStats(response);
}
