import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getAnalyticsCapabilities,
  queryAnalyticsCopilot,
} from "./analytics-copilot";
import { httpClient } from "@/lib/axios";

vi.mock("@/lib/axios", () => ({ httpClient: { get: vi.fn(), post: vi.fn() } }));

describe("analytics-copilot service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads capabilities with exact restaurant scope", async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: { enabled: false } });
    await getAnalyticsCapabilities({ restaurantId: "restaurant-1" });
    expect(httpClient.get).toHaveBeenCalledWith("/ai/analytics/capabilities", {
      params: { restaurantId: "restaurant-1" },
    });
  });

  it("posts only the typed bounded query contract", async () => {
    vi.mocked(httpClient.post).mockResolvedValue({ data: {} });
    const input = {
      requestId: "11111111-1111-4111-8111-111111111111",
      restaurantId: "restaurant-1",
      intent: "OVERVIEW" as const,
      period: "LAST_7_DAYS" as const,
      comparison: "PREVIOUS_PERIOD" as const,
      timezone: "Europe/Berlin",
      locale: "en" as const,
      question: "Why did revenue change?",
    };
    await queryAnalyticsCopilot(input);
    expect(httpClient.post).toHaveBeenCalledWith("/ai/analytics/query", input);
    expect(JSON.stringify(input)).not.toContain("sql");
  });
});
