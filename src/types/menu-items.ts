import type { ModifierGroupModifier } from "@/types/modifier-groups";
import type {
  ModifierGroupAssignmentRules,
  ModifierGroupSelectionType,
} from "@/types/modifier-group-assignments";

export type MenuItemsListParams = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  restaurantId?: string;
  branchId?: string;
  categoryId?: string;
  menuId?: string;
  includeAll?: boolean;
  inactive?: boolean;
};

export type MenuItemModifierGroup = ModifierGroupAssignmentRules & {
  id: string;
  groupId?: string;
  name: string;
  description?: string | null;
  selectionType: ModifierGroupSelectionType;
  isRequired?: boolean;
  modifiers?: ModifierGroupModifier[];
};

export type MenuItemVariationModifierPriceOverrideInput = {
  modifierId: string;
  priceDelta: number;
};

export type MenuItemVariationPriceOverrideInput = {
  variationId: string;
  price?: number | null;
  pickupPrice?: number | null;
  displayText?: string;
  modifierPriceOverrides?: MenuItemVariationModifierPriceOverrideInput[];
};

export type VariationModifierPriceMatrixCell = {
  variationId: string;
  modifierId: string;
  priceDelta: number | null;
};
