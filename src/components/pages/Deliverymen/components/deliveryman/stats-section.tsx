"use client";

import StatGrid from "@/components/common/stats-section";
import type { StatItem } from "@/types/stats";
import { useTranslations } from "next-intl";

type DeliverymanStatusBreakdown = {
  status: string;
  count: number;
};

type DeliverymanStats = {
  totalDeliverymen?: number;
  activeDeliverymen?: number;
  inactiveDeliverymen?: number;
  statusBreakdown?: DeliverymanStatusBreakdown[];
};

interface StatsSectionProps {
  stats?: DeliverymanStats;
  loading?: boolean;
}

const StatsSection = ({ stats, loading }: StatsSectionProps) => {
  const t = useTranslations("deliverymen");
  const totalDeliverymen = stats?.totalDeliverymen ?? 0;
  const activeDeliverymen = stats?.activeDeliverymen ?? 0;
  const inactiveDeliverymen = stats?.inactiveDeliverymen ?? 0;

  const availableDeliverymen =
    stats?.statusBreakdown?.find(
      (item) => item.status?.toUpperCase() === "AVAILABLE",
    )?.count ?? 0;

  const cards: StatItem[] = [
    {
      _id: "total-deliverymen",
      title: t("stats.totalDeliverymen"),
      value: totalDeliverymen,
      icon: "users",
      iconStyle: "default",
    },
    {
      _id: "active-deliverymen",
      title: t("stats.activeDeliverymen"),
      value: activeDeliverymen,
      icon: "completed",
      iconStyle: "default",
    },
    {
      _id: "inactive-deliverymen",
      title: t("stats.inactiveDeliverymen"),
      value: inactiveDeliverymen,
      icon: "cancelled",
      iconStyle: "danger",
    },
    {
      _id: "available-deliverymen",
      title: t("stats.availableNow"),
      value: availableDeliverymen,
      icon: "ongoing",
      iconStyle: "default",
    },
  ];

  return <StatGrid stats={cards} loading={loading} />;
};

export default StatsSection;
