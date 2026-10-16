export const canAccessAnalyticsCopilot = (
  user?: { role?: string; actorType?: string } | null,
) => user?.role === "BUSINESS_ADMIN" && user.actorType !== "STAFF";
