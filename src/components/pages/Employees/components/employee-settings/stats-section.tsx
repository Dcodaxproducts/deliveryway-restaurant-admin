"use client";

import StatGrid from "@/components/common/stats-section";
import type { StatItem } from "@/types/stats";
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
  totalRoles?: number;
  roleBreakdown?: EmployeeRoleBreakdown[];
};

interface StatsSectionProps {
  stats?: EmployeeStats;
  loading?: boolean;
  showRoleBreakdown?: boolean;
}

const StatsSection = ({
  stats,
  loading,
  showRoleBreakdown = false,
}: StatsSectionProps) => {
  const t = useTranslations("employees");
  const totalEmployees = stats?.totalEmployees ?? 0;
  const activeEmployees = stats?.activeEmployees ?? 0;
  const inactiveEmployees = stats?.inactiveEmployees ?? 0;
  const totalRoles = stats?.totalRoles ?? stats?.roleBreakdown?.length ?? 0;
  const roleBreakdown = stats?.roleBreakdown ?? [];

  const cards: StatItem[] = [
    {
      _id: "total-employees",
      title: t("stats.totalEmployees"),
      value: totalEmployees,
      icon: "users",
      iconStyle: "default",
    },
    {
      _id: "active-employees",
      title: t("stats.activeEmployees"),
      value: activeEmployees,
      icon: "completed",
      iconStyle: "default",
    },
    {
      _id: "inactive-employees",
      title: t("stats.inactiveEmployees"),
      value: inactiveEmployees,
      icon: "cancelled",
      iconStyle: "danger",
    },
    {
      _id: "total-roles",
      title: t("stats.totalRoles"),
      value: totalRoles,
      icon: "store",
      iconStyle: "default",
    },
  ];

  return (
    <div className="space-y-6">
      <StatGrid stats={cards} loading={loading} columns={4} />

      {showRoleBreakdown && roleBreakdown.length > 0 ? (
        <div className="rounded-[var(--ui-radius-card)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-dark">
                {t("stats.roleBreakdown")}
              </h3>
              <p className="text-sm text-gray">
                {t("stats.roleBreakdownDescription")}
              </p>
            </div>
          </div>

          {loading ? null : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#EDEFF2] text-gray">
                    <th className="py-3 font-medium">{t("table.role")}</th>
                    <th className="py-3 text-right font-medium">
                      {t("stats.employeeCount")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {roleBreakdown.map((role) => (
                    <tr
                      key={role.staffRoleId || role.name}
                      className="border-b border-[#F3F4F6] last:border-0"
                    >
                      <td className="py-3 font-medium text-dark">
                        {role.name || t("stats.unassigned")}
                      </td>
                      <td className="py-3 text-right text-gray">
                        {role.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default StatsSection;
