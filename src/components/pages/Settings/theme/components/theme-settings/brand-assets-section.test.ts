import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const readJson = (fileName: string) =>
  JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "src/messages", fileName), "utf8"),
  ) as { settings: { assets: Record<string, string> } };

describe("brand asset localization", () => {
  it("provides equivalent English and German favicon and placeholder controls", () => {
    const en = readJson("en.json").settings.assets;
    const de = readJson("de.json").settings.assets;

    expect(Object.keys(de).sort()).toEqual(Object.keys(en).sort());
    expect(en.favicon).toBe("Favicon");
    expect(de.placeholderImage).toBe("Platzhalterbild");
    expect(en.uploadLabel).toContain("{title}");
    expect(de.clearLabel).toContain("{title}");
  });

  it("does not hardcode asset labels or upload actions in the components", () => {
    const section = fs.readFileSync(
      path.join(process.cwd(), "src/components/pages/Settings/theme/components/theme-settings/brand-assets-section.tsx"),
      "utf8",
    );
    const uploader = fs.readFileSync(
      path.join(process.cwd(), "src/components/pages/Settings/theme/components/theme-settings/file-uploader.tsx"),
      "utf8",
    );

    expect(section).toContain('useTranslations("settings")');
    expect(section).not.toContain('title: "Placeholder Image"');
    expect(uploader).toContain('useTranslations("settings.assets")');
    expect(uploader).not.toContain('Uploading...');
    expect(uploader).toContain("if (!result?.fileUrl)");
    expect(uploader).toContain("revokeLocalPreview();");
  });
});
