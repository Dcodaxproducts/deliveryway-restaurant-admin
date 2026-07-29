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
  guestLabel: string,
) => {
  const fullName = [
    customer.profile?.firstName?.trim(),
    customer.profile?.lastName?.trim(),
  ]
    .filter(Boolean)
    .join(" ");
  const contact =
    customer.profile?.phone?.trim() || customer.email?.trim() || "";
  const identity = customer.id?.trim() ? `#${customer.id.trim()}` : "";
  const guest = customer.isGuest ? guestLabel : "";

  return [fullName || fallbackLabel, guest, contact, identity]
    .filter(Boolean)
    .join(" · ");
};
