"use client";

import { useState } from "react";
import Container from "@/components/common/Container";
import StatsSection from "@/components/pages/Employees/components/employee-settings/stats-section";
import EmployeeTable from "@/components/pages/Employees/components/employee-settings/table";
import Header from "@/components/pages/Employees/components/employee-settings/header";
import { Button } from "@/components/ui/button";
import RolesTable from "@/components/pages/Employees/components/employee-settings/RolesTable";
import { useAuth } from "@/hooks/useAuth";
import { useGetBranches } from "@/hooks/useBranches";
import { useGetEmployeesStats } from "@/hooks/useDashboard";
import { useTranslations } from "next-intl";

type BranchOption = {
  id: string;
  name?: string;
  branchName?: string;
};

const getBranchOptions = (response: unknown): BranchOption[] => {
  if (Array.isArray(response)) return response as BranchOption[];
  if (!response || typeof response !== "object") return [];

  const record = response as { data?: unknown; items?: unknown };
  if (Array.isArray(record.data)) return record.data as BranchOption[];
  if (Array.isArray(record.items)) return record.items as BranchOption[];

  if (record.data && typeof record.data === "object") {
    const dataRecord = record.data as { data?: unknown; items?: unknown };
    if (Array.isArray(dataRecord.data)) return dataRecord.data as BranchOption[];
    if (Array.isArray(dataRecord.items)) return dataRecord.items as BranchOption[];
  }

  return [];
};

const EmployeesSettingsPage = () => {
  const { branchId, isBranchAdmin } = useAuth();
  const t = useTranslations("employees");
  const scopedBranchId = isBranchAdmin ? branchId : undefined;
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const activeBranchId = scopedBranchId || selectedBranchId || undefined;
  const { data: branchesResponse, isLoading: branchesLoading } = useGetBranches(
    isBranchAdmin ? undefined : { includeInactive: false },
  );
  const branchOptions = getBranchOptions(branchesResponse);

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
    activeBranchId ? { branchId: activeBranchId } : undefined,
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
          <div className="flex flex-col gap-2 sm:max-w-sm">
            <label className="text-sm font-medium text-dark" htmlFor="employee-branch-filter">
              {t("branchFilter")}
            </label>
            <select
              id="employee-branch-filter"
              value={selectedBranchId}
              onChange={(event) => setSelectedBranchId(event.target.value)}
              disabled={branchesLoading}
              className="h-11 rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm text-dark outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">{t("allBranches")}</option>
              {branchOptions.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name || branch.branchName || branch.id}
                </option>
              ))}
            </select>
          </div>
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
            branchId={activeBranchId}
            onSuccess={triggerEmployeesRefresh}
          />
        )}

        {activeTab === "roles" && (
          <RolesTable
            refreshFlag={refreshRoles}
            branchId={activeBranchId}
            onSuccess={triggerRolesRefresh}
          />
        )}
      </div>
    </Container>
  );
};

export default EmployeesSettingsPage;
