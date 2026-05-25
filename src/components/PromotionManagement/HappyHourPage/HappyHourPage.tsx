"use client";

import { useMemo, useState } from "react";
import { Clock } from "lucide-react";

import PromotionSectionHeader from "../PromotionOverview/PromotionSectionHeader";
import PromotionStatCard from "@/components/cards/PromotionStatCard";
import HappyHoursTable from "./table";
import { useGetAdminHappyHours } from "@/hooks/usePromotions";
import { useAuth } from "@/hooks/useAuth";

const getListFromResponse = (response: any) => {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
};

const getMetaFromResponse = (response: any) => {
  return response?.meta ?? response?.data?.meta ?? {};
};

export default function HappyHoursPage() {
  const { user, restaurantId } = useAuth();

  const branchId = user?.branchId ?? null;
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, isFetching } = useGetAdminHappyHours({
    restaurantId,
    branchId,
    page,
    limit,
  });

  const happyHours = getListFromResponse(data);
  const meta = getMetaFromResponse(data);
  const loading = isLoading || isFetching;

  const stats = useMemo(() => {
    const total = meta?.total ?? happyHours.length;

    const active = happyHours.filter(
      (item: any) => item?.status === "ACTIVE" || item?.isActive
    ).length;

    const upcoming = happyHours.filter(
      (item: any) => item?.status === "SCHEDULED"
    ).length;

    const expired = happyHours.filter(
      (item: any) => item?.status === "EXPIRED"
    ).length;

    return {
      total,
      active,
      upcoming,
      expired,
    };
  }, [happyHours, meta?.total]);

  return (
    <div className="mt-1 space-y-10">
      <PromotionSectionHeader
        title="Happy Hours"
        description="Create time-based offers to increase sales during selected hours"
        showViewAll={false}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <PromotionStatCard
          icon={<Clock size={18} />}
          value={stats.total}
          label="Total Happy Hours"
          loading={loading}
        />

        <PromotionStatCard
          icon={<Clock size={18} />}
          value={stats.active}
          label="Active Happy Hours"
          loading={loading}
        />

        <PromotionStatCard
          icon={<Clock size={18} />}
          value={stats.upcoming}
          label="Upcoming Happy Hours"
          loading={loading}
        />

        <PromotionStatCard
          icon={<Clock size={18} />}
          value={stats.expired}
          label="Expired Happy Hours"
          loading={loading}
        />
      </div>

      <HappyHoursTable
        happyHours={happyHours}
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