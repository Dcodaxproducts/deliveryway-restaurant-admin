export const labelKeys = {
  all: ["menu-item-labels"] as const,
  list: (params?: unknown) => ["menu-item-labels", params] as const,
};
