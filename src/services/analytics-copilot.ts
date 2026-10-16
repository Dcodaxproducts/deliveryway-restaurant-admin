import { httpClient } from "@/lib/axios";

export type AnalyticsIntent =
  | "OVERVIEW"
  | "REVENUE"
  | "BUSY_HOURS"
  | "CANCELLATIONS"
  | "PAYMENT_TYPES"
  | "POPULAR_ITEMS"
  | "STAFF_PERFORMANCE";
export type AnalyticsPeriod = "LAST_7_DAYS" | "LAST_30_DAYS";
export type AnalyticsMetric = {
  id: string;
  label: string;
  value: number;
  unit: "currency" | "count" | "percent" | "hour";
  comparisonValue?: number;
  changePercent?: number | null;
};
export type AnalyticsCopilotResponse = {
  requestId: string;
  mode: "AI" | "DETERMINISTIC_FALLBACK";
  intent: AnalyticsIntent;
  generatedAt: string;
  period: { fromDate: string; toDate: string; timezone: string };
  comparison: { fromDate: string; toDate: string } | null;
  currency: string;
  answer: {
    summary: string;
    insights: Array<{
      title: string;
      detail: string;
      evidenceMetricIds: string[];
    }>;
    caveats: string[];
    followUpQuestions: string[];
  };
  evidence: {
    metrics: AnalyticsMetric[];
    paymentTypes: Array<{
      paymentMethod: string;
      count: number;
      revenue: number;
    }>;
    popularItems: Array<{
      menuItemId: string;
      name: string;
      quantity: number;
      revenue: number;
    }>;
    busyHours: Array<{ hour: number; orderCount: number; revenue: number }>;
    staffPerformance: Array<{
      staffRef: string;
      displayName: string;
      activityCount: number;
    }>;
    definitions: string[];
  };
  fallbackReason?: string;
};
export type AnalyticsCapabilities = {
  enabled: boolean;
  available: boolean;
  providerConfigured: boolean;
  deterministicFallbackAvailable: boolean;
  readOnly: boolean;
  supportedIntents: AnalyticsIntent[];
  supportedPeriods: string[];
  maxPeriodDays: number;
  examples: string[];
};
export type AnalyticsScopeParams = { restaurantId: string; branchId?: string };
export type AnalyticsQueryInput = AnalyticsScopeParams & {
  requestId: string;
  intent: AnalyticsIntent;
  period: AnalyticsPeriod;
  comparison: "NONE" | "PREVIOUS_PERIOD";
  timezone: string;
  locale: "en" | "de";
  question: string;
};

export const getAnalyticsCapabilities = (params: AnalyticsScopeParams) =>
  httpClient.get<{
    success: boolean;
    data: AnalyticsCapabilities;
    message?: string;
  }>("/ai/analytics/capabilities", { params });
export const queryAnalyticsCopilot = (input: AnalyticsQueryInput) =>
  httpClient.post<
    { success: boolean; data: AnalyticsCopilotResponse; message?: string },
    AnalyticsQueryInput
  >("/ai/analytics/query", input);
