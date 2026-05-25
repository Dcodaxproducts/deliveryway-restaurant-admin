import api from "@/lib/axios";

/**
 * ==============================
 * DASHBOARD TYPES
 * ==============================
 */

export type DashboardFilterParams = {
  restaurantId?: string;
  branchId?: string;
};

export type DashboardTrendParams = DashboardFilterParams & {
  range?: string;
  from?: string;
  to?: string;
};

export type DashboardRecentActivityParams = DashboardFilterParams & {
  limit?: number;
};

export type DashboardTopRestaurantsParams = DashboardFilterParams & {
  limit?: number;
};

/**
 * ==============================
 * DASHBOARD APIS
 * ==============================
 */

// Restaurant / branch admin overview cards
export const getRestaurantDashboardOverview = async (
  params?: DashboardFilterParams
) => {
  const { data } = await api.get(
    "/admin/dashboard/restaurant/overview",
    { params }
  );
  return data;
};

// Super-admin overview totals
export const getSuperAdminDashboardOverview = async () => {
  const { data } = await api.get("/admin/dashboard/overview");
  return data;
};

// Super-admin restaurant trend graph
export const getRestaurantsTrend = async (params?: DashboardTrendParams) => {
  const { data } = await api.get(
    "/admin/dashboard/restaurants/trend",
    { params }
  );
  return data;
};

// Orders trend graph
export const getOrdersTrend = async (params?: DashboardTrendParams) => {
  const { data } = await api.get("/admin/dashboard/orders/trend", {
    params,
  });
  return data;
};

// Revenue trend graph
export const getRevenueTrend = async (params?: DashboardTrendParams) => {
  const { data } = await api.get("/admin/dashboard/revenue/trend", {
    params,
  });
  return data;
};

// Order stats summary cards
export const getOrdersStats = async (params?: DashboardFilterParams) => {
  const { data } = await api.get("/admin/dashboard/orders/stats", {
    params,
  });
  return data;
};

// Customer stats summary cards
export const getCustomersStats = async (params?: DashboardFilterParams) => {
  const { data } = await api.get("/admin/dashboard/customers/stats", {
    params,
  });
  return data;
};

// Deliverymen stats summary cards
export const getDeliverymenStats = async (params?: DashboardFilterParams) => {
  const { data } = await api.get("/admin/dashboard/deliverymen/stats", {
    params,
  });
  return data;
};

// Employee stats summary cards
export const getEmployeesStats = async (params?: DashboardFilterParams) => {
  const { data } = await api.get("/admin/dashboard/employees/stats", {
    params,
  });
  return data;
};

// System alerts
export const getDashboardSystemAlerts = async (
  params?: DashboardFilterParams
) => {
  const { data } = await api.get("/admin/dashboard/system-alerts", {
    params,
  });
  return data;
};

// Recent activity
export const getDashboardRecentActivity = async (
  params?: DashboardRecentActivityParams
) => {
  const { data } = await api.get("/admin/dashboard/recent-activity", {
    params,
  });
  return data;
};

// Top-performing restaurants
export const getTopPerformingRestaurants = async (
  params?: DashboardTopRestaurantsParams
) => {
  const { data } = await api.get(
    "/admin/dashboard/restaurants/top-performing",
    { params }
  );
  return data;
};