import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "@/messages/en.json";
import { AnalyticsCopilot, AnalyticsCopilotResult } from "./AnalyticsCopilot";
import type { AnalyticsCopilotResponse } from "@/services/analytics-copilot";

const useCapabilities = vi.fn();
const useQuery = vi.fn();
vi.mock("@/hooks/useAnalyticsCopilot", () => ({
  useAnalyticsCapabilities: (...args: unknown[]) => useCapabilities(...args),
  useAnalyticsCopilotQuery: () => useQuery(),
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/reports" }));

const result: AnalyticsCopilotResponse = {
  requestId: "request-1",
  mode: "DETERMINISTIC_FALLBACK",
  intent: "OVERVIEW",
  generatedAt: "2026-10-16T08:00:00.000Z",
  period: {
    fromDate: "2026-10-10",
    toDate: "2026-10-16",
    timezone: "Europe/Berlin",
  },
  comparison: { fromDate: "2026-10-03", toDate: "2026-10-09" },
  currency: "EUR",
  answer: {
    summary: "12 successful orders generated €420.",
    insights: [
      {
        title: "Revenue",
        detail: "Revenue was €420.",
        evidenceMetricIds: ["revenue"],
      },
    ],
    caveats: [],
    followUpQuestions: [],
  },
  evidence: {
    metrics: [
      {
        id: "revenue",
        label: "Revenue",
        value: 420,
        unit: "currency",
        comparisonValue: 400,
        changePercent: 5,
      },
    ],
    paymentTypes: [{ paymentMethod: "COD", count: 5, revenue: 175 }],
    popularItems: [
      { menuItemId: "item-1", name: "Burger", quantity: 8, revenue: 160 },
    ],
    busyHours: [{ hour: 18, orderCount: 6, revenue: 210 }],
    staffPerformance: [
      { staffRef: "staff-1", displayName: "Alex", activityCount: 9 },
    ],
    definitions: ["Successful statuses only."],
  },
  fallbackReason: "AI_KEY_MISSING",
};

const render = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      {node}
    </NextIntlClientProvider>,
  );
const baseQuery = {
  isPending: false,
  isError: false,
  data: undefined,
  mutate: vi.fn(),
};

describe("AnalyticsCopilot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useQuery.mockReturnValue(baseQuery);
  });

  it("renders accessible loading, disabled, and empty states", () => {
    useCapabilities.mockReturnValueOnce({ isLoading: true, isError: false });
    expect(render(<AnalyticsCopilot restaurantId="restaurant-1" />)).toContain(
      "Checking availability",
    );
    useCapabilities.mockReturnValueOnce({
      isLoading: false,
      isError: false,
      data: { data: { enabled: false } },
    });
    expect(render(<AnalyticsCopilot restaurantId="restaurant-1" />)).toContain(
      "Analytics Copilot is not enabled",
    );
    useCapabilities.mockReturnValueOnce({
      isLoading: false,
      isError: false,
      data: { data: { enabled: true, examples: ["a", "b", "c", "d"] } },
    });
    const empty = render(<AnalyticsCopilot restaurantId="restaurant-1" />);
    expect(empty).toContain('id="analytics-copilot-question"');
    expect(empty).toContain("Ask a read-only analytics question");
    expect(empty).toContain("Read-only");
  });

  it("renders query error without displaying false metrics", () => {
    useCapabilities.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { data: { enabled: true, examples: ["a", "b", "c", "d"] } },
    });
    useQuery.mockReturnValue({ ...baseQuery, isError: true });
    const html = render(<AnalyticsCopilot restaurantId="restaurant-1" />);
    expect(html).toContain('role="alert"');
    expect(html).toContain("Unable to generate the analysis");
    expect(html).not.toContain("€0.00");
  });

  it("shows deterministic disclosure, evidence, definitions, and timestamp without model details", () => {
    const html = render(<AnalyticsCopilotResult result={result} />);
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain("Deterministic summary");
    expect(html).toContain("€420.00");
    expect(html).toContain("COD");
    expect(html).toContain("Burger");
    expect(html).toContain("18:00");
    expect(html).toContain("Alex");
    expect(html).toContain("Metric definitions");
    expect(html).not.toContain("AI_KEY_MISSING");
    expect(html).not.toContain("gpt-");
  });
});
