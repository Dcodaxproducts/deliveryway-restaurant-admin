"use client";

import {
  Bike,
  UserCheck,
  UserX,
  Wifi,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  const totalDeliverymen = stats?.totalDeliverymen ?? 0;
  const activeDeliverymen = stats?.activeDeliverymen ?? 0;
  const inactiveDeliverymen = stats?.inactiveDeliverymen ?? 0;

  const availableDeliverymen =
    stats?.statusBreakdown?.find(
      (item) => item.status?.toUpperCase() === "AVAILABLE"
    )?.count ?? 0;

  const cards = [
    {
      title: "Total Deliverymen",
      value: totalDeliverymen,
      icon: Bike,
    },
    {
      title: "Active Deliverymen",
      value: activeDeliverymen,
      icon: UserCheck,
    },
    {
      title: "Inactive Deliverymen",
      value: inactiveDeliverymen,
      icon: UserX,
    },
    {
      title: "Available Now",
      value: availableDeliverymen,
      icon: Wifi,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((stat, index) => {
        const Icon = stat.icon;

        return (
          <div
            key={index}
            className="bg-white p-6 rounded-[14px] border border-[#EDEFF2] flex items-center gap-[24px]"
          >
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center bg-gray/10 text-primary shrink-0"
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
                  <div className="h-8 w-16 rounded-md bg-gray-200 animate-pulse" />
                  <div className="h-4 w-28 rounded-md bg-gray-200 animate-pulse" />
                </>
              ) : (
                <>
                  <p className="text-[32px] font-semibold text-dark leading-none">
                    {stat.value}
                  </p>

                  <p className="text-base text-gray">
                    {stat.title}
                  </p>
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