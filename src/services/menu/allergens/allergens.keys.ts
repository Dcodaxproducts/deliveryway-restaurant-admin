export const allergenKeys = {
  all: ["allergen-additive-templates"] as const,
  list: (params?: unknown) => ["allergen-additive-templates", params] as const,
};
