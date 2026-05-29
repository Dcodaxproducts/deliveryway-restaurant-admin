"use client";

import { Tag, Percent, ShoppingCart } from "lucide-react";

import PromotionSectionHeader from "./PromotionSectionHeader";
import PromotionCreateLink from "./PromotionCreateLink";
import HappyHourInfoCard from "./HappyHourInfoCard";
import PromotionStatCard from "@/components/cards/PromotionStatCard";
import {
  useGetAdminHappyHours,
  useGetAdminPromotionsOverview,
} from "@/hooks/usePromotions";
import { useAuth } from "@/hooks/useAuth";

type PromotionTabValue = "overview" | "coupons" | "promotions" | "happy-hours";

type PromotionsOverviewProps = {
  onViewAll?: (tab: PromotionTabValue) => void;
};

type PromotionsOverviewData = {
  activePromotions?: number;
  scheduledPromotions?: number;
  expiredPromotions?: number;
  promoDrivenOrders?: number;
  promoDrivenRevenue?: number;
  activeHappyHours?: number;

  totalCoupons?: number;
  activeCoupons?: number;
  scheduledCoupons?: number;
  expiredCoupons?: number;
  couponRedemptions?: number;
  couponDrivenOrders?: number;
  couponDrivenRevenue?: number;
  couponDiscountGiven?: number;

  filters?: {
    restaurantId?: string | null;
    branchId?: string | null;
  };
};

const formatCurrency = (value?: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
};

const getListFromResponse = (response: any) => {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(response?.items)) return response.items;

  return [];
};

export default function PromotionsOverview({ onViewAll }: PromotionsOverviewProps) {
  const { user } = useAuth();

  const restaurantId = user?.restaurantId ?? user?.tenantId ?? null;
  const branchId = user?.branchId ?? null;

  const {
    data: overviewResponse,
    isLoading: overviewLoading,
    isFetching: overviewFetching,
  } = useGetAdminPromotionsOverview({
    restaurantId,
    branchId,
  });

  const {
    data: happyHoursResponse,
    isLoading: happyHoursLoading,
    isFetching: happyHoursFetching,
  } = useGetAdminHappyHours({
    restaurantId,
    branchId,
    limit: 1,
  });

  const overview: PromotionsOverviewData = overviewResponse?.data ?? {};

  const happyHours = getListFromResponse(happyHoursResponse);
  const activeHappyHour = happyHours?.[0] ?? null;

  const overviewCardLoading = overviewLoading || overviewFetching;
  const happyHourLoading = happyHoursLoading || happyHoursFetching;

  const totalPromotions =
    Number(overview.activePromotions ?? 0) +
    Number(overview.scheduledPromotions ?? 0) +
    Number(overview.expiredPromotions ?? 0);

  return (
    <div className="mt-1 space-y-14">
      <PromotionSectionHeader
        title="Coupons"
        viewAllTab="coupons"
        onViewAll={onViewAll}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <PromotionStatCard
          icon={<Tag size={18} />}
          value={overview.totalCoupons ?? 0}
          label="Total Coupons"
          loading={overviewCardLoading}
        />

        <PromotionStatCard
          icon={<Tag size={18} />}
          value={overview.activeCoupons ?? 0}
          label="Active Coupons"
          loading={overviewCardLoading}
        />

        <PromotionStatCard
          icon={<Tag size={18} />}
          value={overview.scheduledCoupons ?? 0}
          label="Upcoming Coupons"
          loading={overviewCardLoading}
        />
      </div>

      <PromotionCreateLink
        label="Create New Coupon"
        href="/promotion-management/coupons/add"
      />

      <PromotionSectionHeader
        title="Promotions"
        viewAllTab="promotions"
        onViewAll={onViewAll}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <PromotionStatCard
          icon={<Percent size={18} />}
          value={totalPromotions}
          label="Total Promotions"
          loading={overviewCardLoading}
        />

        <PromotionStatCard
          icon={<Percent size={18} />}
          value={overview.activePromotions ?? 0}
          label="Ongoing Promotions"
          loading={overviewCardLoading}
        />

        <PromotionStatCard
          icon={<Percent size={18} />}
          value={overview.scheduledPromotions ?? 0}
          label="Upcoming Promotions"
          loading={overviewCardLoading}
        />
      </div>

      <PromotionCreateLink
        label="Create New Promotion"
        href="/promotion-management/promotions/add"
      />

      <PromotionSectionHeader
        title="Happy Hours"
        viewAllTab="happy-hours"
        onViewAll={onViewAll}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[63%_35%]">
        <HappyHourInfoCard
          happyHour={activeHappyHour}
          loading={happyHourLoading}
        />

        <PromotionStatCard
          icon={<ShoppingCart size={18} />}
          value={formatCurrency(overview.promoDrivenRevenue)}
          label="Promo Driven Revenue"
          loading={overviewCardLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <PromotionStatCard
          icon={<ShoppingCart size={18} />}
          value={overview.activeHappyHours ?? 0}
          label="Active Happy Hours"
          loading={overviewCardLoading}
        />

        <PromotionStatCard
          icon={<ShoppingCart size={18} />}
          value={overview.promoDrivenOrders ?? 0}
          label="Promo Driven Orders"
          loading={overviewCardLoading}
        />

        <PromotionStatCard
          icon={<ShoppingCart size={18} />}
          value={overview.couponRedemptions ?? 0}
          label="Coupon Redemptions"
          loading={overviewCardLoading}
        />
      </div>

      <PromotionCreateLink
        label="Create Happy Hour"
        href="/promotion-management/happy-hour/add"
      />
    </div>
  );
}
