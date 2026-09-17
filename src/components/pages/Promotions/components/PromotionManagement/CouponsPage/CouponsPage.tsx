"use client";

import PromotionSectionHeader from "../PromotionOverview/PromotionSectionHeader";
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

      <CouponsTable />
    </div>
  );
}
