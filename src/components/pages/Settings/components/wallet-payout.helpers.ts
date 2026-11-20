import type {
  RestaurantPayoutProviderConfiguration,
  RestaurantWallet,
} from "@/services/restaurant-payment-management";

export type WalletValue = number | null;

export const getDirectCollectedAmount = (
  wallet?: RestaurantWallet,
): WalletValue => {
  if (
    wallet?.totalOrderAmount === null ||
    wallet?.totalOrderAmount === undefined
  ) {
    return null;
  }

  const platformHeld =
    wallet.platformCollectedAmount ?? wallet.grossCollectedAmount;
  if (platformHeld === null || platformHeld === undefined) return null;

  return wallet.totalOrderAmount - platformHeld;
};

export const getCurrentPeriodNetContribution = (
  wallet?: RestaurantWallet,
): { amount: WalletValue; derived: boolean } => ({
  amount: wallet?.currentPeriodNetContributionAmount ?? null,
  derived: false,
});

export const getCarryForwardAmount = (
  wallet?: RestaurantWallet,
): { amount: WalletValue; derived: boolean } => ({
  amount: wallet?.carryForwardAvailableAmount ?? null,
  derived: false,
});

export const getWalletReconciliation = (wallet?: RestaurantWallet) => ({
  available: wallet?.availablePayoutBalance ?? null,
  ledger: wallet?.ledgerBalance ?? null,
  carryForward: getCarryForwardAmount(wallet),
  currentPeriod: getCurrentPeriodNetContribution(wallet),
});

export const getApprovedPayoutProviders = (
  configurations: RestaurantPayoutProviderConfiguration[] = [],
) =>
  configurations.filter(
    (configuration) =>
      Boolean(configuration.approvedAt) || configuration.enabled,
  );
