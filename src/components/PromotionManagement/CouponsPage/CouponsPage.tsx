"use client";

import { Tag } from "lucide-react";
import PromotionSectionHeader from "../PromotionOverview/PromotionSectionHeader";
import PromotionStatCard from "@/components/cards/PromotionStatCard";
import CouponsTable from "./table";

export default function CouponsPage() {
  return (
    <div className="mt-1 space-y-10">
      {/* ================= HEADER ================= */}
      <PromotionSectionHeader
        title="Coupons"
        description="Boost Customer Loyalty with Custom Coupon Offers"
        showViewAll={false}
      />

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <PromotionStatCard
          icon={<Tag size={18} />}
          value="10"
          label="Total Coupons"
        />

        <PromotionStatCard
          icon={<Tag size={18} />}
          value="3"
          label="Active Coupon"
        />

        <PromotionStatCard
          icon={<Tag size={18} />}
          value="6"
          label="Upcoming Coupons"
        />

        <PromotionStatCard
          icon={<Tag size={18} />}
          value="6"
          label="Expired Coupons"
        />
      </div>

     <CouponsTable />


    </div>
  );
}
