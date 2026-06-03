export const formatModifierCategoryStatus = (isActive?: boolean) =>
  isActive === false ? "Inactive" : "Active";

export const formatModifierCategoryDescription = (
  description?: string | null
) => description?.trim() || "-";

export const formatModifierCategorySortOrder = (sortOrder?: number) =>
  Number.isFinite(sortOrder) ? String(sortOrder) : "0";

export const slugifyModifierCategoryName = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
