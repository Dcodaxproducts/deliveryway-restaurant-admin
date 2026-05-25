export const modifierKeys = {
  all: ["modifiers"] as const,
  list: (params?: unknown) => ["modifiers", params] as const,
  detail: (id?: string) => ["modifiers", "detail", id] as const,
};
