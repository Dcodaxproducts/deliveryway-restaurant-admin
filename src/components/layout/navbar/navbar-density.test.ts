import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (file: string) =>
  readFileSync(new URL(file, import.meta.url), "utf8");

describe("navbar density", () => {
  it("keeps compact controls inside the 68px shell", () => {
    expect(read("./navbar.tsx")).toContain(
      'h-[67px] flex-nowrap items-center gap-x-3 py-3',
    );
    expect(read("./GlobalSearch.tsx")).toContain("flex h-10 items-center");
    expect(read("../../common/RestaurantPicker.tsx")).toContain(
      "flex h-10 w-full",
    );
    expect(read("./LanguageSelector.tsx")).toContain('className="h-9');
    expect(read("./notification.tsx")).toContain("lg:size-10");
    expect(read("./profile-section.tsx")).toContain("lg:size-10");
  });
});
