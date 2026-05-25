export const variationKeys = {
  all: ["menu-variations"] as const,
  list: (params?: unknown) => ["menu-variations", params] as const,
  detail: (id?: string) => ["menu-variations", "detail", id] as const,
};
