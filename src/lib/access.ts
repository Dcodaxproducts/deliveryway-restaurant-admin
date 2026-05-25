export const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
] as const;

export const isPublicRoute = (pathname: string) =>
  PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
