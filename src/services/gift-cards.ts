import { httpClient } from "@/lib/axios";
import { cleanParams } from "@/lib/params";
import type {
  GiftCard,
  GiftCardCreatePayload,
  GiftCardsListParams,
  GiftCardsListResponse,
  GiftCardUpdatePayload,
} from "@/types/gift-cards";
import {
  normalizeGiftCardsListResponse,
  unwrapGiftCard,
} from "@/types/gift-cards";

export const GIFT_CARDS_ENDPOINT = "/admin/promotions/gift-cards";

type GiftCardScopeParams = {
  restaurantId?: string;
  branchId?: string;
};

export async function getGiftCards(
  params: GiftCardsListParams
): Promise<GiftCardsListResponse> {
  const response = await httpClient.get<unknown>(GIFT_CARDS_ENDPOINT, {
    params: cleanParams(params),
  });

  return normalizeGiftCardsListResponse(response, params);
}

export async function createGiftCard(
  payload: GiftCardCreatePayload
): Promise<GiftCard> {
  const response = await httpClient.post<unknown, GiftCardCreatePayload>(
    GIFT_CARDS_ENDPOINT,
    payload
  );

  return unwrapGiftCard(response);
}

export async function getGiftCard(
  id: string,
  params?: GiftCardScopeParams
): Promise<GiftCard> {
  const response = await httpClient.get<unknown>(`${GIFT_CARDS_ENDPOINT}/${id}`, {
    params: cleanParams(params),
  });

  return unwrapGiftCard(response);
}

export async function updateGiftCard(
  id: string,
  payload: GiftCardUpdatePayload,
  params?: GiftCardScopeParams
): Promise<GiftCard> {
  const response = await httpClient.patch<unknown, GiftCardUpdatePayload>(
    `${GIFT_CARDS_ENDPOINT}/${id}`,
    payload,
    {
      params: cleanParams(params),
    }
  );

  return unwrapGiftCard(response);
}

export async function deleteGiftCard(
  id: string,
  params?: GiftCardScopeParams
): Promise<void> {
  await httpClient.delete<unknown>(`${GIFT_CARDS_ENDPOINT}/${id}`, {
    params: cleanParams(params),
  });
}
