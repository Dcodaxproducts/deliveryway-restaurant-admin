import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/lib/axios";
import { extractFaqItems, getFaq } from "@/services/faqs";

vi.mock("@/lib/axios", () => ({
  api: {
    get: vi.fn(),
  },
}));

const mockedGet = vi.mocked(api.get);

describe("FAQ service", () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it("extracts FAQ records from the restaurant data.items envelope", () => {
    expect(
      extractFaqItems({
        data: {
          restaurantId: "restaurant-1",
          items: [
            {
              id: "faq-1",
              question: "How do refunds work?",
              answer: "Within five business days.",
              category: "Payments",
              status: "PUBLISHED",
              visibility: "PUBLIC",
            },
          ],
        },
      }),
    ).toEqual([
      expect.objectContaining({
        id: "faq-1",
        question: "How do refunds work?",
      }),
    ]);
  });

  it("returns the selected FAQ for edit prefill", async () => {
    mockedGet.mockResolvedValue({
      data: {
        data: {
          items: [
            {
              id: "faq-1",
              question: "First",
              answer: "First answer",
              category: "Orders",
              status: "DRAFT",
              visibility: "PRIVATE",
            },
            {
              id: "faq-2",
              question: "Second",
              answer: "Second answer",
              category: "Payments",
              status: "PUBLISHED",
              visibility: "PUBLIC",
            },
          ],
        },
      },
    });

    await expect(getFaq("restaurant-1", "faq-2")).resolves.toEqual(
      expect.objectContaining({
        id: "faq-2",
        question: "Second",
      }),
    );
  });
});
