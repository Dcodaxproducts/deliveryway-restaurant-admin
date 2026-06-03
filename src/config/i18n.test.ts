import { describe, expect, it } from "vitest";

import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  normalizeLocale,
} from "@/config/i18n";

describe("i18n config", () => {
  it("uses English as the default locale", () => {
    expect(DEFAULT_LOCALE).toBe("en");
  });

  it("supports English and German", () => {
    expect(SUPPORTED_LOCALES).toEqual(["en", "de"]);
  });

  it("falls back unsupported locales to English", () => {
    expect(normalizeLocale("fr")).toBe("en");
    expect(normalizeLocale(null)).toBe("en");
    expect(normalizeLocale("de")).toBe("de");
  });

  it("uses the shared locale storage key", () => {
    expect(LOCALE_STORAGE_KEY).toBe("deliveryway-admin-locale");
  });
});
