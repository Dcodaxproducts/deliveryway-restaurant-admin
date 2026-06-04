import type {
  MenuCategoryModifierGroupAssignment,
  MenuItemModifierGroupAssignment,
  ModifierGroupAssignmentGroup,
  ModifierGroupSelectionType,
} from "@/types/modifier-group-assignments";
import type { MenuItemModifierGroup } from "@/types/menu-items";
import type { ModifierGroupModifier } from "@/types/modifier-groups";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const getString = (record: Record<string, unknown>, key: string) => {
  const value = record[key];
  return typeof value === "string" ? value : "";
};

const getOptionalString = (record: Record<string, unknown>, key: string) => {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
};

const getNullableString = (record: Record<string, unknown>, key: string) => {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value : null;
};

const getNumber = (
  record: Record<string, unknown>,
  key: string,
  fallback: number
) => {
  const value = record[key];

  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
};

const getOptionalNumber = (record: Record<string, unknown>, key: string) => {
  const value = record[key];

  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
};

const getSelectionType = (
  record: Record<string, unknown>
): ModifierGroupSelectionType => {
  const value = record.selectionType;
  return value === "SINGLE" || value === "MULTIPLE" ? value : "MULTIPLE";
};

const normalizeGroupSummary = (
  source: Record<string, unknown>
): ModifierGroupAssignmentGroup | undefined => {
  const groupSource = isRecord(source.group)
    ? source.group
    : isRecord(source.modifierGroup)
    ? source.modifierGroup
    : source;

  const id =
    getString(groupSource, "id") ||
    getString(source, "groupId") ||
    getString(source, "modifierGroupId");
  const name = getString(groupSource, "name") || getString(source, "name");

  if (!id || !name) return undefined;

  return {
    id,
    name,
    description:
      getNullableString(groupSource, "description") ??
      getNullableString(source, "description"),
  };
};

const normalizeModifierCategory = (category: unknown) => {
  if (!isRecord(category)) return null;

  const id = getString(category, "id");
  const name = getString(category, "name");

  if (!id || !name) return null;

  return {
    id,
    name,
    slug: getOptionalString(category, "slug"),
  };
};

const normalizeGroupModifier = (
  modifier: unknown
): ModifierGroupModifier | null => {
  if (!isRecord(modifier)) return null;

  const nestedModifier = isRecord(modifier.modifier) ? modifier.modifier : null;
  const source = nestedModifier ?? modifier;
  const id =
    getString(source, "id") ||
    getString(modifier, "modifierId") ||
    getString(modifier, "id");
  const name = getString(source, "name");

  if (!id || !name) return null;

  return {
    id,
    name,
    priceDelta:
      getOptionalNumber(source, "priceDelta") ??
      getOptionalString(source, "priceDelta") ??
      null,
    sortOrder: getOptionalNumber(modifier, "sortOrder"),
    category: normalizeModifierCategory(source.category),
  };
};

export const normalizeMenuItemModifierGroups = (
  value: unknown
): MenuItemModifierGroup[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry): MenuItemModifierGroup | null => {
      if (!isRecord(entry)) return null;

      const group = normalizeGroupSummary(entry);
      const id = group?.id || getString(entry, "id");
      const name = group?.name || getString(entry, "name");

      if (!id || !name) return null;

      const selectionType = getSelectionType(entry);
      const minSelect = getNumber(entry, "minSelect", 0);
      const maxSelect = getNumber(
        entry,
        "maxSelect",
        selectionType === "SINGLE" ? 1 : Math.max(minSelect, 1)
      );
      const rawModifiers = Array.isArray(entry.modifiers)
        ? entry.modifiers
        : Array.isArray(entry.groupModifiers)
        ? entry.groupModifiers
        : [];

      return {
        id,
        groupId:
          getString(entry, "groupId") ||
          getString(entry, "modifierGroupId") ||
          id,
        name,
        description:
          group?.description ?? getNullableString(entry, "description"),
        selectionType,
        minSelect,
        maxSelect,
        isRequired:
          typeof entry.isRequired === "boolean"
            ? entry.isRequired
            : minSelect > 0,
        sortOrder: getNumber(entry, "sortOrder", 0),
        modifiers: rawModifiers
          .map(normalizeGroupModifier)
          .filter(
            (modifier): modifier is ModifierGroupModifier => Boolean(modifier)
          ),
      };
    })
    .filter((group): group is MenuItemModifierGroup => Boolean(group));
};

export const normalizeMenuItemModifierGroupAssignments = (
  value: unknown
): MenuItemModifierGroupAssignment[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry): MenuItemModifierGroupAssignment | null => {
      if (!isRecord(entry)) return null;

      const group = normalizeGroupSummary(entry);
      const groupId =
        getString(entry, "groupId") ||
        getString(entry, "modifierGroupId") ||
        group?.id ||
        getString(entry, "id");

      if (!groupId) return null;

      const minSelect = getNumber(entry, "minSelect", 0);
      const maxSelect = getNumber(
        entry,
        "maxSelect",
        getSelectionType(entry) === "SINGLE" ? 1 : Math.max(minSelect, 1)
      );

      return {
        id: getOptionalString(entry, "id"),
        itemId: getOptionalString(entry, "itemId"),
        groupId,
        group,
        selectionType: getSelectionType(entry),
        minSelect,
        maxSelect,
        sortOrder: getNumber(entry, "sortOrder", 0),
      };
    })
    .filter(
      (assignment): assignment is MenuItemModifierGroupAssignment =>
        Boolean(assignment)
    );
};

export const normalizeMenuCategoryModifierGroupAssignments = (
  value: unknown
): MenuCategoryModifierGroupAssignment[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry): MenuCategoryModifierGroupAssignment | null => {
      if (!isRecord(entry)) return null;

      const group = normalizeGroupSummary(entry);
      const groupId =
        getString(entry, "groupId") ||
        getString(entry, "modifierGroupId") ||
        group?.id ||
        getString(entry, "id");

      if (!groupId) return null;

      const minSelect = getNumber(entry, "minSelect", 0);
      const maxSelect = getNumber(
        entry,
        "maxSelect",
        getSelectionType(entry) === "SINGLE" ? 1 : Math.max(minSelect, 1)
      );

      return {
        id: getOptionalString(entry, "id"),
        categoryId: getOptionalString(entry, "categoryId"),
        groupId,
        group,
        selectionType: getSelectionType(entry),
        minSelect,
        maxSelect,
        sortOrder: getNumber(entry, "sortOrder", 0),
      };
    })
    .filter(
      (assignment): assignment is MenuCategoryModifierGroupAssignment =>
        Boolean(assignment)
    );
};

export const extractEntityId = (response: unknown): string | null => {
  if (!isRecord(response)) return null;

  const directId = getString(response, "id");
  if (directId) return directId;

  const data = response.data;
  if (isRecord(data)) {
    const dataId = getString(data, "id");
    if (dataId) return dataId;

    for (const value of Object.values(data)) {
      if (!isRecord(value)) continue;
      const nestedId = getString(value, "id");
      if (nestedId) return nestedId;
    }
  }

  return null;
};
