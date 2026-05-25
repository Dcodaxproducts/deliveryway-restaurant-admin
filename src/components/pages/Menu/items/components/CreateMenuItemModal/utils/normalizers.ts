export const normalizeNullableString = (value: unknown) => {
  if (typeof value !== "string") return "";
  return value.trim();
};

export const normalizeIdList = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
};
