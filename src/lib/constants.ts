const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

if (!configuredApiBaseUrl) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is required");
}

export const API_BASE_URL = configuredApiBaseUrl.replace(/\/+$/, "");
export const CHAT_BASE_URL = new URL("/chat", API_BASE_URL).toString().replace(/\/$/, "");

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
