import { afterEach, describe, expect, it, vi } from "vitest";

import { LOCALE_STORAGE_KEY } from "@/config/i18n";

import { api } from "./axios";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("admin API request context", () => {
  it("adds the persisted locale to first-party API requests", async () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: vi.fn((key: string) =>
          key === LOCALE_STORAGE_KEY ? "de" : null,
        ),
      },
    });
    let acceptLanguage: string | undefined;

    await api.get("/restaurants", {
      adapter: async (config) => {
        acceptLanguage = config.headers.get("Accept-Language")?.toString();

        return {
          config,
          data: {},
          headers: {},
          status: 200,
          statusText: "OK",
        };
      },
    });

    expect(acceptLanguage).toBe("de");
  });
});
