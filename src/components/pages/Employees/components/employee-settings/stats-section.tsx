"use client";

import {
  Users,
  UserCheck,
  UserX,
  BriefcaseBusiness,
} from "lucide-react";
import { cn } from "@/lib/utils";

type EmployeeRoleBreakdown = {
  staffRoleId: string;
  name: string;
  count: number;
};

type EmployeeStats = {
  totalEmployees?: number;
  activeEmployees?: number;
  inactiveEmployees?: number;
  roleBreakdown?: EmployeeRoleBreakdown[];
};

interface StatsSectionProps {
  stats?: EmployeeStats;
  loading?: boolean;
}

const StatsSection = ({ stats, loading }: StatsSectionProps) => {
  const totalEmployees = stats?.totalEmployees ?? 0;
  const activeEmployees = stats?.activeEmployees ?? 0;
  const inactiveEmployees = stats?.inactiveEmployees ?? 0;
  const totalRoles = stats?.roleBreakdown?.length ?? 0;

  const cards = [
    {
      title: "Total Employees",
      value: totalEmployees,
      icon: Users,
    },
    {
      title: "Active Employees",
      value: activeEmployees,
      icon: UserCheck,
    },
    {
      title: "Inactive Employees",
      value: inactiveEmployees,
      icon: UserX,
    },
    {
      title: "Total Roles",
      value: totalRoles,
      icon: BriefcaseBusiness,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
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