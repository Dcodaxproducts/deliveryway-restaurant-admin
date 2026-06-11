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

export const getDealTypeLabel = (deal: {
  dealSelectionMode?: string | null;
  scopeCategoryIds?: string[];
  scopeCategories?: unknown[];
}) => {
  if (deal.dealSelectionMode === "FLEXIBLE_ITEMS") {
    const categoryCount =
      (deal.scopeCategoryIds?.length ?? 0) + (deal.scopeCategories?.length ?? 0);

    return categoryCount > 0 ? "Flexible Any-N Categories" : "Flexible Any-N Items";
  }

  return "Fixed Items";
};

export const getDealSelectedCountLabel = (deal: {
  scopeMenuItemIds?: string[];
  scopeCategoryIds?: string[];
}) => {
  const categoryCount = deal.scopeCategoryIds?.length ?? 0;
  if (categoryCount > 0) {
    return `${categoryCount.toLocaleString()} ${
      categoryCount === 1 ? "category" : "categories"
    }`;
  }

  const itemCount = deal.scopeMenuItemIds?.length ?? 0;
  return `${itemCount.toLocaleString()} ${itemCount === 1 ? "item" : "items"}`;
};

export const getDealRequiredQuantityLabel = (deal: {
  dealSelectionMode?: string | null;
  dealRequiredQuantity?: number | null;
}) => {
  if (deal.dealSelectionMode !== "FLEXIBLE_ITEMS") return "—";

  return typeof deal.dealRequiredQuantity === "number"
    ? deal.dealRequiredQuantity.toLocaleString()
    : "—";
};

export const getDealStatusVariant = (deal: { isActive: boolean; deletedAt?: string | null }) => {
  if (deal.deletedAt) return "deleted";
  return deal.isActive ? "active" : "inactive";
};

export const formatUsageLimit = (
  value: number | null | undefined,
  unlimitedLabel = "Unlimited"
) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return unlimitedLabel;

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

const DEFAULT_START_TOLERANCE_MS = 2 * 60 * 1000;
const CURRENT_START_TOLERANCE_MS = 60 * 1000;

export const toDealStartsAtInputValue = (deal: {
  startsAt?: string | null;
  expiresAt?: string | null;
  createdAt?: string | null;
}, now = new Date()) => {
  if (!deal.startsAt) return "";

  const startsAt = new Date(deal.startsAt);
  if (Number.isNaN(startsAt.getTime())) return "";

  const createdAt = deal.createdAt ? new Date(deal.createdAt) : null;
  const expiresAt = deal.expiresAt ? new Date(deal.expiresAt) : null;
  const hasValidExpiry = expiresAt !== null && !Number.isNaN(expiresAt.getTime());
  const isBackendDefaultStart =
    !hasValidExpiry &&
    createdAt !== null &&
    !Number.isNaN(createdAt.getTime()) &&
    Math.abs(startsAt.getTime() - createdAt.getTime()) <= DEFAULT_START_TOLERANCE_MS;
  const isCurrentOrPastStartWithoutExpiry =
    !hasValidExpiry &&
    startsAt.getTime() <= now.getTime() + CURRENT_START_TOLERANCE_MS;

  if (isBackendDefaultStart || isCurrentOrPastStartWithoutExpiry) return "";

  return toDateTimeLocalValue(deal.startsAt);
};

export const fromDateTimeLocalValue = (value?: string | null) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString();
};
