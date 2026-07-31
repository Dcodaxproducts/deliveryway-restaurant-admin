type PosBranchOption = {
  id?: string | null;
  isMain?: boolean | null;
};

type PosCustomerOption = {
  id?: string | null;
  email?: string | null;
  isGuest?: boolean | null;
  profile?: {
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    avatarUrl?: string | null;
  } | null;
};

export const resolvePosBranchSelection = <T extends PosBranchOption>(
  branches: T[],
  selectedId?: string | null,
) => {
  const selected = selectedId
    ? branches.find((branch) => branch.id === selectedId)
    : undefined;

  return selected ?? branches.find((branch) => branch.isMain === true) ?? branches[0] ?? null;
};

export const getPosCustomerOptionLabel = (
  customer: PosCustomerOption,
  fallbackLabel: string,
) => {
  const fullName = [
    customer.profile?.firstName?.trim(),
    customer.profile?.lastName?.trim(),
  ]
    .filter(Boolean)
    .join(" ");

  return fullName || customer.email?.trim() || fallbackLabel;
};

export const getPosCustomerDisplayId = (customerId?: string | null) => {
  const normalizedId = customerId?.trim();

  return normalizedId ? normalizedId.slice(-8).toUpperCase() : "";
};

export const filterRegisteredPosCustomers = <
  T extends PosCustomerOption,
>(
  customers: T[],
) => customers.filter((customer) => customer.isGuest !== true);
