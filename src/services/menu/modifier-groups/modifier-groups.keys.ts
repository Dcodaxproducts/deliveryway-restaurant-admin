export const modifierGroupKeys = {
  all: ["modifier-groups"] as const,
  list: (params?: unknown) => ["modifier-groups", params] as const,
  detail: (id?: string) => ["modifier-groups", "detail", id] as const,
};
