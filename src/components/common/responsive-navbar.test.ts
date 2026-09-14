import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  new URL("./RestaurantPicker.tsx", import.meta.url),
  "utf8",
);

describe("responsive restaurant picker", () => {
  it("uses a bottom sheet on mobile and preserves the desktop dropdown", () => {
    expect(source).toContain("const isMobile = useIsMobile()");
    expect(source).toContain('<SheetContent\n            side="bottom"');
    expect(source).toContain("max-h-[85dvh]");
    expect(source).toContain('className="relative"');
    expect(source).toContain('id="restaurant-picker-options"');
  });
});
