import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { getAdjacentSettingsTab } from "./about-legal-settings-tabs";

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
    expect(source).toContain("aria-labelledby");
    expect(source).toContain("onKeyDown");
  });

  it("supports the standard tab arrow, Home, and End keys", () => {
    expect(getAdjacentSettingsTab("about", "ArrowRight")).toBe("legal");
    expect(getAdjacentSettingsTab("legal", "ArrowRight")).toBe("about");
    expect(getAdjacentSettingsTab("about", "ArrowLeft")).toBe("legal");
    expect(getAdjacentSettingsTab("legal", "Home")).toBe("about");
    expect(getAdjacentSettingsTab("about", "End")).toBe("legal");
  });
});
