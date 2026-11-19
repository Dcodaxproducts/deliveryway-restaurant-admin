export type OrderDealNameSource = {
  dealId?: string | null;
  dealName?: string | null;
  packageId?: string | null;
  packageName?: string | null;
  name?: string | null;
  menuItemName?: string | null;
};

const clean = (value?: string | null) => value?.trim() || undefined;

export const resolveOrderDealDisplayName = (
  item: OrderDealNameSource,
  fallbackLabel = "Deal",
) => {
  const resolvedName =
    clean(item.dealName) ??
    clean(item.packageName) ??
    clean(item.name) ??
    clean(item.menuItemName);
  if (resolvedName) return resolvedName;

  const dealId = clean(item.dealId);
  if (dealId) return `${fallbackLabel} ${dealId}`;

  const packageId = clean(item.packageId);
  if (packageId) return `${fallbackLabel} ${packageId}`;

  return fallbackLabel;
};
