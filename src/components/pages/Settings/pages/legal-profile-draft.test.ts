import { describe, expect, it } from "vitest";

import type { LegalProfile } from "@/services/legal-profile";

import {
  reconcileLegalProfileDraft,
  type LegalProfileDraftState,
} from "./legal-profile-draft";

const profile = (restaurantId: string, legalBusinessName: string): LegalProfile => ({
  restaurantId,
  legalBusinessName,
  taxNumber: "",
  businessAddress: {
    street: "",
    shopNumber: "",
    city: "",
    state: "",
    country: "",
  },
  contractText: "",
});

describe("legal profile draft hydration", () => {
  it("does not create or mark a draft after an error, then hydrates retry data", () => {
    const initialState: LegalProfileDraftState = {};
    const afterError = reconcileLegalProfileDraft({
      state: initialState,
      restaurantId: "restaurant-1",
      isLoading: false,
      isError: true,
    });

    expect(afterError).toBe(initialState);
    expect(afterError).toEqual({});

    expect(
      reconcileLegalProfileDraft({
        state: afterError,
        restaurantId: "restaurant-1",
        savedProfile: profile("restaurant-1", "Existing Restaurant"),
        isLoading: false,
        isError: false,
      }),
    ).toEqual({
      draftProfile: profile("restaurant-1", "Existing Restaurant"),
      loadedRestaurantId: "restaurant-1",
    });
  });

  it("preserves dirty edits for the loaded restaurant and hydrates a restaurant switch", () => {
    const dirtyProfile = profile("restaurant-1", "Unsaved Edit");
    const dirtyState = {
      draftProfile: dirtyProfile,
      loadedRestaurantId: "restaurant-1",
    };

    expect(
      reconcileLegalProfileDraft({
        state: dirtyState,
        restaurantId: "restaurant-1",
        savedProfile: profile("restaurant-1", "Server Refresh"),
        isLoading: false,
        isError: false,
      }),
    ).toBe(dirtyState);

    expect(
      reconcileLegalProfileDraft({
        state: dirtyState,
        restaurantId: "restaurant-2",
        savedProfile: profile("restaurant-2", "Second Restaurant"),
        isLoading: false,
        isError: false,
      }),
    ).toEqual({
      draftProfile: profile("restaurant-2", "Second Restaurant"),
      loadedRestaurantId: "restaurant-2",
    });
  });
});
