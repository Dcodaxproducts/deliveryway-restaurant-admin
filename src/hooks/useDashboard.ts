import { useQuery } from "@tanstack/react-query";
import {
  DashboardFilterParams,
  DashboardRecentActivityParams,
  DashboardTopRestaurantsParams,
  DashboardTrendParams,
  getCustomersStats,
  getDashboardRecentActivity,
  getDashboardSystemAlerts,
  getDeliverymenStats,
  getEmployeesStats,
  getOrdersStats,
  getOrdersTrend,
  getRestaurantsTrend,
  getRestaurantDashboardOverview,
  getRevenueTrend,
  getSuperAdminDashboardOverview,
  getTopPerformingRestaurants,
} from "@/services/dashboard/dashboard.api";

/**
 * ==============================
 * DASHBOARD HOOKS
 * ==============================
 */

export const useGetRestaurantDashboardOverview = (
  params?: DashboardFilterParams
) => {
  return useQuery({
    queryKey: [
      "dashboard",
      "restaurant-overview",
      params?.restaurantId,
      params?.branchId,
    ],
    queryFn: () => getRestaurantDashboardOverview(params),
  });
};

export const useGetSuperAdminDashboardOverview = () => {
  return useQuery({
    queryKey: ["dashboard", "super-admin-overview"],
    queryFn: getSuperAdminDashboardOverview,
  });
};

export const useGetRestaurantsTrend = (params?: DashboardTrendParams) => {
  return useQuery({
    queryKey: [
      "dashboard",
      "restaurants-trend",
      params?.restaurantId,
      params?.branchId,
      params?.range,
      params?.from,
      params?.to,
    ],
    queryFn: () => getRestaurantsTrend(params),
  });
};

export const useGetOrdersTrend = (params?: DashboardTrendParams) => {
  return useQuery({
    queryKey: [
      "dashboard",
      "orders-trend",
      params?.restaurantId,
      params?.branchId,
      params?.range,
      params?.from,
      params?.to,
    ],
    queryFn: () => getOrdersTrend(params),
  });
};

export const useGetRevenueTrend = (params?: DashboardTrendParams) => {
  return useQuery({
    queryKey: [
      "dashboard",
      "revenue-trend",
      params?.restaurantId,
      params?.branchId,
      params?.range,
      params?.from,
      params?.to,
    ],
    queryFn: () => getRevenueTrend(params),
  });
};

export const useGetOrdersStats = (params?: DashboardFilterParams) => {
  return useQuery({
    queryKey: [
      "dashboard",
      "orders-stats",
      params?.restaurantId,
      params?.branchId,
    ],
    queryFn: () => getOrdersStats(params),
  });
};

export const useGetCustomersStats = (params?: DashboardFilterParams) => {
  return useQuery({
    queryKey: [
      "dashboard",
      "customers-stats",
      params?.restaurantId,
      params?.branchId,
    ],
    queryFn: () => getCustomersStats(params),
  });
};

export const useGetDeliverymenStats = (params?: DashboardFilterParams) => {
  return useQuery({
    queryKey: [
      "dashboard",
      "deliverymen-stats",
      params?.restaurantId,
      params?.branchId,
    ],
    queryFn: () => getDeliverymenStats(params),
  });
};

export const useGetEmployeesStats = (params?: DashboardFilterParams) => {
  return useQuery({
    queryKey: [
      "dashboard",
      "employees-stats",
      params?.restaurantId,
      params?.branchId,
    ],
    queryFn: () => getEmployeesStats(params),
  });
};

export const useGetDashboardSystemAlerts = (
  params?: DashboardFilterParams
) => {
  return useQuery({
    queryKey: [
      "dashboard",
      "system-alerts",
      params?.restaurantId,
      params?.branchId,
    ],
    queryFn: () => getDashboardSystemAlerts(params),
  });
};

export const useGetDashboardRecentActivity = (
  params?: DashboardRecentActivityParams
) => {
  return useQuery({
    queryKey: [
      "dashboard",
      "recent-activity",
      params?.restaurantId,
      params?.branchId,
      params?.limit,
    ],
    queryFn: () => getDashboardRecentActivity(params),
  });
};

export const useGetTopPerformingRestaurants = (
  params?: DashboardTopRestaurantsParams
) => {
  return useQuery({
    queryKey: [
      "dashboard",
      "top-performing-restaurants",
      params?.restaurantId,
      params?.branchId,
      params?.limit,
    ],
    queryFn: () => getTopPerformingRestaurants(params),
  });
};