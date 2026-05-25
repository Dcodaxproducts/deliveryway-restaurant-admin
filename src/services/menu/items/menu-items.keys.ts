export const menuItemKeys = {
  all: ["menu-items"] as const,
  list: (params?: unknown) => ["menu-items", params] as const,
  detail: (id?: string) => ["menu-items", "detail", id] as const,
};
