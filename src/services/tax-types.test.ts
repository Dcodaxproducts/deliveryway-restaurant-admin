import { beforeEach, describe, expect, it, vi } from "vitest";

import { httpClient } from "@/lib/axios";
import {
  getMenuItemTaxTypes,
  MENU_ITEM_TAX_TYPES_ENDPOINT,
} from "@/services/tax-types";
import { normalizeTaxTypesResponse } from "@/types/tax-types";

vi.mock("@/lib/axios", () => ({
  httpClient: {
    get: vi.fn(),
  },
}));

const mockedGet = vi.mocked(httpClient.get);

describe("tax types service", () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it("GET calls configured tax types endpoint without api prefix duplication", async () => {
    mockedGet.mockResolvedValueOnce({
      data: [
        {
          code: "STANDARD",
          label: "Standard tax",
          percentage: 19,
          isActive: true,
          isDefault: true,
        },
      ],
    });

    await getMenuItemTaxTypes();

    expect(mockedGet).toHaveBeenCalledWith(MENU_ITEM_TAX_TYPES_ENDPOINT);
    expect(MENU_ITEM_TAX_TYPES_ENDPOINT).toBe("/admin/global-settings/tax-types");
    expect(MENU_ITEM_TAX_TYPES_ENDPOINT).not.toContain("/api/v1");
  });

  it("normalizes valid tax types and uppercases codes", () => {
    const result = normalizeTaxTypesResponse({
      data: [
        {
          code: "standard",
          label: "Standard tax",
          percentage: "19",
          isActive: true,
          isDefault: true,
        },
        {
          code: "REDUCED",
          label: "Reduced tax",
          percentage: 7,
          isActive: true,
          isDefault: false,
        },
      ],
      message: "Tax types fetched successfully",
    });

    expect(result).toEqual({
      taxTypes: [
        {
          code: "STANDARD",
          label: "Standard tax",
          percentage: 19,
          isActive: true,
          isDefault: true,
        },
        {
          code: "REDUCED",
          label: "Reduced tax",
          percentage: 7,
          isActive: true,
          isDefault: false,
        },
      ],
      message: "Tax types fetched successfully",
    });
  });

  it("handles nested response data and skips invalid rows", () => {
    const result = normalizeTaxTypesResponse({
      data: {
        items: [
          {
            code: "STANDARD",
            label: "Standard tax",
            percentage: 19,
            isActive: true,
            isDefault: true,
          },
          {
            code: "",
            label: "Invalid tax",
            percentage: 0,
            isActive: true,
          },
        ],
      },
    });

    expect(result.taxTypes).toEqual([
      {
        code: "STANDARD",
        label: "Standard tax",
        percentage: 19,
        isActive: true,
        isDefault: true,
      },
    ]);
  });
});
