import { describe, expect, it } from "vitest";

import { getWebpUploadFileName, isImageUploadFile, prepareUploadFile } from "./prepare-upload-file";

describe("prepare upload file", () => {
  it("maps image file names to webp", () => {
    expect(getWebpUploadFileName("menu.item.PNG")).toBe("menu.item.webp");
    expect(getWebpUploadFileName("logo")).toBe("logo.webp");
    expect(getWebpUploadFileName("/tmp/avatar.jpeg")).toBe("/tmp/avatar.webp");
  });

  it("preserves non-image files unchanged", async () => {
    const file = new File(["pdf"], "invoice.pdf", { type: "application/pdf" });

    expect(isImageUploadFile(file)).toBe(false);
    await expect(prepareUploadFile(file)).resolves.toEqual({ file, originalFile: file });
  });
});
