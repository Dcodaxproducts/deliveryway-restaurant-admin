"use client";

import StatGrid from "@/components/common/stats-section";
import type { StatItem } from "@/types/stats";
import { useTranslations } from "next-intl";

type CustomerStats = {
  totalCustomers?: number;
  activeCustomers?: number;
  inactiveCustomers?: number;
  newCustomersLast30Days?: number;
};

interface StatsSectionProps {
  stats?: CustomerStats;
  loading?: boolean;
}

const StatsSection = ({ stats, loading }: StatsSectionProps) => {
  const t = useTranslations("customers.stats");
  const totalCustomers = stats?.totalCustomers ?? 0;
  const activeCustomers = stats?.activeCustomers ?? 0;
  const inactiveCustomers = stats?.inactiveCustomers ?? 0;
  const newCustomersLast30Days = stats?.newCustomersLast30Days ?? 0;

  const cards: StatItem[] = [
    {
      _id: "total-customers",
      title: t("totalCustomers"),
      value: totalCustomers,
      icon: "users",
      iconStyle: "default",
      trend: {
        direction: "up" as const,
        percentage: `${totalCustomers}`,
      },
    },
    {
      _id: "active-customers",
      title: t("activeCustomers"),
      value: activeCustomers,
      icon: "completed",
      iconStyle: "default",
      trend: {
        direction: "up" as const,
        percentage: `${activeCustomers}`,
      },
    },
    {
      _id: "inactive-customers",
      title: t("inactiveCustomers"),
      value: inactiveCustomers,
      icon: "cancelled",
      iconStyle: "danger",
      trend: {
        direction: inactiveCustomers > 0 ? ("down" as const) : ("up" as const),
        percentage: `${inactiveCustomers}`,
      },
    },
    {
      _id: "new-customers",
      title: t("newCustomersLast30Days"),
      value: newCustomersLast30Days,
      icon: "users",
      iconStyle: "default",
      trend: {
        direction: "up" as const,
        percentage: `${newCustomersLast30Days}`,
      },
    },
  ];

  return <StatGrid stats={cards} loading={loading} columns={4} />;
};

export default StatsSection;
