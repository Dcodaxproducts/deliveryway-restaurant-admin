export type ModifierGroupSelectionType = "SINGLE" | "MULTIPLE";

export type ModifierGroupAssignmentRules = {
  selectionType: ModifierGroupSelectionType;
  minSelect: number;
  maxSelect: number;
  sortOrder?: number;
};

export type ModifierGroupAssignmentGroup = {
  id: string;
  name: string;
  description?: string | null;
};

export type MenuItemModifierGroupAssignment = ModifierGroupAssignmentRules & {
  id?: string;
  itemId?: string;
  groupId: string;
  group?: ModifierGroupAssignmentGroup;
};

export type MenuCategoryModifierGroupAssignment =
  ModifierGroupAssignmentRules & {
    id?: string;
    categoryId?: string;
    groupId: string;
    group?: ModifierGroupAssignmentGroup;
  };

export type AssignModifierGroupPayload = ModifierGroupAssignmentRules;
