export const parseWinOrderStoreId = (value: string): number | null => {
  const normalized = value.trim();
  if (!normalized) return null;

  const storeId = Number(normalized);
  return Number.isInteger(storeId) && storeId >= 0 ? storeId : null;
};
