import type { RestaurantWallet } from "@/services/restaurant-payment-management";

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
): { amount: WalletValue; derived: boolean } => {
  if (
    wallet?.currentPeriodNetContributionAmount !== null &&
    wallet?.currentPeriodNetContributionAmount !== undefined
  ) {
    return {
      amount: wallet.currentPeriodNetContributionAmount,
      derived: false,
    };
  }

  const platformHeld =
    wallet?.platformCollectedAmount ?? wallet?.grossCollectedAmount;
  const deductions = [
    wallet?.commissionLiabilityAmount,
    wallet?.restaurantTransactionFeeAmount,
    wallet?.vatAmount,
    wallet?.monthlyFeeDeductedThisMonth ?? wallet?.monthlyFeeDeductedAmount,
  ];

  if (
    platformHeld === null ||
    platformHeld === undefined ||
    deductions.some((value) => value === null || value === undefined)
  ) {
    return { amount: null, derived: false };
  }

  return {
    amount:
      platformHeld -
      deductions.reduce<number>((total, value) => total + Number(value), 0),
    derived: true,
  };
};

export const getCarryForwardAmount = (
  wallet?: RestaurantWallet,
): { amount: WalletValue; derived: boolean } => {
  if (
    wallet?.carryForwardAvailableAmount !== null &&
    wallet?.carryForwardAvailableAmount !== undefined
  ) {
    return { amount: wallet.carryForwardAvailableAmount, derived: false };
  }

  const current = getCurrentPeriodNetContribution(wallet).amount;
  if (
    wallet?.availablePayoutBalance === null ||
    wallet?.availablePayoutBalance === undefined ||
    current === null
  ) {
    return { amount: null, derived: false };
  }

  return {
    amount: wallet.availablePayoutBalance - current,
    derived: true,
  };
};

export const getWalletReconciliation = (wallet?: RestaurantWallet) => ({
  available: wallet?.availablePayoutBalance ?? null,
  ledger: wallet?.ledgerBalance ?? null,
  carryForward: getCarryForwardAmount(wallet),
  currentPeriod: getCurrentPeriodNetContribution(wallet),
});
