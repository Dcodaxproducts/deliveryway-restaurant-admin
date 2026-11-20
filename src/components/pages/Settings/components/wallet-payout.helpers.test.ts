import { describe, expect, it } from "vitest";

import type { RestaurantWallet } from "@/services/restaurant-payment-management";
import {
  getCarryForwardAmount,
  getCurrentPeriodNetContribution,
  getDirectCollectedAmount,
  getWalletReconciliation,
} from "./wallet-payout.helpers";

const wallet = (
  overrides: Partial<RestaurantWallet> = {},
): RestaurantWallet => ({
  type: "RESTAURANT_WALLET",
  balance: 800,
  ledgerBalance: 900,
  currentPeriodNetContributionAmount: null,
  carryForwardAvailableAmount: null,
  totalOrderAmount: 1_500,
  platformCollectedAmount: 1_000,
  grossCollectedAmount: 1_000,
  commissionLiabilityAmount: 100,
  restaurantTransactionFeeAmount: 20,
  vatPercentage: 19,
  vatAmount: 22.8,
  billingMonth: "2026-11",
  billingPeriod: null,
  monthlyFeeAmount: 159,
  configuredMonthlyFeeAmount: 159,
  monthlyFeeScheduledToDate: 80,
  monthlyFeeDeductedBefore: 0,
  monthlyFeeDeductedAmount: 40,
  monthlyFeeVatAmount: 0,
  monthlyFeeDeductedThisMonth: 40,
  monthlyFeeDueNextPayoutAmount: 40,
  monthlyFeeOutstandingAmount: 79,
  previousPayoutAmount: 0,
  totalDeductionsAmount: 182.8,
  availablePayoutBalance: 1_200,
  payoutCycle: "WEEKLY",
  nextPayoutAt: null,
  automaticPayout: null,
  currency: "EUR",
  customerWalletExposure: null,
  activePlan: null,
  ...overrides,
});

describe("wallet payout presentation helpers", () => {
  it("separates direct/COD receipts from platform-held money", () => {
    expect(getDirectCollectedAmount(wallet())).toBe(500);
  });

  it("uses contract values without recalculating them", () => {
    expect(
      getCurrentPeriodNetContribution(
        wallet({ currentPeriodNetContributionAmount: 777 }),
      ),
    ).toEqual({ amount: 777, derived: false });
    expect(
      getCarryForwardAmount(wallet({ carryForwardAvailableAmount: 333 })),
    ).toEqual({
      amount: 333,
      derived: false,
    });
  });

  it("derives an explicitly marked fallback only when every formula input exists", () => {
    const current = getCurrentPeriodNetContribution(wallet());
    expect(current.amount).toBeCloseTo(817.2);
    expect(current.derived).toBe(true);
    expect(getCarryForwardAmount(wallet()).derived).toBe(true);
  });

  it("returns honest unavailable values when older contracts omit formula inputs", () => {
    const legacy = wallet({ vatAmount: null, ledgerBalance: null });
    expect(getCurrentPeriodNetContribution(legacy)).toEqual({
      amount: null,
      derived: false,
    });
    expect(getWalletReconciliation(legacy).ledger).toBeNull();
  });
});
