const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

export const formatDealPrice = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === "") return "—";

  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";

  return currencyFormatter.format(amount);
};

export const formatDealDate = (value: string | null | undefined) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return dateTimeFormatter.format(date);
};

export const formatShortDealId = (id: string | null | undefined) => {
  if (!id) return "—";
  if (id.length <= 10) return id;

  return `${id.slice(0, 8)}...`;
};

export const getDealLifecycleLabel = (lifecycle: string | null | undefined) => {
  if (!lifecycle) return "Unknown";

  return lifecycle
    .split("_")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(" ");
};

export const getDealStatusVariant = (deal: { isActive: boolean; deletedAt?: string | null }) => {
  if (deal.deletedAt) return "deleted";
  return deal.isActive ? "active" : "inactive";
};

export const formatUsageLimit = (value: number | null | undefined) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "Unlimited";

  return value.toLocaleString();
};

export const toDateTimeLocalValue = (iso: string | null | undefined) => {
  if (!iso) return "";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 16);
};

export const fromDateTimeLocalValue = (value: string) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString();
};
