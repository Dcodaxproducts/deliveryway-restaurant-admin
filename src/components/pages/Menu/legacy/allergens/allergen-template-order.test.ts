import { describe, expect, it } from "vitest";

import {
  moveAllergenTemplate,
  moveAllergenTemplateByOffset,
  type OrderedAllergenTemplate,
} from "./allergen-template-order";

const templates: OrderedAllergenTemplate[] = [
  { code: "1", label: "Gluten", type: "allergens" },
  { code: "2", label: "Milk", type: "allergens" },
  { code: "10", label: "Colorant", type: "additives" },
  { code: "11", label: "Sweetener", type: "additives" },
];

describe("allergen and additive template ordering", () => {
  it("reorders templates only within their own type", () => {
    expect(
      moveAllergenTemplate(templates, "allergens-2", "allergens-1").map(
        (item) => item.code,
      ),
    ).toEqual(["2", "1", "10", "11"]);

    expect(
      moveAllergenTemplate(templates, "allergens-1", "additives-10"),
    ).toBe(templates);
  });

  it("supports accessible one-step moves", () => {
    expect(
      moveAllergenTemplateByOffset(templates, "additives-11", -1).map(
        (item) => item.code,
      ),
    ).toEqual(["1", "2", "11", "10"]);

    expect(
      moveAllergenTemplateByOffset(templates, "allergens-1", -1),
    ).toBe(templates);
  });
});

