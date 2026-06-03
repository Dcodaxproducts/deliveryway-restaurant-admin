"use client";

import Container from "@/components/common/Container";
import Header from "@/components/common/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import LoyaltyProgramSettings from "@/components/pages/Loyalty/components/loyalty/LoyaltyProgramSettings";
import CustomerLoyaltyManager from "@/components/pages/Loyalty/components/loyalty/CustomerLoyaltyManager";
import { useTranslations } from "next-intl";

export default function LoyaltyManagementPage() {
  const { restaurantId, isBranchAdmin, loading } = useAuth();
  const t = useTranslations("loyalty");

  const normalizedRestaurantId = restaurantId ?? undefined;

  return (
    <Container>
      <Header
        title={isBranchAdmin ? t("branchPageTitle") : t("pageTitle")}
        description={
          isBranchAdmin ? t("branchPageDescription") : t("pageDescription")
        }
      />

      {!loading && !normalizedRestaurantId ? (
        <div className="mt-6 rounded-[16px] border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700">
          {t("missingRestaurant")}
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
