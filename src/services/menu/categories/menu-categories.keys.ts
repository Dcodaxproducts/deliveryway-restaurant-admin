export const menuCategoryKeys = {
  all: ["menu-categories"] as const,
  list: (params?: unknown) => ["menu-categories", params] as const,
  detail: (id?: string) => ["menu-categories", "detail", id] as const,
};
