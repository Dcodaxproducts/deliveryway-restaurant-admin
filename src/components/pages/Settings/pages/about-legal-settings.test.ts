import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("About legal settings route", () => {
  it("keeps About content and Legal & Tax editing in one accessible settings area", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/components/pages/Settings/pages/AboutLegalSettingsPage.tsx"),
      "utf8",
    );
    expect(source).toContain("<AboutUsRoutePage />");
    expect(source).toContain("<LegalProfilePage />");
    expect(source).toContain('role="tablist"');
    expect(source).toContain('role="tabpanel"');
  });
});
