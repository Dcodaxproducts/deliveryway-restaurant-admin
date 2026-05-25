export type CreateMenuItemStep = "basic" | "pricing" | "variations" | "modifiers";

export type CreateMenuItemState = {
  step: CreateMenuItemStep;
};

export type CreateMenuItemAction =
  | { type: "GO_TO_STEP"; step: CreateMenuItemStep }
  | { type: "RESET" };

export const createMenuItemInitialState: CreateMenuItemState = { step: "basic" };

export const createMenuItemReducer = (
  state: CreateMenuItemState,
  action: CreateMenuItemAction
): CreateMenuItemState => {
  switch (action.type) {
    case "GO_TO_STEP":
      return { ...state, step: action.step };
    case "RESET":
      return createMenuItemInitialState;
    default:
      return state;
  }
};
