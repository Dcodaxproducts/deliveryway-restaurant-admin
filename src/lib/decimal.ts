export const normalizeDecimalInput = (value: string) =>
  value.trim().replace(",", ".");

export const parseLocalizedDecimal = (value: unknown, fallback = 0) => {
  const normalized =
    typeof value === "string" ? normalizeDecimalInput(value) : value;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
};
