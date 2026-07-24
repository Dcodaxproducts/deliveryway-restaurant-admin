import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_LOCALE,
  getRequestLocale,
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  normalizeLocale,
} from "@/config/i18n";

describe("i18n config", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses German as the default locale", () => {
    expect(DEFAULT_LOCALE).toBe("de");
  });

  it("supports English and German", () => {
    expect(SUPPORTED_LOCALES).toEqual(["en", "de"]);
  });

  it("falls back unsupported locales to German", () => {
    expect(normalizeLocale("fr")).toBe("de");
    expect(normalizeLocale(null)).toBe("de");
    expect(normalizeLocale("de")).toBe("de");
  });

  it("uses the shared locale storage key", () => {
    expect(LOCALE_STORAGE_KEY).toBe("deliveryway-admin-locale");
  });

  it("uses the persisted admin locale for API requests", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: vi.fn().mockReturnValue("de"),
      },
    });

    expect(getRequestLocale()).toBe("de");
  });

  it("falls back to German when locale storage is unavailable", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: vi.fn(() => {
          throw new Error("Storage blocked");
        }),
      },
    });

    expect(getRequestLocale()).toBe("de");
  });
});
