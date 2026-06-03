"use client";

import { Tag } from "lucide-react";
import PromotionSectionHeader from "../PromotionOverview/PromotionSectionHeader";
import PromotionStatCard from "@/components/cards/PromotionStatCard";
import CouponsTable from "./table";
import { useTranslations } from "next-intl";

export default function CouponsPage() {
  const t = useTranslations("promotions");

  return (
    <div className="mt-1 space-y-10">
      <PromotionSectionHeader
        title={t("coupons")}
        description={t("description")}
        showViewAll={false}
        actionLabel={t("addCoupon")}
        actionHref="/promotion-management/coupons/add"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <PromotionStatCard
          icon={<Tag size={18} />}
          value="10"
          label={t("totalCoupons")}
        />

        <PromotionStatCard
          icon={<Tag size={18} />}
          value="3"
          label={t("activeCoupon")}
        />

        <PromotionStatCard
          icon={<Tag size={18} />}
          value="6"
          label={t("upcomingCoupons")}
        />

        <PromotionStatCard
          icon={<Tag size={18} />}
          value="6"
          label={t("expiredCoupons")}
        />
      </div>

     <CouponsTable />


    </div>
  );
}
