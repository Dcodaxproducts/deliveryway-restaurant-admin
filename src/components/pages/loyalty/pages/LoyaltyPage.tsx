"use client";

import Container from "@/components/container";
import Header from "@/components/header";
import { useAuth } from "@/hooks/useAuth";
import LoyaltyProgramSettings from "@/components/loyalty/LoyaltyProgramSettings";
import CustomerLoyaltyManager from "@/components/loyalty/CustomerLoyaltyManager";

export default function LoyaltyManagementPage() {
  const { restaurantId, branchId, isBranchAdmin, loading } = useAuth();

  const normalizedRestaurantId = restaurantId ?? undefined;

  return (
    <Container>
      <Header
        title={isBranchAdmin ? "Branch Loyalty" : "Loyalty Management"}
        description={
          isBranchAdmin
            ? "View loyalty settings and customers for your assigned branch."
            : "Configure loyalty rules, point redemption, and manually adjust customer points."
        }
      />

      {!loading && !normalizedRestaurantId ? (
        <div className="mt-6 rounded-[16px] border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700">
          Restaurant context is missing. Loyalty settings require a restaurant
          ID.
        </div>
      ) : null}

      <div className="mt-6 space-y-6">
        <LoyaltyProgramSettings
          restaurantId={normalizedRestaurantId}
          readOnly={isBranchAdmin}
        />

        <CustomerLoyaltyManager />
      </div>
    </Container>
  );
}