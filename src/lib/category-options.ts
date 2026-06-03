import type { MenuCategoryOption } from "@/types/categories";

type CategoryRecord = Record<string, unknown>;

const getString = (record: CategoryRecord, key: string) => {
  const value = record[key];
  return typeof value === "string" ? value : "";
};

const getNullableString = (record: CategoryRecord, key: string) => {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value : null;
};

const getOptionalNumber = (record: CategoryRecord, key: string) => {
  const value = record[key];

  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
};

export const normalizeCategoryOption = (
  category: unknown
): MenuCategoryOption | null => {
  if (!category || typeof category !== "object") return null;

  const record = category as CategoryRecord;
  const id = getString(record, "id");
  const name = getString(record, "name");

  if (!id || !name) return null;

  return {
    id,
    name,
    imageUrl:
      getNullableString(record, "imageUrl") ||
      getNullableString(record, "image") ||
      getNullableString(record, "thumbnailUrl"),
    slug: getNullableString(record, "slug"),
    itemCount:
      getOptionalNumber(record, "itemCount") ??
      getOptionalNumber(record, "itemsCount") ??
      getOptionalNumber(record, "menuItemsCount"),
  };
};

export const mergeUniqueCategoryOptions = (
  previous: MenuCategoryOption[],
  next: MenuCategoryOption[]
) => {
  const categories = new Map<string, MenuCategoryOption>();

  [...previous, ...next].forEach((category) => {
    categories.set(category.id, category);
  });

  return Array.from(categories.values());
};

export const getCategoryInitials = (name: string) => {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "C";
};
