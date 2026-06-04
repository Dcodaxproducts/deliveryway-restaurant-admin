"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { queryKeys } from "@/config/query-keys";
import { getApiErrorMessage } from "@/lib/errors";
import {
  createGiftCard,
  deleteGiftCard,
  getGiftCard,
  getGiftCards,
  updateGiftCard,
} from "@/services/gift-cards";
import type {
  GiftCardCreatePayload,
  GiftCardsListParams,
  GiftCardUpdatePayload,
} from "@/types/gift-cards";

type GiftCardScopeParams = {
  restaurantId?: string;
  branchId?: string;
};

export function useGiftCards(params: GiftCardsListParams) {
  return useQuery({
    queryKey: queryKeys.giftCards.list(params),
    queryFn: () => getGiftCards(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useGiftCard(id: string | null, params?: GiftCardScopeParams) {
  return useQuery({
    queryKey: queryKeys.giftCards.detail(id, params),
    queryFn: () => getGiftCard(id as string, params),
    enabled: Boolean(id),
  });
}

export function useCreateGiftCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: GiftCardCreatePayload) => createGiftCard(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.giftCards.all });
      toast.success("Gift card created successfully.");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to create gift card."));
    },
  });
}

export function useUpdateGiftCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
      params,
    }: {
      id: string;
      payload: GiftCardUpdatePayload;
      params?: GiftCardScopeParams;
    }) => updateGiftCard(id, payload, params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.giftCards.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.giftCards.detail(variables.id, variables.params),
      });
      toast.success("Gift card updated successfully.");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to update gift card."));
    },
  });
}

export function useDeleteGiftCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, params }: { id: string; params?: GiftCardScopeParams }) =>
      deleteGiftCard(id, params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.giftCards.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.giftCards.detail(variables.id, variables.params),
      });
      toast.success("Gift card deleted successfully.");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to delete gift card."));
    },
  });
}
