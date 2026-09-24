import type { LegalProfile } from "@/services/legal-profile";

export type LegalProfileDraftState = {
  draftProfile?: LegalProfile;
  loadedRestaurantId?: string;
};

type ReconcileLegalProfileDraftParams = {
  state: LegalProfileDraftState;
  restaurantId?: string;
  savedProfile?: LegalProfile;
  isLoading: boolean;
  isError: boolean;
};

export const reconcileLegalProfileDraft = ({
  state,
  restaurantId,
  savedProfile,
  isLoading,
  isError,
}: ReconcileLegalProfileDraftParams): LegalProfileDraftState => {
  if (
    !restaurantId ||
    !savedProfile ||
    isLoading ||
    isError ||
    state.loadedRestaurantId === restaurantId
  ) {
    return state;
  }

  return {
    draftProfile: savedProfile,
    loadedRestaurantId: restaurantId,
  };
};
