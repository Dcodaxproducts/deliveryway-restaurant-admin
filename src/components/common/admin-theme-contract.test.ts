import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const styles = readFileSync(
  new URL("../../app/globals.css", import.meta.url),
  "utf8",
);

describe("admin theme contract", () => {
  it("uses the FeastFlow orange as the environment-independent primary token", () => {
    expect(styles).toContain(
      "--brand-primary: oklch(70.5% 0.213 47.604);",
    );
    expect(styles).toContain("--primary: var(--brand-primary);");
    expect(styles).toContain("--ring: var(--brand-primary);");
    expect(styles).toContain("--sidebar-primary: var(--brand-primary);");
  });
});
