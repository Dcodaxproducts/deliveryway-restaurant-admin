"use client";

import {
  Users,
  UserCheck,
  UserX,
  UserPlus,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  const totalCustomers = stats?.totalCustomers ?? 0;
  const activeCustomers = stats?.activeCustomers ?? 0;
  const inactiveCustomers = stats?.inactiveCustomers ?? 0;
  const newCustomersLast30Days = stats?.newCustomersLast30Days ?? 0;

  const cards = [
    {
      title: "Total Customers",
      value: totalCustomers,
      icon: Users,
      variant: "default",
      trend: {
        direction: "up" as const,
        percentage: `${totalCustomers}`,
      },
    },
    {
      title: "Active Customers",
      value: activeCustomers,
      icon: UserCheck,
      variant: "default",
      trend: {
        direction: "up" as const,
        percentage: `${activeCustomers}`,
      },
    },
    {
      title: "Inactive Customers",
      value: inactiveCustomers,
      icon: UserX,
      variant: "danger",
      trend: {
        direction: inactiveCustomers > 0 ? ("down" as const) : ("up" as const),
        percentage: `${inactiveCustomers}`,
      },
    },
    {
      title: "New Customers (30 Days)",
      value: newCustomersLast30Days,
      icon: UserPlus,
      variant: "default",
      trend: {
        direction: "up" as const,
        percentage: `${newCustomersLast30Days}`,
      },
    },
  ];

  return (
    <div
      className={cn(
        "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-[16px] sm:gap-[10px] md:gap-[24px]"
      )}
    >
      {cards.map((stat, index) => {
        const Icon = stat.icon;
        const isDanger = stat.variant === "danger";
        const isUp = stat.trend.direction === "up";

        return (
          <div
            key={index}
            className="rounded-[18px] bg-white p-[16px] shadow-none sm:p-[20px] md:p-[24px] border border-[#EDEFF2] flex gap-3"
          >
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                isDanger
                  ? "bg-primary/10 text-primary"
                  : "bg-gray-100 text-primary"
              )}
            >
              {loading ? (
                <div className="h-5 w-5 animate-pulse rounded-full bg-gray-200" />
              ) : (
                <Icon size={22} />
              )}
            </div>

            <div className="space-y-2 flex-1">
              {loading ? (
                <>
                  <div className="h-8 sm:h-10 w-16 rounded-md bg-gray-200 animate-pulse" />
                  <div className="h-4 w-28 rounded-md bg-gray-200 animate-pulse" />
                  <div className="flex items-center gap-2 pt-1">
                    <div className="h-4 w-4 rounded-full bg-gray-200 animate-pulse" />
                    <div className="h-4 w-14 rounded-md bg-gray-200 animate-pulse" />
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[24px] sm:text-[32px] font-semibold text-black leading-none">
                    {stat.value}
                  </p>

                  <p className="mt-1 text-xs sm:text-[15px] text-gray-400">
                    {stat.title}
                  </p>

                  <div
                    className={cn(
                      "flex items-center gap-1 text-sm font-medium",
                      isUp ? "text-green-600" : "text-red-600"
                    )}
                  >
                    {isUp ? (
                      <ArrowUpRight size={16} />
                    ) : (
                      <ArrowDownRight size={16} />
                    )}
                    {stat.trend.percentage}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsSection;