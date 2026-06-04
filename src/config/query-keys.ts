import type { GiftCardsListParams } from "@/types/gift-cards";

type GiftCardScopeParams = {
  restaurantId?: string;
  branchId?: string;
};

export const queryKeys = {
  giftCards: {
    all: ["gift-cards"] as const,
    list: (params?: GiftCardsListParams) => ["gift-cards", "list", params] as const,
    detail: (id: string | null, params?: GiftCardScopeParams) =>
      ["gift-cards", "detail", id, params] as const,
  },
} as const;
