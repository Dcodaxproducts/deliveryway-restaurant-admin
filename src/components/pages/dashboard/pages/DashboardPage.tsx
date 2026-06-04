"use client";

import Container from "@/components/common/Container";
import AnalyticsGrid from "@/components/pages/Dashboard/components/dashboard/order-trend-section";
import RevenueAnalytics from "@/components/pages/Dashboard/components/dashboard/revenue-trend-section";
import StatsSection from "@/components/common/stats-section";
import Header from "@/components/common/PageHeader";
import { managementData } from "@/config/dashboard";
import ManagementSection from "@/components/pages/Dashboard/components/dashboard/ManagementSection";
import { useAuth } from "@/hooks/useAuth";
import { useGetRestaurantDashboardOverview } from "@/hooks/useDashboard";
import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("dashboard");
  const { restaurantId, branchId, isBranchAdmin, loading: authLoading } = useAuth();
  const scopedDashboardParams = restaurantId
    ? {
        restaurantId,
        ...(isBranchAdmin && branchId ? { branchId } : {}),
      }
    : undefined;

  const dashboardManagementItems = isBranchAdmin
    ? managementData
        .filter((item) => item.id !== "promotions")
        .map((item) =>
          item.id === "restaurants"
            ? {
                ...item,
                title: t("management.branchWorkspaceTitle"),
                description: t("management.branchWorkspaceDescription"),
                actionLabel: t("management.branchWorkspaceAction"),
                actionHref: "/branch-workspace",
              }
            : item
        )
    : managementData;

  const translatedManagementItems = dashboardManagementItems.map((item) => {
    const keyById: Record<string, string> = {
      restaurants: "restaurants",
      menu: "menu",
      orders: "orders",
      pos: "pos",
      customers: "customers",
      delivery: "delivery",
      employees: "employees",
      reports: "reports",
      promotions: "promotions",
    };
    const key = item.actionHref === "/branch-workspace" ? "branchWorkspace" : keyById[item.id];

    if (!key) return item;

    return {
      ...item,
      title: t(`management.${key}Title`),
      description: t(`management.${key}Description`),
      actionLabel: t(`management.${key}Action`),
    };
  });

  const {
    data: dashboardOverviewResponse,
    isLoading,
    isFetching,
  } = useGetRestaurantDashboardOverview(scopedDashboardParams);

  const overview = dashboardOverviewResponse?.data;

  const statsData = [
    {
      _id: "total-orders",
      title: t("totalOrders"),
      value: overview?.totalOrders ?? 0,
      icon: "orders",
      iconStyle: "default",
      trend: {
        direction: "up",
        percentage: t("activeSuffix", { count: overview?.activeOrders ?? 0 }),
      },
    },
    {
      _id: "total-revenue",
      title: t("totalRevenue"),
      value: `${Number(overview?.totalRevenue ?? 0).toLocaleString()}`,
      icon: "revenue",
      iconStyle: "default",
      trend: {
        direction: "up",
        percentage: t("averagePrefix", {
          value: Number(overview?.averageOrderValue ?? 0).toLocaleString(),
        }),
      },
    },
    {
      _id: "total-customers",
      title: t("totalCustomers"),
      value: overview?.totalCustomers ?? 0,
      icon: "users",
      iconStyle: "default",
      trend: {
        direction: "up",
        percentage: t("activeSuffix", { count: overview?.activeCustomers ?? 0 }),
      },
    },
    {
      _id: "deliverymen",
      title: t("availableDeliverymen"),
      value: overview?.availableDeliverymen ?? 0,
      icon: "ongoing",
      iconStyle: "default",
      trend: {
        direction: "up",
        percentage: t("totalSuffix", { count: overview?.totalDeliverymen ?? 0 }),
      },
    },
    {
      _id: "employees",
      title: t("activeEmployees"),
      value: overview?.activeEmployees ?? 0,
      icon: "completed",
      iconStyle: "default",
      trend: {
        direction: "up",
        percentage: t("totalSuffix", { count: overview?.totalEmployees ?? 0 }),
      },
    },
  ] as any;

  const statsLoading = authLoading || isLoading || isFetching;

  return (
    <Container className="max-w-full overflow-x-clip">
      <Header
        title={isBranchAdmin ? t("branchOverviewTitle") : t("overviewTitle")}
        description={
          isBranchAdmin
            ? t("branchOverviewDescription")
            : t("overviewDescription")
        }
      />

      <StatsSection
        stats={statsData}
        loading={statsLoading}
        className="xl:grid-cols-5"
      />

      <ManagementSection items={translatedManagementItems} />

      <AnalyticsGrid />

      <RevenueAnalytics />
    </Container>
  );
}
