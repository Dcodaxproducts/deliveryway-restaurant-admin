import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getAnalyticsCapabilities,
  queryAnalyticsCopilot,
  type AnalyticsQueryInput,
  type AnalyticsScopeParams,
} from "@/services/analytics-copilot";

export const useAnalyticsCapabilities = (params?: AnalyticsScopeParams) =>
  useQuery({
    queryKey: [
      "analytics-copilot",
      "capabilities",
      params?.restaurantId,
      params?.branchId,
    ],
    queryFn: () => getAnalyticsCapabilities(params as AnalyticsScopeParams),
    enabled: Boolean(params?.restaurantId),
    staleTime: 60_000,
    retry: false,
  });
export const useAnalyticsCopilotQuery = () =>
  useMutation({
    mutationFn: (input: AnalyticsQueryInput) => queryAnalyticsCopilot(input),
  });
