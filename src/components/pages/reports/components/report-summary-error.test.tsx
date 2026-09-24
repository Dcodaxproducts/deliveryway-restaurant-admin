import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ReportSummaryError } from "./report-summary-error";

describe("ReportSummaryError", () => {
  it("shows a visible error and retry action instead of false-zero values", () => {
    const html = renderToStaticMarkup(
      <ReportSummaryError
        message="Selected-period values are unavailable"
        retryLabel="Retry"
        onRetry={vi.fn()}
      />,
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain("Selected-period values are unavailable");
    expect(html).toContain(">Retry</button>");
    expect(html).not.toContain(">0<");
  });
});
