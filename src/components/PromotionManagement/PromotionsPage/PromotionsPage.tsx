"use client";

import { useMemo, useState } from "react";
import { Tag } from "lucide-react";

import PromotionSectionHeader from "../PromotionOverview/PromotionSectionHeader";
import PromotionStatCard from "@/components/cards/PromotionStatCard";
import PromotionsTable from "./table";
import { useGetAdminPromotionCampaigns } from "@/hooks/usePromotions";
import { useAuth } from "@/hooks/useAuth";

const getListFromResponse = (response: any) => {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
};

const getMetaFromResponse = (response: any) => {
  return response?.meta ?? response?.data?.meta ?? {};
};

export default function PromotionsPage() {
  const { user, restaurantId } = useAuth();

  const branchId = user?.branchId ?? null;
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, isFetching } = useGetAdminPromotionCampaigns({
    restaurantId,
    branchId,
    page,
    limit,
  });

  const promotions = getListFromResponse(data);
  const meta = getMetaFromResponse(data);
  const loading = isLoading || isFetching;

  const stats = useMemo(() => {
    const total = meta?.total ?? promotions.length;

    const active = promotions.filter(
      (item: any) => item?.status === "ACTIVE" || item?.isActive
    ).length;

    const upcoming = promotions.filter(
      (item: any) => item?.status === "SCHEDULED"
    ).length;

    const expired = promotions.filter(
      (item: any) => item?.status === "EXPIRED"
    ).length;

    return {
      total,
      active,
      upcoming,
      expired,
    };
  }, [promotions, meta?.total]);

  return (
    <div className="mt-1 space-y-10">
      <PromotionSectionHeader
        title="Promotions"
        description="Boost Customer Loyalty with Custom Coupon Offers"
        showViewAll={false}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <PromotionStatCard
          icon={<Tag size={18} />}
          value={stats.total}
          label="Total Promotions"
          loading={loading}
        />

        <PromotionStatCard
          icon={<Tag size={18} />}
          value={stats.active}
          label="Active Promotions"
          loading={loading}
        />

        <PromotionStatCard
          icon={<Tag size={18} />}
          value={stats.upcoming}
          label="Upcoming Promotions"
          loading={loading}
        />

        <PromotionStatCard
          icon={<Tag size={18} />}
          value={stats.expired}
          label="Expired Promotions"
          loading={loading}
        />
      </div>

      <PromotionsTable
        promotions={promotions}
        loading={loading}
        meta={{
          page: meta?.page ?? page,
          limit: meta?.limit ?? limit,
          total: meta?.total ?? 0,
          totalPages: meta?.totalPages ?? 1,
          hasNext: Boolean(meta?.hasNext),
          hasPrevious: Boolean(meta?.hasPrevious),
        }}
        onPageChange={setPage}
      />
    </div>
  );
}