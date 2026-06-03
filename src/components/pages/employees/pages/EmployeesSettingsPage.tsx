"use client";

import { useState } from "react";
import Container from "@/components/common/Container";
import StatsSection from "@/components/pages/Employees/components/employee-settings/stats-section";
import EmployeeTable from "@/components/pages/Employees/components/employee-settings/table";
import Header from "@/components/pages/Employees/components/employee-settings/header";
import BranchFilters from "@/components/pages/Branches/components/BranchFilters";
import { Button } from "@/components/ui/button";
import RolesTable from "@/components/pages/Employees/components/employee-settings/RolesTable";
import { useAuth } from "@/hooks/useAuth";
import { useGetEmployeesStats } from "@/hooks/useDashboard";
import { useTranslations } from "next-intl";

const EmployeesSettingsPage = () => {
  const { restaurantId, branchId, isBranchAdmin } = useAuth();
  const t = useTranslations("employees");
  const scopedBranchId = isBranchAdmin ? branchId : undefined;

  const [activeTab, setActiveTab] = useState<"employees" | "roles">(
    "employees",
  );
  const [refreshEmployees, setRefreshEmployees] = useState(false);
  const [refreshRoles, setRefreshRoles] = useState(false);

  const {
    data: employeeStatsResponse,
    isLoading: isEmployeeStatsLoading,
    isFetching: isEmployeeStatsFetching,
    refetch: refetchEmployeeStats,
  } = useGetEmployeesStats(
    restaurantId
      ? {
          restaurantId,
          ...(scopedBranchId ? { branchId: scopedBranchId } : {}),
        }
      : undefined,
  );

  const employeeStats = employeeStatsResponse?.data;

  const triggerEmployeesRefresh = () => {
    setRefreshEmployees((prev) => !prev);
    refetchEmployeeStats();
  };

  const triggerRolesRefresh = () => {
    setRefreshRoles((prev) => !prev);
    refetchEmployeeStats();
  };

  return (
    <Container>
      <Header
        title={isBranchAdmin ? t("branchTitle") : t("listTitle")}
        description={
          isBranchAdmin ? t("branchDescription") : t("listDescription")
        }
        onEmployeeSuccess={triggerEmployeesRefresh}
        onRoleSuccess={triggerRolesRefresh}
      />

      <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm space-y-6">
        <StatsSection
          stats={employeeStats}
          loading={isEmployeeStatsLoading || isEmployeeStatsFetching}
        />

        {!isBranchAdmin ? (
          <BranchFilters filters={{}} onFilterChange={() => undefined} />
        ) : null}

        {/* Tabs */}
        <div className="flex gap-3 flex-wrap">
          {[
            { key: "employees", label: t("employees") },
            { key: "roles", label: t("roles") },
          ].map((tab) => {
            const isActive = activeTab === tab.key;

            return (
              <Button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as "employees" | "roles")}
                className={`
                  h-[42px] px-5 rounded-[12px] text-[14px] font-medium transition-all
                  ${
                    isActive
                      ? "bg-primary text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }
                `}
              >
                {tab.label}
              </Button>
            );
          })}
        </div>

        {/* Content */}
        {activeTab === "employees" && (
          <EmployeeTable
            refreshFlag={refreshEmployees}
            restaurantId={
              isBranchAdmin ? undefined : (restaurantId ?? undefined)
            }
            branchId={isBranchAdmin ? undefined : scopedBranchId}
            onSuccess={triggerEmployeesRefresh}
          />
        )}

        {activeTab === "roles" && (
          <RolesTable
            refreshFlag={refreshRoles}
            restaurantId={
              isBranchAdmin ? undefined : (restaurantId ?? undefined)
            }
            branchId={isBranchAdmin ? undefined : scopedBranchId}
            onSuccess={triggerRolesRefresh}
          />
        )}
      </div>
    </Container>
  );
};

export default EmployeesSettingsPage;
