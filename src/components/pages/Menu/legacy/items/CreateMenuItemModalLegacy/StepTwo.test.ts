import { describe, expect, it } from "vitest";

import {
  normalizeLabelOptions,
  normalizeTemplateOptions,
} from "./metadata-options";

describe("menu item metadata selector options", () => {
  it("shows allergen and additive codes with their labels", () => {
    const response = {
      data: {
        allergens: [{ code: "1", label: "Gluten" }],
        additives: [{ code: "10", label: "Preservative" }],
      },
    };

    expect(normalizeTemplateOptions(response, "allergens")).toEqual([
      {
        code: "1",
        label: "Gluten",
        displayLabel: "1 — Gluten",
      },
    ]);
    expect(normalizeTemplateOptions(response, "additives")).toEqual([
      {
        code: "10",
        label: "Preservative",
        displayLabel: "10 — Preservative",
      },
    ]);
  });

  it("keeps product-label selector rows readable", () => {
    expect(
      normalizeLabelOptions({
        data: { labels: [{ value: "vegan", label: "Vegan" }] },
      }),
    ).toEqual([
      {
        value: "vegan",
        label: "Vegan",
        displayLabel: "Vegan",
      },
    ]);
  });
});
