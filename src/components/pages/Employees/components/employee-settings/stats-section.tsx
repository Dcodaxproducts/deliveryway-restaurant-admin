"use client";

import { Users, UserCheck, UserX, BriefcaseBusiness } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

type EmployeeRoleBreakdown = {
  staffRoleId: string | null;
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
  const t = useTranslations("employees");
  const totalEmployees = stats?.totalEmployees ?? 0;
  const activeEmployees = stats?.activeEmployees ?? 0;
  const inactiveEmployees = stats?.inactiveEmployees ?? 0;
  const totalRoles = stats?.roleBreakdown?.length ?? 0;
  const roleBreakdown = stats?.roleBreakdown ?? [];

  const cards = [
    {
      title: t("stats.totalEmployees"),
      value: totalEmployees,
      icon: Users,
    },
    {
      title: t("stats.activeEmployees"),
      value: activeEmployees,
      icon: UserCheck,
    },
    {
      title: t("stats.inactiveEmployees"),
      value: inactiveEmployees,
      icon: UserX,
    },
    {
      title: t("stats.totalRoles"),
      value: totalRoles,
      icon: BriefcaseBusiness,
    },
  ];

  return (
    <div className="space-y-6">
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
                  "w-12 h-12 rounded-full flex items-center justify-center bg-gray/10 text-primary shrink-0",
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

                    <p className="text-base text-gray">{stat.title}</p>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-[14px] border border-[#EDEFF2] bg-white p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-dark">{t("stats.roleBreakdown")}</h3>
            <p className="text-sm text-gray">{t("stats.roleBreakdownDescription")}</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-10 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : roleBreakdown.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#EDEFF2] text-gray">
                  <th className="py-3 font-medium">{t("table.role")}</th>
                  <th className="py-3 text-right font-medium">{t("stats.employeeCount")}</th>
                </tr>
              </thead>
              <tbody>
                {roleBreakdown.map((role) => (
                  <tr key={role.staffRoleId || role.name} className="border-b border-[#F3F4F6] last:border-0">
                    <td className="py-3 font-medium text-dark">{role.name || t("stats.unassigned")}</td>
                    <td className="py-3 text-right text-gray">{role.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray">{t("stats.noRoleBreakdown")}</p>
        )}
      </div>
    </div>
  );
};

export default StatsSection;
