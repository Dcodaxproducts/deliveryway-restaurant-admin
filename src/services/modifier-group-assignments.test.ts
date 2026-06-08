import { beforeEach, describe, expect, it, vi } from "vitest";

import { httpClient } from "@/lib/axios";
import {
  assignModifierGroupToCategory,
  assignModifierGroupToItem,
  detachModifierGroupFromItem,
} from "@/services/modifier-group-assignments";

vi.mock("@/lib/axios", () => ({
  httpClient: {
    delete: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedDelete = vi.mocked(httpClient.delete);
const mockedPost = vi.mocked(httpClient.post);

describe("modifier group assignment service", () => {
  beforeEach(() => {
    mockedDelete.mockReset();
    mockedPost.mockReset();
  });

  it("assigns a modifier group to a menu item", async () => {
    mockedPost.mockResolvedValueOnce({ success: true });

    await assignModifierGroupToItem("item-1", "group-1", {
      selectionType: "MULTIPLE",
      minSelect: 1,
      maxSelect: 3,
      sortOrder: 2,
    });

    expect(mockedPost).toHaveBeenCalledWith(
      "/menu/items/item-1/modifier-groups/group-1",
      {
        selectionType: "MULTIPLE",
        minSelect: 1,
        maxSelect: 3,
        sortOrder: 2,
      }
    );
    expect(mockedPost.mock.calls[0]?.[0]).not.toContain("/api/v1");
  });

  it("detaches a modifier group from a menu item", async () => {
    mockedDelete.mockResolvedValueOnce({ success: true });

    await detachModifierGroupFromItem("item-1", "group-1");

    expect(mockedDelete).toHaveBeenCalledWith(
      "/menu/items/item-1/modifier-groups/group-1"
    );
    expect(mockedDelete.mock.calls[0]?.[0]).not.toContain("/api/v1");
  });

  it("assigns a modifier group to a menu category", async () => {
    mockedPost.mockResolvedValueOnce({ success: true });

    await assignModifierGroupToCategory("category-1", "group-1", {
      selectionType: "SINGLE",
      minSelect: 1,
      maxSelect: 1,
      sortOrder: 1,
    });

    expect(mockedPost).toHaveBeenCalledWith(
      "/menu/categories/category-1/modifier-groups/group-1",
      {
        selectionType: "SINGLE",
        minSelect: 1,
        maxSelect: 1,
        sortOrder: 1,
      }
    );
    expect(mockedPost.mock.calls[0]?.[0]).not.toContain("/api/v1");
  });
});
