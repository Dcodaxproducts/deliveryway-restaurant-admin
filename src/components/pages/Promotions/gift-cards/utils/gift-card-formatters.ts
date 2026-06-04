const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

export const formatGiftCardAmount = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === "") return "—";

  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";

  return currencyFormatter.format(amount);
};

export const formatGiftCardDate = (value: string | null | undefined) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return dateTimeFormatter.format(date);
};

export const formatShortGiftCardId = (id: string | null | undefined) => {
  if (!id) return "—";
  if (id.length <= 10) return id;

  return `${id.slice(0, 8)}...`;
};

export const getGiftCardLifecycleLabel = (value: string | null | undefined) => {
  if (!value) return "Unknown";

  return value
    .split("_")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(" ");
};

export const getGiftCardStatusLabel = (value: string | null | undefined) => {
  return getGiftCardLifecycleLabel(value);
};

export const formatGiftCardUsage = ({
  usedCount,
  maxUses,
}: {
  usedCount?: number | null;
  maxUses?: number | null;
}) => {
  const used = typeof usedCount === "number" && Number.isFinite(usedCount) ? usedCount : 0;
  const limit =
    typeof maxUses === "number" && Number.isFinite(maxUses)
      ? maxUses.toLocaleString()
      : "Unlimited";

  return `${used.toLocaleString()} / ${limit}`;
};

export const formatGiftCardCustomerUsage = (value: number | null | undefined) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "Unlimited";

  return value.toLocaleString();
};

export const getGiftCardImageUrl = ({
  thumbnailUrl,
  imageUrl,
}: {
  thumbnailUrl?: string | null;
  imageUrl?: string | null;
}) => {
  return thumbnailUrl?.trim() || imageUrl?.trim() || "";
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
