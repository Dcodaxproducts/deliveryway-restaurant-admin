import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FileUploadControl } from "@/components/ui/file-upload-control";

describe("FileUploadControl", () => {
  it("hides browser file chrome behind a shadcn button", () => {
    const markup = renderToStaticMarkup(
      <FileUploadControl
        id="catalog-file"
        buttonLabel="Choose file"
        fileName="catalog.csv"
      />,
    );

    expect(markup).toContain('data-slot="file-upload-control"');
    expect(markup).toContain('data-slot="button"');
    expect(markup).toContain('type="file"');
    expect(markup).toMatch(/class="[^"]*\bsr-only\b[^"]*"/);
    expect(markup).toContain("catalog.csv");
  });
});
