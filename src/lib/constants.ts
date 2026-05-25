const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL || "https://deliveryway.dcodax.co/api").replace(/\/+$/, "");

export const API_BASE_URL = rawApiUrl.endsWith("/v1")
  ? rawApiUrl.slice(0, -3)
  : rawApiUrl;

export const baseURL = API_BASE_URL.endsWith("/v1")
  ? API_BASE_URL
  : `${API_BASE_URL}/v1`;

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  USERS: "/dashboard/users",
  SETTINGS: "/dashboard/settings",
} as const;

export const USER_ROLES = {
  ADMIN: "admin",
  USER: "user",
} as const;

export const PAGINATION_LIMIT = 10;
