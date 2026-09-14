import { describe, expect, it } from "vitest";
import {
  buildModifierGroupAssignment,
  normalizeMenuItemModifierGroupAssignments,
} from "@/lib/modifier-group-assignment-utils";

describe("modifier group assignment workflow", () => {
  it("builds item assignments from the modifier group's selection rules", () => {
    expect(
      buildModifierGroupAssignment({
        id: "group-1",
        name: "Choose sauces",
        description: "Pick sauces",
        minSelect: 1,
        maxSelect: 3,
        sortOrder: 4,
        modifiers: [],
      })
    ).toMatchObject({
      groupId: "group-1",
      selectionType: "MULTIPLE",
      minSelect: 1,
      maxSelect: 3,
      sortOrder: 4,
    });
  });

  it("prefers current group rules over stale item assignment overrides", () => {
    expect(
      normalizeMenuItemModifierGroupAssignments([
        {
          groupId: "group-1",
          selectionType: "MULTIPLE",
          minSelect: 0,
          maxSelect: 5,
          group: {
            id: "group-1",
            name: "Choose size",
            minSelect: 1,
            maxSelect: 1,
            sortOrder: 2,
          },
        },
      ])[0]
    ).toMatchObject({
      selectionType: "SINGLE",
      minSelect: 1,
      maxSelect: 1,
      sortOrder: 2,
    });
  });
});
