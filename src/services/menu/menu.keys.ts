export const menuKeys = {
  all: ["menus"] as const,
  list: (params?: unknown) => ["menus", params] as const,
  detail: (id?: string) => ["menus", "detail", id] as const,
};
